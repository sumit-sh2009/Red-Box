import { civic, newId } from '../db/civic.js';
import {
  CLUSTER_THRESHOLD,
  classifyHeuristic,
  guessWard,
  moderateHeuristic,
  ModerationResult,
  priorityScore,
  similarity,
} from './heuristic.js';
import { AiAnalysis, Complaint } from '../types/civic.js';

const AI_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

export interface AnalyzeResult {
  analysis: AiAnalysis;
  steps: string[];
}

export interface SimilarHit {
  id: string;
  score: number;
  cluster_id?: string | null;
}

async function postAi(path: string, body: unknown, timeoutMs = 45000): Promise<Record<string, unknown> | null> {
  const url = `${AI_URL}${path}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (res.ok) return (await res.json()) as Record<string, unknown>;
    } catch {
      /* retry once — AI worker may be starting */
    } finally {
      clearTimeout(t);
    }
  }
  return null;
}

export async function moderateComplaint(body: string, location_text: string): Promise<ModerationResult> {
  const heuristic = moderateHeuristic(body, location_text);
  if (heuristic.action !== 'allow' && ['violent_threat', 'prompt_injection', 'spam', 'vulgar'].includes(heuristic.reason)) {
    return heuristic;
  }
  const python = await postAi('/moderate', { body, location_text }, 20000);
  if (python && (python.action === 'allow' || python.action === 'revise' || python.action === 'reject')) {
    const action = python.action as ModerationResult['action'];
    if (action === 'reject' && heuristic.action === 'allow') {
      return { ...heuristic, used_llm: Boolean(python.used_llm), model: String(python.model || 'llm') };
    }
    return {
      action,
      reason: String(python.reason || ''),
      rewrite_message: String(python.rewrite_message || heuristic.rewrite_message),
      used_llm: Boolean(python.used_llm),
      model: String(python.model || 'llm'),
    };
  }
  return heuristic;
}

function localSimilar(complaint: Complaint): SimilarHit[] {
  const q = `${complaint.body} ${complaint.location_text}`;
  return civic
    .listComplaints({ publicOnly: false, limit: 200 })
    .complaints.filter((c) => c.id !== complaint.id)
    .map((c) => ({
      id: c.id,
      score: similarity(q, `${c.body} ${c.location_text}`),
      cluster_id: c.cluster_id,
    }))
    .filter((x) => x.score >= 0.36)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

export async function analyzeComplaint(complaint: Complaint): Promise<AnalyzeResult> {
  const steps = ['validate', 'safety'];
  const python = await postAi('/analyze-complaint', {
    complaint_id: complaint.id,
    body: complaint.body,
    location_text: complaint.location_text,
    image_present: Boolean(complaint.image_url),
    existing: civic.listComplaints({ publicOnly: false, limit: 200 }).complaints.map((c) => ({
      id: c.id,
      body: c.body,
      location_text: c.location_text,
      category: c.category,
      cluster_id: c.cluster_id,
    })),
  });

  const usedLlm = Boolean(python && python.used_llm);
  const model = String(python?.model || (python ? 'langgraph' : 'heuristic'));

  const local = classifyHeuristic(complaint.body, complaint.location_text);
  const similar: SimilarHit[] = Array.isArray(python?.similar)
    ? (python!.similar as SimilarHit[])
    : localSimilar(complaint);

  const category = String(python?.category || local.category);
  const severity = String(python?.severity || local.severity);
  const urgency = String(python?.urgency || local.urgency);
  const department = String(python?.department || local.department);
  const deptConf = Number(python?.department_confidence ?? local.department_confidence);
  const confidence = Number(python?.overall_confidence ?? local.overall_confidence);

  steps.push('classify_extract', 'retrieve_similar');

  const flagged = false;
  let needsReview = confidence < 0.5 || Boolean(python?.needs_review);

  if (python?.category && python.category !== local.category && confidence < 0.7) {
    needsReview = true;
    steps.push('evaluate:category_mismatch');
  }

  const topSimilar = similar.map((s) => s.id).filter((id) => id !== complaint.id);
  let clusterId = complaint.cluster_id;
  const top = similar[0];

  if (top && top.score >= CLUSTER_THRESHOLD && top.cluster_id) {
    clusterId = top.cluster_id;
    civic.attachToCluster(complaint.id, top.cluster_id);
  } else if (top && top.score >= CLUSTER_THRESHOLD) {
    const title = `${category} — ${complaint.location_text.slice(0, 48) || 'area'}`;
    const cluster = civic.upsertCluster({
      id: newId('clu'),
      title,
      summary: String(python?.cluster_summary || `${category} reports near ${complaint.location_text}`),
      category,
      location_text: complaint.location_text,
      ward: complaint.ward,
      size: 1,
      support_total: complaint.support_count,
      department,
      urgency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    clusterId = cluster.id;
    civic.attachToCluster(complaint.id, cluster.id);
    civic.attachToCluster(top.id, cluster.id);
  } else {
    const cluster = civic.upsertCluster({
      id: newId('clu'),
      title: `${category} — ${complaint.location_text.slice(0, 48) || 'unspecified'}`,
      summary: String(python?.summary || local.summary),
      category,
      location_text: complaint.location_text,
      ward: complaint.ward,
      size: 1,
      support_total: complaint.support_count,
      department,
      urgency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    clusterId = cluster.id;
    civic.attachToCluster(complaint.id, cluster.id);
  }
  steps.push('cluster', 'rag_departments', 'route_department');

  const cluster = civic.findCluster(clusterId);
  const ageHours = (Date.now() - new Date(complaint.created_at).getTime()) / 3600000;
  const pythonScores = python?.scores as Record<string, number> | undefined;
  const scores =
    pythonScores && typeof pythonScores.government_priority === 'number'
      ? pythonScores
      : priorityScore({
          clusterSize: cluster?.size || 1,
          support: cluster?.support_total || complaint.support_count,
          severity,
          urgency,
          ageHours,
        });
  steps.push('priority', 'evaluate');

  if (needsReview) {
    civic.updateComplaint(complaint.id, {
      status: 'needs_review',
      category,
      cluster_id: clusterId,
      ward: complaint.ward || guessWard(complaint.location_text),
    });
  } else {
    civic.updateComplaint(complaint.id, {
      status: 'open',
      category,
      cluster_id: clusterId,
      ward: complaint.ward || guessWard(complaint.location_text),
    });
  }

  const analysis: AiAnalysis = {
    id: newId('ai'),
    complaint_id: complaint.id,
    workflow_id: String(python?.workflow_id || `wf_${complaint.id}`),
    model,
    used_llm: usedLlm,
    category,
    subcategory: (python?.subcategory as string) || null,
    severity,
    urgency,
    department,
    department_confidence: deptConf,
    overall_confidence: confidence,
    needs_review: needsReview,
    flagged,
    similar_ids: topSimilar,
    summary: String(python?.summary || local.summary),
    recommended_action: String(python?.recommended_action || local.recommended_action),
    steps,
    payload: { scores, python: python || null, similar },
    created_at: new Date().toISOString(),
  };
  civic.saveAnalysis(analysis);
  civic.addEvent({
    id: newId('evt'),
    complaint_id: complaint.id,
    status: needsReview ? 'needs_review' : 'open',
    actor: 'Civic intelligence',
    note: `Classified as ${category} → ${department} (confidence ${confidence}, model ${model}, used_llm=${usedLlm})`,
    created_at: new Date().toISOString(),
  });

  return { analysis, steps };
}

export async function groundedSummary(stats: Record<string, unknown>) {
  const python = await postAi('/gov-summary', { stats }, 20000);
  if (python && python.summary) return python;
  const total = Number(stats.total || 0);
  const urgent = Number(stats.urgent || 0);
  const clusters = Number(stats.clusters || 0);
  return {
    used_llm: false,
    model: 'heuristic',
    summary: `Citizens filed ${total} tracked reports. ${urgent} are tagged high urgency. ${clusters} issue clusters are active. Figures come from the database, not the model.`,
    grounded: true,
  };
}

export async function govAsk(question: string) {
  const python = await postAi('/gov-ask', { question }, 40000);
  if (python && python.answer) return python;
  const overview = civic.overview();
  return {
    used_llm: false,
    model: 'heuristic',
    answer: `No AI worker answered. Live database: ${overview.total} reports, ${overview.urgent} urgent, ${overview.clusters} clusters. Categories: ${JSON.stringify(overview.categories)}.`,
    tools_used: [],
    stats: overview,
  };
}
