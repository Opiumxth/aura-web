/**
 * Verificación de esquema y endpoints para flujos submission / similitud.
 * Ejecutar: node scripts/verify-flows.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const nvidiaKey = process.env.NVIDIA_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
}

async function columnExists(table, col) {
  const { error } = await supabase.from(table).select(col).limit(1);
  return !error;
}

async function main() {
  const challengeOk = await columnExists('challenges', 'id');
  challengeOk ? pass('Tabla challenges') : fail('Tabla challenges');

  const subCols = ['id', 'challenge_id', 'user_id', 'executive_summary', 'status', 'submitted_at'];
  for (const c of subCols) {
    (await columnExists('submissions', c))
      ? pass(`submissions.${c}`)
      : fail(`submissions.${c}`, 'columna requerida');
  }

  const hasCreatedAt = await columnExists('submissions', 'created_at');
  if (hasCreatedAt) pass('submissions.created_at (legacy)');
  else pass('submissions usa submitted_at (no created_at)', 'UI alineada a submitted_at');

  for (const c of ['submission_id', 'type', 'url']) {
    (await columnExists('submission_assets', c))
      ? pass(`submission_assets.${c}`)
      : fail(`submission_assets.${c}`);
  }

  for (const c of ['submission_id', 'score', 'textual_feedback', 'plagiarism_flag', 'ai_summary']) {
    (await columnExists('evaluations', c))
      ? pass(`evaluations.${c}`)
      : fail(`evaluations.${c}`);
  }

  const hasEvaluator = await columnExists('evaluations', 'evaluator_id');
  hasEvaluator
    ? pass('evaluations.evaluator_id')
    : pass('evaluations sin evaluator_id', 'insert sin ese campo');

  const { error: joinErr } = await supabase
    .from('submissions')
    .select('*, profiles!user_id(full_name)')
    .limit(1);
  joinErr
    ? pass('Join submissions→profiles', `manual fetch en UI: ${joinErr.message}`)
    : pass('Join submissions→profiles FK');

  const { data: challenges } = await supabase.from('challenges').select('id, organization_id').limit(1);
  if (challenges?.length) {
    pass('Challenges legibles (anon)', challenges[0].id);
  } else {
    fail('Challenges visibles', 'RLS o tabla vacía');
  }

  const { error: fnErr } = await supabase.functions.invoke('generate-embedding', {
    body: {
      submission_id: '00000000-0000-0000-0000-000000000001',
      text: 'test de verificación',
      challenge_id: challenges?.[0]?.id || '00000000-0000-0000-0000-000000000002',
      user_id: '00000000-0000-0000-0000-000000000003',
    },
  });
  fnErr
    ? fail('Edge Function generate-embedding', fnErr.message)
    : pass('Edge Function generate-embedding');

  nvidiaKey
    ? pass('NVIDIA_API_KEY en .env (scripts locales)')
    : fail('NVIDIA_API_KEY en .env', 'añádela en .env y en Supabase Edge Secrets');

  console.log('\n=== Verificación de flujos (esquema/API) ===\n');
  for (const r of results) {
    console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} comprobaciones OK\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
