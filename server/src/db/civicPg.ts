import { v4 as uuidv4 } from 'uuid';
import { pgQuery, iso, getPool } from './pg.js';
import { DEPARTMENTS } from './departments.js';
import {
  AiAnalysis,
  AuditLog,
  Cluster,
  Complaint,
  ComplaintEvent,
  Department,
  publicComplaintDto,
} from '../types/civic.js';

// --- Row types ---

interface ComplaintRow {
  id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  location_text: string;
  ward: string | null;
  category: string | null;
  status: string;
  support_count: number;
  cluster_id: string | null;
  tracking_code: string;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ClusterRow {
  id: string;
  title: string;
  summary: string;
  category: string | null;
  location_text: string | null;
  ward: string | null;
  size: number;
  support_total: number;
  department: string | null;
  urgency: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface AiAnalysisRow {
  id: string;
  complaint_id: string;
  workflow_id: string | null;
  model: string | null;
  used_llm: boolean;
  category: string | null;
  subcategory: string | null;
  severity: string | null;
  urgency: string | null;
  department: string | null;
  department_confidence: number | null;
  overall_confidence: number | null;
  needs_review: boolean;
  flagged: boolean;
  similar_ids: string | null;
  summary: string | null;
  recommended_action: string | null;
  payload: Record<string, unknown> | null;
  created_at: Date | string;
}

interface ComplaintEventRow {
  id: string;
  complaint_id: string;
  status: string;
  actor: string;
  note: string | null;
  created_at: Date | string;
}

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  detail: string | null;
  created_at: Date | string;
}

// --- Row mappers ---

function mapComplaint(row: ComplaintRow): Complaint {
  return {
    id: row.id,
    author_id: row.author_id,
    body: row.body,
    image_url: row.image_url,
    location_text: row.location_text,
    ward: row.ward,
    category: row.category,
    status: row.status as Complaint['status'],
    support_count: row.support_count,
    cluster_id: row.cluster_id,
    tracking_code: row.tracking_code,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

function mapCluster(row: ClusterRow): Cluster {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    location_text: row.location_text,
    ward: row.ward,
    size: row.size,
    support_total: row.support_total,
    department: row.department,
    urgency: row.urgency,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

function parseSimilarIds(row: AiAnalysisRow, payload: Record<string, unknown>): string[] {
  if (row.similar_ids) {
    try {
      const parsed = JSON.parse(row.similar_ids);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* fall through */
    }
  }
  if (Array.isArray(payload.similar_ids)) {
    return payload.similar_ids.map(String);
  }
  return [];
}

function parseSteps(payload: Record<string, unknown>): string[] {
  if (Array.isArray(payload.steps)) {
    return payload.steps.map(String);
  }
  return [];
}

function mapAiAnalysis(row: AiAnalysisRow): AiAnalysis {
  const payload = (row.payload || {}) as Record<string, unknown>;
  return {
    id: row.id,
    complaint_id: row.complaint_id,
    workflow_id: row.workflow_id || '',
    model: row.model || '',
    used_llm: row.used_llm,
    category: row.category,
    subcategory: row.subcategory,
    severity: row.severity,
    urgency: row.urgency,
    department: row.department,
    department_confidence: row.department_confidence ?? 0,
    overall_confidence: row.overall_confidence ?? 0,
    needs_review: row.needs_review,
    flagged: row.flagged,
    similar_ids: parseSimilarIds(row, payload),
    summary: row.summary || '',
    recommended_action: row.recommended_action || '',
    steps: parseSteps(payload),
    payload,
    created_at: iso(row.created_at),
  };
}

function mapComplaintEvent(row: ComplaintEventRow): ComplaintEvent {
  return {
    id: row.id,
    complaint_id: row.complaint_id,
    status: row.status,
    actor: row.actor,
    note: row.note || '',
    created_at: iso(row.created_at),
  };
}

function mapAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    actor_id: row.actor_id,
    action: row.action,
    entity_type: row.entity_type || '',
    entity_id: row.entity_id || '',
    detail: row.detail || '',
    created_at: iso(row.created_at),
  };
}

// --- Internal helpers ---

let departmentsSynced = false;

async function ensureDepartments(): Promise<void> {
  if (departmentsSynced) return;
  for (const d of DEPARTMENTS) {
    await pgQuery(
      `INSERT INTO departments (id, name, keywords, responsibilities)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         keywords = EXCLUDED.keywords,
         responsibilities = EXCLUDED.responsibilities`,
      [d.id, d.name, d.keywords, d.responsibilities]
    );
  }
  departmentsSynced = true;
}

async function recomputeClusterSupport(clusterId: string | null): Promise<void> {
  if (!clusterId) return;
  await pgQuery(
    `UPDATE clusters SET
       size = (SELECT COUNT(*)::int FROM complaints WHERE cluster_id = $1),
       support_total = (SELECT COALESCE(SUM(support_count), 0)::int FROM complaints WHERE cluster_id = $1),
       updated_at = NOW()
     WHERE id = $1`,
    [clusterId]
  );
}

async function loadAllComplaints(): Promise<Complaint[]> {
  const { rows } = await pgQuery<ComplaintRow>(
    'SELECT * FROM complaints ORDER BY created_at DESC'
  );
  return rows.map(mapComplaint);
}

async function loadAnalysisMap(): Promise<Map<string, AiAnalysis>> {
  const analyses = await listAnalyses();
  const map = new Map<string, AiAnalysis>();
  for (const a of analyses) {
    if (!map.has(a.complaint_id)) {
      map.set(a.complaint_id, a);
    }
  }
  return map;
}

// --- Public API (mirrors JsonCivicStore) ---

export async function isEmpty(): Promise<boolean> {
  const { rows } = await pgQuery<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM complaints'
  );
  return Number(rows[0]?.count || 0) === 0;
}

export async function listDepartments(): Promise<Department[]> {
  await ensureDepartments();
  return DEPARTMENTS;
}

export async function createComplaint(
  c: Complaint,
  event?: ComplaintEvent
): Promise<Complaint> {
  await pgQuery(
    `INSERT INTO complaints (
       id, author_id, body, image_url, location_text, ward, category,
       status, support_count, cluster_id, tracking_code, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      c.id,
      c.author_id,
      c.body,
      c.image_url ?? null,
      c.location_text,
      c.ward,
      c.category,
      c.status,
      c.support_count,
      c.cluster_id,
      c.tracking_code,
      iso(c.created_at),
      iso(c.updated_at),
    ]
  );

  if (event) {
    await pgQuery(
      `INSERT INTO complaint_events (id, complaint_id, status, actor, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        event.id,
        event.complaint_id,
        event.status,
        event.actor,
        event.note,
        iso(event.created_at),
      ]
    );
  }

  return c;
}

export async function updateComplaint(
  id: string,
  patch: Partial<Complaint>
): Promise<Complaint | undefined> {
  const allowed = [
    'author_id',
    'body',
    'image_url',
    'location_text',
    'ward',
    'category',
    'status',
    'support_count',
    'cluster_id',
    'tracking_code',
  ] as const;

  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (key in patch) {
      sets.push(`${key} = $${idx++}`);
      params.push(patch[key]);
    }
  }

  sets.push(`updated_at = $${idx++}`);
  params.push(iso(new Date()));
  params.push(id);

  const { rows } = await pgQuery<ComplaintRow>(
    `UPDATE complaints SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );

  return rows[0] ? mapComplaint(rows[0]) : undefined;
}

export async function findComplaint(id: string): Promise<Complaint | undefined> {
  const { rows } = await pgQuery<ComplaintRow>(
    'SELECT * FROM complaints WHERE id = $1',
    [id]
  );
  return rows[0] ? mapComplaint(rows[0]) : undefined;
}

export async function listComplaints(opts: {
  mineUserId?: string;
  publicOnly?: boolean;
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; hasMore: boolean; complaints: Complaint[] }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (opts.mineUserId) {
    conditions.push(`author_id = $${idx++}`);
    params.push(opts.mineUserId);
  } else if (opts.publicOnly) {
    conditions.push(`status NOT IN ('flagged', 'pending_ai')`);
  }

  if (opts.category) {
    conditions.push(`category = $${idx++}`);
    params.push(opts.category);
  }

  if (opts.status) {
    conditions.push(`status = $${idx++}`);
    params.push(opts.status);
  }

  if (opts.search) {
    const q = `%${opts.search}%`;
    conditions.push(
      `(body ILIKE $${idx} OR location_text ILIKE $${idx} OR category ILIKE $${idx})`
    );
    params.push(q);
    idx += 1;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = opts.page || 1;
  const limit = opts.limit || 20;
  const offset = (page - 1) * limit;

  const countRes = await pgQuery<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM complaints ${where}`,
    params
  );
  const total = Number(countRes.rows[0]?.count || 0);

  const listParams = [...params, limit, offset];
  const { rows } = await pgQuery<ComplaintRow>(
    `SELECT * FROM complaints ${where}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    listParams
  );

  return {
    total,
    hasMore: offset + limit < total,
    complaints: rows.map(mapComplaint),
  };
}

export async function addEvent(ev: ComplaintEvent): Promise<void> {
  await pgQuery(
    `INSERT INTO complaint_events (id, complaint_id, status, actor, note, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [ev.id, ev.complaint_id, ev.status, ev.actor, ev.note, iso(ev.created_at)]
  );
}

export async function eventsFor(complaintId: string): Promise<ComplaintEvent[]> {
  const { rows } = await pgQuery<ComplaintEventRow>(
    `SELECT * FROM complaint_events
     WHERE complaint_id = $1
     ORDER BY created_at ASC`,
    [complaintId]
  );
  return rows.map(mapComplaintEvent);
}

export async function toggleSupport(
  userId: string,
  complaintId: string
): Promise<{ supported: boolean; support_count: number }> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const compRes = await client.query<ComplaintRow>(
      'SELECT * FROM complaints WHERE id = $1 FOR UPDATE',
      [complaintId]
    );
    if (compRes.rows.length === 0) {
      throw new Error('Complaint not found');
    }
    const c = mapComplaint(compRes.rows[0]);

    const supRes = await client.query(
      'SELECT 1 FROM complaint_support WHERE user_id = $1 AND complaint_id = $2',
      [userId, complaintId]
    );

    let supported: boolean;
    let support_count: number;

    if (supRes.rows.length > 0) {
      await client.query(
        'DELETE FROM complaint_support WHERE user_id = $1 AND complaint_id = $2',
        [userId, complaintId]
      );
      support_count = Math.max(0, c.support_count - 1);
      supported = false;
    } else {
      await client.query(
        'INSERT INTO complaint_support (user_id, complaint_id, created_at) VALUES ($1, $2, $3)',
        [userId, complaintId, iso(new Date())]
      );
      support_count = c.support_count + 1;
      supported = true;
    }

    await client.query(
      'UPDATE complaints SET support_count = $1, updated_at = NOW() WHERE id = $2',
      [support_count, complaintId]
    );

    if (c.cluster_id) {
      await client.query(
        `UPDATE clusters SET
           size = (SELECT COUNT(*)::int FROM complaints WHERE cluster_id = $1),
           support_total = (SELECT COALESCE(SUM(support_count), 0)::int FROM complaints WHERE cluster_id = $1),
           updated_at = NOW()
         WHERE id = $1`,
        [c.cluster_id]
      );
    }

    await client.query('COMMIT');
    return { supported, support_count };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function isSupported(
  userId: string | undefined,
  complaintId: string
): Promise<boolean> {
  if (!userId) return false;
  const { rows } = await pgQuery(
    'SELECT 1 FROM complaint_support WHERE user_id = $1 AND complaint_id = $2',
    [userId, complaintId]
  );
  return rows.length > 0;
}

export async function saveAnalysis(a: AiAnalysis): Promise<AiAnalysis> {
  await pgQuery('DELETE FROM ai_analyses WHERE complaint_id = $1', [a.complaint_id]);

  const payload = { ...a.payload, steps: a.steps };

  await pgQuery(
    `INSERT INTO ai_analyses (
       id, complaint_id, workflow_id, model, used_llm, category, subcategory,
       severity, urgency, department, department_confidence, overall_confidence,
       needs_review, flagged, similar_ids, summary, recommended_action, payload, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
    [
      a.id,
      a.complaint_id,
      a.workflow_id,
      a.model,
      a.used_llm,
      a.category,
      a.subcategory,
      a.severity,
      a.urgency,
      a.department,
      a.department_confidence,
      a.overall_confidence,
      a.needs_review,
      a.flagged,
      JSON.stringify(a.similar_ids),
      a.summary,
      a.recommended_action,
      JSON.stringify(payload),
      iso(a.created_at),
    ]
  );

  return a;
}

export async function analysisFor(complaintId: string): Promise<AiAnalysis | null> {
  const { rows } = await pgQuery<AiAnalysisRow>(
    'SELECT * FROM ai_analyses WHERE complaint_id = $1 ORDER BY created_at DESC LIMIT 1',
    [complaintId]
  );
  return rows[0] ? mapAiAnalysis(rows[0]) : null;
}

export async function listAnalyses(): Promise<AiAnalysis[]> {
  const { rows } = await pgQuery<AiAnalysisRow>(
    'SELECT * FROM ai_analyses ORDER BY created_at DESC'
  );
  return rows.map(mapAiAnalysis);
}

export async function findCluster(id: string | null): Promise<Cluster | null> {
  if (!id) return null;
  const { rows } = await pgQuery<ClusterRow>(
    'SELECT * FROM clusters WHERE id = $1',
    [id]
  );
  return rows[0] ? mapCluster(rows[0]) : null;
}

export async function listClusters(): Promise<Cluster[]> {
  const { rows } = await pgQuery<ClusterRow>(
    'SELECT * FROM clusters ORDER BY size DESC'
  );
  return rows.map(mapCluster);
}

export async function upsertCluster(cluster: Cluster): Promise<Cluster> {
  const { rows } = await pgQuery<ClusterRow>(
    `INSERT INTO clusters (
       id, title, summary, category, location_text, ward,
       size, support_total, department, urgency, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       summary = EXCLUDED.summary,
       category = EXCLUDED.category,
       location_text = EXCLUDED.location_text,
       ward = EXCLUDED.ward,
       size = EXCLUDED.size,
       support_total = EXCLUDED.support_total,
       department = EXCLUDED.department,
       urgency = EXCLUDED.urgency,
       updated_at = EXCLUDED.updated_at
     RETURNING *`,
    [
      cluster.id,
      cluster.title,
      cluster.summary,
      cluster.category,
      cluster.location_text,
      cluster.ward,
      cluster.size,
      cluster.support_total,
      cluster.department,
      cluster.urgency,
      iso(cluster.created_at),
      iso(cluster.updated_at),
    ]
  );
  return mapCluster(rows[0]);
}

export async function attachToCluster(
  complaintId: string,
  clusterId: string
): Promise<void> {
  const { rows } = await pgQuery<ComplaintRow>(
    'UPDATE complaints SET cluster_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [clusterId, complaintId]
  );
  if (rows.length === 0) return;
  await recomputeClusterSupport(clusterId);
}

export async function complaintsInCluster(clusterId: string): Promise<Complaint[]> {
  const { rows } = await pgQuery<ComplaintRow>(
    'SELECT * FROM complaints WHERE cluster_id = $1 ORDER BY created_at DESC',
    [clusterId]
  );
  return rows.map(mapComplaint);
}

export async function audit(log: AuditLog): Promise<void> {
  await pgQuery(
    `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      log.id,
      log.actor_id,
      log.action,
      log.entity_type,
      log.entity_id,
      log.detail,
      iso(log.created_at),
    ]
  );
}

export async function openComplaints(): Promise<Complaint[]> {
  const { rows } = await pgQuery<ComplaintRow>(
    `SELECT * FROM complaints WHERE status != 'flagged' ORDER BY created_at DESC`
  );
  return rows.map(mapComplaint);
}

export async function departmentStats(): Promise<{
  departments: Array<{
    id: string;
    name: string;
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    rejected: number;
    resolution_rate: number;
  }>;
  category_status: Array<{
    category: string;
    open: number;
    in_progress: number;
    resolved: number;
    rejected: number;
  }>;
}> {
  const all = (await loadAllComplaints()).filter((c) => c.status !== 'flagged');
  const analysisMap = await loadAnalysisMap();
  const departments = await listDepartments();

  const bucket = (status: string): 'open' | 'in_progress' | 'resolved' | 'rejected' => {
    if (status === 'in_progress') return 'in_progress';
    if (status === 'resolved') return 'resolved';
    if (status === 'rejected') return 'rejected';
    return 'open';
  };

  const resolveDept = (raw: string | null | undefined) => {
    const t = (raw || '').trim();
    if (!t) return { id: 'unassigned', name: 'Unassigned' };
    const lower = t.toLowerCase();
    const byId = departments.find((d) => d.id === lower);
    if (byId) return { id: byId.id, name: byId.name };
    const byName = departments.find((d) => d.name.toLowerCase() === lower);
    if (byName) return { id: byName.id, name: byName.name };
    const partial = departments.find(
      (d) =>
        lower.includes(d.id) ||
        d.name.toLowerCase().includes(lower) ||
        lower.includes(d.name.toLowerCase())
    );
    if (partial) return { id: partial.id, name: partial.name };
    return { id: lower.replace(/\s+/g, '_').slice(0, 40), name: t };
  };

  type DeptRow = {
    id: string;
    name: string;
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    rejected: number;
  };
  const rows = new Map<string, DeptRow>();
  const ensure = (id: string, name: string) => {
    if (!rows.has(id)) {
      rows.set(id, { id, name, total: 0, open: 0, in_progress: 0, resolved: 0, rejected: 0 });
    }
    return rows.get(id)!;
  };

  for (const c of all) {
    const ai = analysisMap.get(c.id) || null;
    const cluster = c.cluster_id ? await findCluster(c.cluster_id) : null;
    const { id, name } = resolveDept(ai?.department || cluster?.department);
    const row = ensure(id, name);
    row.total += 1;
    row[bucket(c.status)] += 1;
  }

  const deptList = Array.from(rows.values())
    .map((r) => ({
      ...r,
      resolution_rate: r.total > 0 ? Math.round((r.resolved / r.total) * 100) : 0,
    }))
    .sort((a, b) => b.resolved - a.resolved || b.total - a.total);

  type CatRow = {
    category: string;
    open: number;
    in_progress: number;
    resolved: number;
    rejected: number;
  };
  const catMap = new Map<string, CatRow>();
  for (const c of all) {
    const category = c.category || 'Unclassified';
    if (!catMap.has(category)) {
      catMap.set(category, { category, open: 0, in_progress: 0, resolved: 0, rejected: 0 });
    }
    catMap.get(category)![bucket(c.status)] += 1;
  }
  const category_status = Array.from(catMap.values()).sort((a, b) => {
    const ta = a.open + a.in_progress + a.resolved + a.rejected;
    const tb = b.open + b.in_progress + b.resolved + b.rejected;
    return tb - ta;
  });

  return { departments: deptList, category_status };
}

export async function overview(): Promise<{
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  pending_ai: number;
  urgent: number;
  clusters: number;
  categories: Record<string, number>;
  wards: Record<string, number>;
}> {
  const all = (await loadAllComplaints()).filter((c) => c.status !== 'flagged');
  const analysisMap = await loadAnalysisMap();
  const byStatus = (s: string) => all.filter((c) => c.status === s).length;

  const urgent = all.filter((c) => {
    const ai = analysisMap.get(c.id);
    return (
      ai?.urgency === 'high' ||
      ai?.urgency === 'critical' ||
      ai?.severity === 'high' ||
      ai?.severity === 'critical'
    );
  }).length;

  const categories: Record<string, number> = {};
  for (const c of all) {
    const key = c.category || 'Unclassified';
    categories[key] = (categories[key] || 0) + 1;
  }

  const wards: Record<string, number> = {};
  for (const c of all) {
    const key = c.ward || 'Unknown';
    wards[key] = (wards[key] || 0) + 1;
  }

  const clusterRes = await pgQuery<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM clusters'
  );

  return {
    total: all.length,
    open: byStatus('open') + byStatus('needs_review'),
    in_progress: byStatus('in_progress'),
    resolved: byStatus('resolved'),
    rejected: byStatus('rejected'),
    pending_ai: byStatus('pending_ai'),
    urgent,
    clusters: Number(clusterRes.rows[0]?.count || 0),
    categories,
    wards,
  };
}

export async function trends(): Promise<{ daily: Array<{ date: string; count: number }> }> {
  const complaints = await openComplaints();
  const days: Record<string, number> = {};
  for (const c of complaints) {
    const d = c.created_at.slice(0, 10);
    days[d] = (days[d] || 0) + 1;
  }
  const series = Object.keys(days)
    .sort()
    .slice(-30)
    .map((date) => ({ date, count: days[date] }));
  return { daily: series };
}

export async function emerging(): Promise<
  Array<{
    category: string;
    last_7_days: number;
    previous_7_days: number;
    delta: number;
  }>
> {
  const now = Date.now();
  const week = 7 * 24 * 3600 * 1000;
  const recent: Record<string, number> = {};
  const prior: Record<string, number> = {};

  const complaints = await openComplaints();
  for (const c of complaints) {
    const t = new Date(c.created_at).getTime();
    const cat = c.category || 'Unclassified';
    if (now - t <= week) {
      recent[cat] = (recent[cat] || 0) + 1;
    } else if (now - t <= 2 * week) {
      prior[cat] = (prior[cat] || 0) + 1;
    }
  }

  return Object.keys({ ...recent, ...prior }).map((category) => ({
    category,
    last_7_days: recent[category] || 0,
    previous_7_days: prior[category] || 0,
    delta: (recent[category] || 0) - (prior[category] || 0),
  }));
}

export async function toPublic(
  c: Complaint,
  currentUserId?: string | null
): Promise<ReturnType<typeof publicComplaintDto>> {
  const [supported_by_me, ai, cluster, events] = await Promise.all([
    isSupported(currentUserId || undefined, c.id),
    analysisFor(c.id),
    findCluster(c.cluster_id),
    eventsFor(c.id),
  ]);

  return publicComplaintDto(c, {
    supported_by_me,
    ai,
    cluster,
    events,
    is_owner: currentUserId === c.author_id,
  });
}

export async function seedIfEmpty(seedFn: () => void | Promise<void>): Promise<void> {
  if (await isEmpty()) {
    await seedFn();
  }
}
