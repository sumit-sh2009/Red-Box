import { Router, Response } from 'express';
import { civic, newId } from '../db/civic.js';
import { requireGov, AuthRequest } from '../middleware/auth.js';
import { govAsk, groundedSummary } from '../services/aiPipeline.js';
import { priorityScore } from '../services/heuristic.js';

const router = Router();

router.use(requireGov);

router.get('/overview', (_req: AuthRequest, res: Response) => {
  return res.json(civic.overview());
});

router.get('/departments', (_req: AuthRequest, res: Response) => {
  return res.json(civic.departmentStats());
});

router.get('/trends', (_req: AuthRequest, res: Response) => {
  return res.json({ ...civic.trends(), emerging: civic.emerging() });
});

router.get('/clusters', (_req: AuthRequest, res: Response) => {
  const clusters = civic.listClusters().map((cl) => {
    const members = civic.complaintsInCluster(cl.id);
    const ai = members[0] ? civic.analysisFor(members[0].id) : null;
    const ageHours = members[0]
      ? (Date.now() - new Date(members[0].created_at).getTime()) / 3600000
      : 0;
    const scores = priorityScore({
      clusterSize: cl.size,
      support: cl.support_total,
      severity: ai?.severity || 'medium',
      urgency: cl.urgency || ai?.urgency || 'medium',
      ageHours,
    });
    return {
      ...cl,
      scores,
      member_ids: members.map((m) => m.id),
      representative: members[0] ? civic.toPublic(members[0]) : null,
    };
  });
  clusters.sort((a, b) => b.scores.government_priority - a.scores.government_priority);
  return res.json({ clusters });
});

router.get('/complaints', (req: AuthRequest, res: Response) => {
  const result = civic.listComplaints({
    publicOnly: false,
    search: req.query.search as string,
    category: req.query.category as string,
    status: req.query.status as string,
    page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
    limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 50,
  });
  return res.json({
    total: result.total,
    complaints: result.complaints.map((c) => civic.toPublic(c, req.user?.id)),
  });
});

router.patch('/complaints/:id', (req: AuthRequest, res: Response) => {
  const c = civic.findComplaint(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const { status, department, category, note } = req.body;
  const patch: Record<string, unknown> = {};
  if (status) patch.status = status;
  if (category) patch.category = category;
  civic.updateComplaint(c.id, patch);
  civic.addEvent({
    id: newId('evt'),
    complaint_id: c.id,
    status: status || c.status,
    actor: req.user!.username,
    note: note || `Officer update${department ? ` · ${department}` : ''}`,
    created_at: new Date().toISOString(),
  });
  civic.audit({
    id: newId('aud'),
    actor_id: req.user!.id,
    action: 'gov_override',
    entity_type: 'complaint',
    entity_id: c.id,
    detail: JSON.stringify({ status, department, category, note }),
    created_at: new Date().toISOString(),
  });
  const ai = civic.analysisFor(c.id);
  if (ai && department) {
    ai.department = department;
    civic.saveAnalysis(ai);
  }
  return res.json({ complaint: civic.toPublic(civic.findComplaint(c.id)!, req.user!.id) });
});

async function briefingPayload() {
  const overview = civic.overview();
  const clusters = civic.listClusters();
  const narrative = await groundedSummary(overview as unknown as Record<string, unknown>);
  return {
    generated_at: new Date().toISOString(),
    overview,
    categories: overview.categories,
    wards: overview.wards,
    ...civic.departmentStats(),
    clusters: clusters.map((c) => ({
      title: c.title,
      size: c.size,
      support_total: c.support_total,
      department: c.department,
      urgency: c.urgency,
    })),
    narrative,
  };
}

router.get('/reports', async (_req: AuthRequest, res: Response) => {
  return res.json(await briefingPayload());
});

router.get('/briefing', async (_req: AuthRequest, res: Response) => {
  return res.json(await briefingPayload());
});

router.post('/ask', async (req: AuthRequest, res: Response) => {
  const question = String(req.body.question || req.body.q || '').trim();
  if (question.length < 3) {
    return res.status(400).json({ error: 'Ask a question about civic reports or departments.' });
  }
  const result = await govAsk(question);
  civic.audit({
    id: newId('aud'),
    actor_id: req.user!.id,
    action: 'gov_ask',
    entity_type: 'briefing',
    entity_id: 'ask',
    detail: JSON.stringify({ question: question.slice(0, 200), used_llm: result.used_llm, model: result.model }),
    created_at: new Date().toISOString(),
  });
  return res.json(result);
});

export default router;
