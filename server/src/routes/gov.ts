import { Router, Response } from 'express';
import { civic, newId } from '../db/civic.js';
import { requireGov, AuthRequest } from '../middleware/auth.js';
import { govAsk, groundedSummary } from '../services/aiPipeline.js';
import { priorityScore } from '../services/heuristic.js';

const router = Router();

router.use(requireGov);

router.get('/overview', async (_req: AuthRequest, res: Response) => {
  return res.json(await civic.overview());
});

router.get('/departments', async (_req: AuthRequest, res: Response) => {
  return res.json(await civic.departmentStats());
});

router.get('/trends', async (_req: AuthRequest, res: Response) => {
  const trends = await civic.trends();
  const emerging = await civic.emerging();
  return res.json({ ...trends, emerging });
});

router.get('/clusters', async (_req: AuthRequest, res: Response) => {
  const clusters = await civic.listClusters();
  const enriched = await Promise.all(
    clusters.map(async (cl) => {
      const members = await civic.complaintsInCluster(cl.id);
      const ai = members[0] ? await civic.analysisFor(members[0].id) : null;
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
      const representative = members[0] ? await civic.toPublic(members[0]) : null;
      return {
        ...cl,
        scores,
        member_ids: members.map((m) => m.id),
        representative,
      };
    })
  );
  enriched.sort((a, b) => b.scores.government_priority - a.scores.government_priority);
  return res.json({ clusters: enriched });
});

router.get('/complaints', async (req: AuthRequest, res: Response) => {
  const result = await civic.listComplaints({
    publicOnly: false,
    search: req.query.search as string,
    category: req.query.category as string,
    status: req.query.status as string,
    page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
    limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 50,
  });
  const complaints = await Promise.all(
    result.complaints.map((c) => civic.toPublic(c, req.user?.id))
  );
  return res.json({
    total: result.total,
    complaints,
  });
});

router.patch('/complaints/:id', async (req: AuthRequest, res: Response) => {
  const c = await civic.findComplaint(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const { status, department, category, note } = req.body;
  const patch: Record<string, unknown> = {};
  if (status) patch.status = status;
  if (category) patch.category = category;
  await civic.updateComplaint(c.id, patch);
  await civic.addEvent({
    id: newId('evt'),
    complaint_id: c.id,
    status: status || c.status,
    actor: req.user!.username,
    note: note || `Officer update${department ? ` · ${department}` : ''}`,
    created_at: new Date().toISOString(),
  });
  await civic.audit({
    id: newId('aud'),
    actor_id: req.user!.id,
    action: 'gov_override',
    entity_type: 'complaint',
    entity_id: c.id,
    detail: JSON.stringify({ status, department, category, note }),
    created_at: new Date().toISOString(),
  });
  const ai = await civic.analysisFor(c.id);
  if (ai && department) {
    ai.department = department;
    await civic.saveAnalysis(ai);
  }
  const updated = await civic.findComplaint(c.id);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  return res.json({ complaint: await civic.toPublic(updated, req.user!.id) });
});

async function briefingPayload() {
  const overview = await civic.overview();
  const clusters = await civic.listClusters();
  const narrative = await groundedSummary(overview as unknown as Record<string, unknown>);
  const deptStats = await civic.departmentStats();
  return {
    generated_at: new Date().toISOString(),
    overview,
    categories: overview.categories,
    wards: overview.wards,
    ...deptStats,
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
  await civic.audit({
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
