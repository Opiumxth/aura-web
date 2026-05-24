import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SIMILARITY_THRESHOLD = 0.85;
const EMBEDDING_MODEL = 'nvidia/nv-embedqa-e5-v5';
const EMBEDDING_DIM = 1024;

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function parseEmbeddingVector(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

async function fetchNvidiaEmbedding(text, apiKey) {
  const response = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: [text],
      input_type: 'passage',
      encoding_format: 'float',
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.message || `NVIDIA API ${response.status}`);
  }

  const vector = body?.data?.[0]?.embedding;
  if (!Array.isArray(vector)) {
    throw new Error('Respuesta NVIDIA sin embedding válido');
  }
  return vector;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { submission_id, text, challenge_id, user_id } = await req.json();

    if (!submission_id || !text?.trim() || !challenge_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Faltan submission_id, text, challenge_id o user_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const nvidiaKey = Deno.env.get('NVIDIA_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!nvidiaKey) {
      return new Response(JSON.stringify({ error: 'NVIDIA_API_KEY no configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase service env missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const embedding = await fetchNvidiaEmbedding(text.trim(), nvidiaKey);

    if (embedding.length !== EMBEDDING_DIM) {
      console.warn(`Embedding dim ${embedding.length}, expected ${EMBEDDING_DIM}`);
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ embedding })
      .eq('id', submission_id);

    if (updateError) throw updateError;

    const { data: peers, error: peersError } = await supabase
      .from('submissions')
      .select('id, user_id, embedding')
      .eq('challenge_id', challenge_id)
      .neq('id', submission_id)
      .not('embedding', 'is', null);

    if (peersError) throw peersError;

    let maxSimilarity = 0;
    let matchedSubmissionId = null;

    for (const peer of peers || []) {
      const peerVector = parseEmbeddingVector(peer.embedding);
      if (!peerVector) continue;
      const similarity = cosineSimilarity(embedding, peerVector);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        matchedSubmissionId = peer.id;
      }
    }

    const plagiarism_flag = maxSimilarity >= SIMILARITY_THRESHOLD;
    const ai_summary = plagiarism_flag
      ? `Similitud ${(maxSimilarity * 100).toFixed(1)}% con entrega ${matchedSubmissionId?.slice(0, 8) ?? 'otra'}`
      : null;

    const { data: existingEval } = await supabase
      .from('evaluations')
      .select('id, score, textual_feedback')
      .eq('submission_id', submission_id)
      .maybeSingle();

    if (existingEval?.id) {
      const { error: evalUpdateError } = await supabase
        .from('evaluations')
        .update({ plagiarism_flag, ai_summary })
        .eq('id', existingEval.id);
      if (evalUpdateError) throw evalUpdateError;
    } else {
      const { error: evalInsertError } = await supabase.from('evaluations').insert([
        {
          submission_id,
          evaluator_user_id: user_id,
          plagiarism_flag,
          ai_summary,
          score: null,
          textual_feedback: null,
        },
      ]);
      if (evalInsertError) throw evalInsertError;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        submission_id,
        plagiarism_flag,
        max_similarity: maxSimilarity,
        ai_summary,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (err) {
    console.error('generate-embedding error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
