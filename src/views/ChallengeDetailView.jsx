import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Send, UploadCloud, FileText, Calendar, Award, Code2, Building2, AlertTriangle, Users, Eye, CheckCircle, Star, ChevronDown, ChevronUp } from 'lucide-react';

const PLAGIARISM_ALERT_STYLE = {
  border: '1px solid #ef4444',
  background: 'rgba(239,68,68,0.1)',
  padding: '8px 12px',
  color: '#ef4444',
  fontFamily: 'monospace',
  fontSize: '11px',
};

export default function ChallengeDetailView({ selectedChallenge, setCurrentView, user }) {
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [existingSubmission, setExistingSubmission] = useState(null);
  const [existingAsset, setExistingAsset] = useState(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  const [submissions, setSubmissions] = useState([]);
  const [evaluationsMap, setEvaluationsMap] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [evalForms, setEvalForms] = useState({});
  const [savingEval, setSavingEval] = useState({});
  const [expandedEvalId, setExpandedEvalId] = useState(null);

  const [orgName, setOrgName] = useState('Organización');

  const isOrganizationUser =
    user?.role === 'organization' || user?.role === 'company';
  const canManageChallenge =
    isOrganizationUser &&
    !!selectedChallenge?.organization_id &&
    selectedChallenge.organization_id === user?.id;

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const loadEvaluations = useCallback(async (submissionIds) => {
    console.log('loadEvaluations llamado con submissionIds:', submissionIds);
    console.log('Usuario actual:', user?.id, user?.role);
    if (!submissionIds.length) {
      setEvaluationsMap({});
      return;
    }
    // Primero intentar sin filtro para ver si hay datos
    const { data: allEvals, error: allError } = await supabase
      .from('evaluations')
      .select('id, submission_id, score, textual_feedback, plagiarism_flag, ai_summary')
      .limit(10);
    console.log('Todas las evaluaciones (sin filtro):', allEvals);
    if (allError) {
      console.error('Error query sin filtro:', allError);
      console.error('Error details:', JSON.stringify(allError, null, 2));
    }

    // Luego con filtro
    const { data: evals, error } = await supabase
      .from('evaluations')
      .select('id, submission_id, score, textual_feedback, plagiarism_flag, ai_summary')
      .in('submission_id', submissionIds);
    if (error) {
      console.error('Error cargando evaluaciones:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    console.log('evaluations cargadas con filtro:', evals);
    const map = {};
    (evals || []).forEach((ev) => { map[ev.submission_id] = ev; });
    console.log('evaluationMap:', map);
    setEvaluationsMap(map);
  }, [user]);

  const loadCompanySubmissions = useCallback(async () => {
    if (!canManageChallenge || !selectedChallenge?.id) return;
    setLoadingSubmissions(true);
    try {
      const { data: subs, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('challenge_id', selectedChallenge.id)
        .order('submitted_at', { ascending: false });
      if (error) throw error;

      const list = subs || [];
      if (list.length > 0) {
        const userIds = [...new Set(list.map((s) => s.user_id).filter(Boolean))];
        const [{ data: profiles }, { data: assets }] = await Promise.all([
          userIds.length
            ? supabase.from('profiles').select('id, full_name, career, avatar_url').in('id', userIds)
            : Promise.resolve({ data: [] }),
          supabase.from('submission_assets').select('*').in('submission_id', list.map((s) => s.id)),
        ]);

        const profileMap = {};
        (profiles || []).forEach((p) => { profileMap[p.id] = p; });
        const assetMap = {};
        (assets || []).forEach((a) => { assetMap[a.submission_id] = a; });

        list.forEach((s) => {
          s.profiles = profileMap[s.user_id] || null;
          s._asset = assetMap[s.id] || null;
        });
      }

      setSubmissions(list);
      console.log('submission ids del panel:', list.map(s => s.id));
      console.log('evaluation ids buscados:', list.map(s => s.id));
      await loadEvaluations(list.map((s) => s.id));
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [canManageChallenge, selectedChallenge?.id, loadEvaluations]);

  useEffect(() => {
    if (selectedChallenge?.organization?.full_name) {
      setOrgName(selectedChallenge.organization.full_name);
      return;
    }
    if (!selectedChallenge?.organization_id) return;
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', selectedChallenge.organization_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setOrgName(data.full_name);
      });
  }, [selectedChallenge]);

  useEffect(() => {
    if (user?.role !== 'student' || !selectedChallenge?.id) {
      setCheckingSubmission(false);
      return;
    }
    const check = async () => {
      try {
        const { data: sub, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('challenge_id', selectedChallenge.id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (sub) {
          setExistingSubmission(sub);
          const { data: asset } = await supabase
            .from('submission_assets')
            .select('*')
            .eq('submission_id', sub.id)
            .eq('type', 'pdf')
            .maybeSingle();
          if (asset) setExistingAsset(asset);
        }
      } catch (err) {
        console.error('Error checking submission:', err);
      } finally {
        setCheckingSubmission(false);
      }
    };
    check();
  }, [user, selectedChallenge]);

  useEffect(() => {
    loadCompanySubmissions();
  }, [loadCompanySubmissions]);

  // Refrescar evaluaciones (p. ej. plagiarism_flag tras generate-embedding)
  useEffect(() => {
    if (!canManageChallenge || submissions.length === 0) return;
    const ids = submissions.map((s) => s.id);
    const interval = setInterval(() => {
      loadEvaluations(ids).catch((err) => console.error('Error refreshing evaluations:', err));
    }, 12000);
    return () => clearInterval(interval);
  }, [canManageChallenge, submissions, loadEvaluations]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErrorMsg('El archivo debe ser PDF.');
      setPdfFile(null);
    } else if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Máximo 10MB.');
      setPdfFile(null);
    } else {
      setErrorMsg('');
      setPdfFile(file);
    }
  };

  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!selectedChallenge?.id) {
      setErrorMsg('Reto no válido.');
      return;
    }
    if (!executiveSummary.trim()) {
      setErrorMsg('El resumen ejecutivo es obligatorio.');
      return;
    }
    if (!pdfFile) {
      setErrorMsg('Adjunta tu propuesta en PDF.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Debes iniciar sesión para enviar.');

      const fileName = `${session.user.id}_${selectedChallenge.id}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage.from('submissions').upload(fileName, pdfFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
      const pdfUrl = urlData.publicUrl;

      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .insert([{
          challenge_id: selectedChallenge.id,
          user_id: session.user.id,
          executive_summary: executiveSummary.trim(),
          status: 'submitted',
        }])
        .select()
        .single();
      if (subError) throw subError;

      const { error: assetError } = await supabase
        .from('submission_assets')
        .insert([{ submission_id: subData.id, type: 'pdf', url: pdfUrl }]);
      if (assetError) throw assetError;

      setExistingAsset({ url: pdfUrl, type: 'pdf' });
      setExistingSubmission(subData);

      try {
        await supabase.functions.invoke('generate-embedding', {
          body: {
            submission_id: subData.id,
            text: executiveSummary.trim(),
            challenge_id: selectedChallenge.id,
            user_id: session.user.id,
          },
        });
      } catch (embedErr) {
        console.error('generate-embedding failed:', embedErr);
      }
    } catch (error) {
      console.error('Error al procesar la entrega:', error);
      setErrorMsg('Error al procesar el envío: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEval = async (submissionId) => {
    const form = evalForms[submissionId];
    const scoreNum = Number(form?.score);
    if (form?.score === '' || form?.score === undefined || Number.isNaN(scoreNum)) {
      alert('Ingresa un puntaje.');
      return;
    }
    if (scoreNum < 0 || scoreNum > 100) {
      alert('El puntaje debe estar entre 0 y 100.');
      return;
    }

    setSavingEval((p) => ({ ...p, [submissionId]: true }));
    try {
      const existing = evaluationsMap[submissionId];
      const evalPayload = {
        submission_id: submissionId,
        evaluator_user_id: user.id,
        score: scoreNum,
        textual_feedback: form.feedback || '',
      };

      if (existing?.id) {
        const { error } = await supabase.from('evaluations').update(evalPayload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('evaluations').insert([evalPayload]);
        if (error) throw error;
      }

      await supabase.from('submissions').update({ status: 'approved' }).eq('id', submissionId);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, status: 'approved' } : s))
      );
      await loadEvaluations(submissions.map((s) => s.id));
      setExpandedEvalId(null);
      alert('Evaluación guardada.');
    } catch (err) {
      console.error('Error saving evaluation:', err);
      alert('Error: ' + err.message);
    } finally {
      setSavingEval((p) => ({ ...p, [submissionId]: false }));
    }
  };

  if (!selectedChallenge) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 font-medium">No se ha seleccionado ningún reto.</p>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="mt-4 px-5 py-2 bg-blue-950 dark:bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-900 dark:hover:bg-blue-800 transition"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 font-sans bg-white dark:bg-gray-950 min-h-screen">
      <button
        onClick={() => setCurrentView('dashboard')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-50 font-bold mb-8 transition-colors text-sm uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Volver al feed
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 rounded-lg text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800/50">
                Nivel {selectedChallenge.difficulty || 'Intermedio'}
              </span>
              <span className="px-3 py-1 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-300 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 border border-green-200 dark:border-green-800/50">
                <Building2 size={12} /> {orgName}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-50 tracking-tight mb-6 leading-tight">
              {selectedChallenge.title}
            </h1>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3">
                  Contexto y Desafío
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-line">
                  {selectedChallenge.description}
                </p>
              </div>
              {selectedChallenge.technical_requirements && (
                <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Code2 size={16} className="text-gray-500" /> Requerimientos y Stack Sugerido
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {selectedChallenge.technical_requirements}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Fecha de Cierre</p>
                <p className="text-sm font-black text-gray-950 dark:text-gray-50">{formatDate(selectedChallenge.deadline)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Incentivo</p>
                <p className="text-sm font-black text-gray-950 dark:text-gray-50">{selectedChallenge.reward || 'Certificación'}</p>
              </div>
            </div>
          </div>

          {user?.role === 'student' && (
            checkingSubmission ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-950 dark:border-blue-400" />
              </div>
            ) : existingSubmission ? (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-green-200 dark:border-green-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-bold text-gray-950 dark:text-gray-50">Propuesta Enviada</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Estado</span>
                    <span className="font-bold text-green-700 dark:text-green-300 uppercase text-xs">{existingSubmission.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Enviado</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {formatDate(existingSubmission.submitted_at)}
                    </span>
                  </div>
                  {existingAsset?.url && (
                    <a
                      href={existingAsset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs mt-2"
                    >
                      <FileText size={14} /> Ver documento enviado
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  Ya enviaste tu propuesta para este reto. Solo se permite una entrega por challenge.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-bold text-gray-950 dark:text-gray-50 mb-2 flex items-center gap-2">
                  <Send size={18} className="text-blue-950 dark:text-blue-400" /> Entrega de Solución
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-6">
                  Tu documento será procesado para evaluación técnica y control de originalidad.
                </p>
                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs rounded-lg mb-4 text-center font-bold border border-red-200 dark:border-red-800/50">
                    {errorMsg}
                  </div>
                )}
                <form onSubmit={handleSubmitSolution} className="space-y-5">
                  <div>
                    <label className="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">
                      Reporte (PDF) *
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-500 transition-all group">
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        {pdfFile ? (
                          <>
                            <FileText className="text-blue-600 dark:text-blue-400 mb-2" size={32} />
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 max-w-[220px] truncate">{pdfFile.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2" size={32} />
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-bold">Seleccionar archivo</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">PDF (Máx. 10MB)</p>
                          </>
                        )}
                      </div>
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">
                      Resumen Ejecutivo *
                    </label>
                    <textarea
                      value={executiveSummary}
                      onChange={(e) => setExecutiveSummary(e.target.value)}
                      required
                      minLength={50}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[90px] text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500"
                      placeholder="Describe tu estrategia de solución (mín. 50 caracteres)..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Se usa para control de originalidad.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 text-white font-black rounded-lg transition-all uppercase tracking-wider text-xs ${
                      isSubmitting
                        ? 'bg-blue-500 dark:bg-blue-800 cursor-not-allowed'
                        : 'bg-blue-950 dark:bg-blue-900 hover:bg-blue-900 dark:hover:bg-blue-800 hover:-translate-y-0.5'
                    }`}
                  >
                    {isSubmitting ? 'Subiendo...' : 'Confirmar Envío'}
                  </button>
                </form>
              </div>
            )
          )}

          {canManageChallenge && (
            <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-blue-600 dark:text-blue-400" />
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                    Panel de Entregas ({submissions.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => loadCompanySubmissions()}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Actualizar
                </button>
              </div>
              {loadingSubmissions ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-950 dark:border-blue-400" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-6">
                  <Users size={24} className="text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">Aún no hay entregas.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {submissions.map((sub) => {
                    const evaluation = evaluationsMap[sub.id];
                    const form = evalForms[sub.id] || {
                      score: evaluation?.score ?? '',
                      feedback: evaluation?.textual_feedback || '',
                    };
                    const isEvalOpen = expandedEvalId === sub.id;

                    return (
                      <div key={sub.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-7 h-7 bg-blue-50 dark:bg-blue-950/30 rounded-md flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                            {sub.profiles?.avatar_url ? (
                              <img src={sub.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {(sub.profiles?.full_name || '?')[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                              {sub.profiles?.full_name || 'Estudiante'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(sub.submitted_at)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              sub.status === 'approved'
                                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/50'
                                : sub.status === 'rejected'
                                  ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50'
                                  : 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>

                        {sub.executive_summary && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 pl-10">
                            {sub.executive_summary}
                          </p>
                        )}

                        {sub._asset?.url && (
                          <a
                            href={sub._asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium pl-10 mb-3"
                          >
                            <FileText size={12} /> Ver PDF
                          </a>
                        )}

                        {evaluation?.plagiarism_flag === true && (
                          <div style={PLAGIARISM_ALERT_STYLE} className="mb-3">
                            ⚠ SIMILITUD DETECTADA — {evaluation.ai_summary || 'Revisar entrega'}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedEvalId(isEvalOpen ? null : sub.id)}
                          className="w-full flex items-center justify-center gap-1 py-2 text-xs font-bold text-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                        >
                          {isEvalOpen ? (
                            <>
                              <ChevronUp size={14} /> Cerrar evaluación
                            </>
                          ) : (
                            <>
                              <Star size={14} /> Evaluar
                            </>
                          )}
                        </button>

                        {isEvalOpen && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Puntaje (0-100)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={form.score}
                                onChange={(e) =>
                                  setEvalForms((p) => ({
                                    ...p,
                                    [sub.id]: { ...form, score: e.target.value },
                                  }))
                                }
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            <textarea
                              value={form.feedback}
                              placeholder="Feedback para el estudiante..."
                              onChange={(e) =>
                                setEvalForms((p) => ({
                                  ...p,
                                  [sub.id]: { ...form, feedback: e.target.value },
                                }))
                              }
                              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[50px] placeholder-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEval(sub.id)}
                              disabled={savingEval[sub.id]}
                              className={`w-full py-2 text-white text-xs font-bold rounded-lg transition ${
                                savingEval[sub.id]
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-blue-950 dark:bg-blue-900 hover:bg-blue-900 dark:hover:bg-blue-800'
                              }`}
                            >
                              {savingEval[sub.id]
                                ? 'Guardando...'
                                : evaluation?.score != null
                                  ? 'Actualizar Evaluación'
                                  : 'Guardar Evaluación'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isOrganizationUser && !canManageChallenge && (
            <p className="text-xs text-gray-500 text-center py-4">
              Solo el creador del reto puede ver las entregas de los estudiantes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
