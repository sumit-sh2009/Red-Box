import { Router, Response } from 'express';
import { civic, newId } from '../db/civic.js';
import { extractUser, requireAuth, AuthRequest } from '../middleware/auth.js';
import { analyzeComplaint, moderateComplaint } from '../services/aiPipeline.js';
import { guessWard } from '../services/heuristic.js';
import { Complaint } from '../types/civic.js';

const router = Router();

function moderationDenied(mod: { action: string; rewrite_message: string; reason: string; used_llm: boolean; model: string }) {
  const status = mod.action === 'reject' ? 400 : 422;
  return {
    status,
    body: {
      error: mod.rewrite_message || 'Please revise your report.',
      action: mod.action,
      rewrite_message: mod.rewrite_message,
      reason: mod.reason,
      used_llm: mod.used_llm,
      model: mod.model,
    },
  };
}

router.get('/', extractUser, (req: AuthRequest, res: Response) => {
  const mine = req.query.mine === '1';
  if (mine && !req.user) {
    return res.status(401).json({ error: 'Login required to view your reports.' });
  }
  const result = civic.listComplaints({
    mineUserId: mine ? req.user!.id : undefined,
    publicOnly: !mine,
    search: req.query.search as string,
    category: req.query.category as string,
    status: req.query.status as string,
    page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
    limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20,
  });
  return res.json({
    total: result.total,
    hasMore: result.hasMore,
    complaints: result.complaints.map((c) => civic.toPublic(c, req.user?.id)),
  });
});

router.post('/moderate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const body = String(req.body.body || req.body.content || '').trim();
    const location_text = String(req.body.location_text || '').trim();
    const mod = await moderateComplaint(body, location_text);
    if (mod.action !== 'allow') {
      const denied = moderationDenied(mod);
      return res.status(denied.status).json(denied.body);
    }
    return res.json(mod);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Moderation failed.' });
  }
});

router.get('/:id', extractUser, (req: AuthRequest, res: Response) => {
  const c = civic.findComplaint(req.params.id);
  if (!c) return res.status(404).json({ error: 'Report not found.' });
  if (c.status === 'flagged' && req.user?.id !== c.author_id && req.user?.role !== 'government') {
    return res.status(404).json({ error: 'Report not found.' });
  }
  return res.json({ complaint: civic.toPublic(c, req.user?.id) });
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const body = String(req.body.body || req.body.content || '').trim();
    const location_text = String(req.body.location_text || '').trim();
    const image_url = req.body.image_url || null;
    const category = req.body.category || null;

    if (body.length < 12) {
      return res.status(400).json({ error: 'Describe the issue in at least a short sentence.' });
    }
    if (body.length > 2000) {
      return res.status(400).json({ error: 'Report is too long (max 2000 characters).' });
    }
    if (!location_text) {
      return res.status(400).json({ error: 'Add a location (area, landmark, or street).' });
    }

    const mod = await moderateComplaint(body, location_text);
    if (mod.action !== 'allow') {
      const denied = moderationDenied(mod);
      return res.status(denied.status).json(denied.body);
    }

    const now = new Date().toISOString();
    const complaint: Complaint = {
      id: newId('cmp'),
      author_id: req.user!.id,
      body,
      image_url,
      location_text,
      ward: req.body.ward || guessWard(location_text),
      category,
      status: 'pending_ai',
      support_count: 0,
      cluster_id: null,
      tracking_code: `CIV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      created_at: now,
      updated_at: now,
    };

    civic.createComplaint(complaint, {
      id: newId('evt'),
      complaint_id: complaint.id,
      status: 'pending_ai',
      actor: 'Anonymous citizen',
      note: 'Report submitted. Public profile is not attached.',
      created_at: now,
    });

    await analyzeComplaint(complaint);
    const fresh = civic.findComplaint(complaint.id)!;
    return res.status(201).json({
      message: 'Report filed. It is publicly anonymous.',
      complaint: civic.toPublic(fresh, req.user!.id),
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Could not file report.' });
  }
});

router.post('/:id/support', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const result = civic.toggleSupport(req.user!.id, req.params.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Could not record support.' });
  }
});

export default router;
