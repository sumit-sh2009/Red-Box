import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ensureSeedDataFile, resolveDataDir } from '../paths.js';
import { DEPARTMENTS } from './departments.js';
import { pgEnabled } from './pg.js';
import * as pgCivic from './civicPg.js';
import {
  AiAnalysis,
  AuditLog,
  Cluster,
  Complaint,
  ComplaintEvent,
  ComplaintSupport,
  Department,
  publicComplaintDto,
} from '../types/civic.js';

export { DEPARTMENTS };

interface CivicSchema {
  complaints: Complaint[];
  clusters: Cluster[];
  ai_analyses: AiAnalysis[];
  complaint_support: ComplaintSupport[];
  complaint_events: ComplaintEvent[];
  departments: Department[];
  audit_logs: AuditLog[];
}

const DATA_DIR = resolveDataDir();
const CIVIC_FILE = path.join(DATA_DIR, 'civic.json');
ensureSeedDataFile(DATA_DIR, 'civic.json');

class JsonCivicStore {
  private data: CivicSchema = {
    complaints: [],
    clusters: [],
    ai_analyses: [],
    complaint_support: [],
    complaint_events: [],
    departments: DEPARTMENTS,
    audit_logs: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      if (fs.existsSync(CIVIC_FILE)) {
        const raw = fs.readFileSync(CIVIC_FILE, 'utf-8');
        this.data = { ...this.data, ...JSON.parse(raw) };
        this.data.departments = DEPARTMENTS;
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Civic store init failed:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(CIVIC_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Civic store save failed:', err);
    }
  }

  public isEmpty() {
    return this.data.complaints.length === 0;
  }

  public listDepartments() {
    return this.data.departments;
  }

  public createComplaint(c: Complaint, event?: ComplaintEvent) {
    this.data.complaints.unshift(c);
    if (event) this.data.complaint_events.unshift(event);
    this.save();
    return c;
  }

  public updateComplaint(id: string, patch: Partial<Complaint>) {
    const c = this.data.complaints.find((x) => x.id === id);
    if (!c) return undefined;
    Object.assign(c, patch, { updated_at: new Date().toISOString() });
    this.save();
    return c;
  }

  public findComplaint(id: string) {
    return this.data.complaints.find((c) => c.id === id);
  }

  public listComplaints(opts: {
    mineUserId?: string;
    publicOnly?: boolean;
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    let rows = [...this.data.complaints];
    if (opts.mineUserId) {
      rows = rows.filter((c) => c.author_id === opts.mineUserId);
    } else if (opts.publicOnly) {
      rows = rows.filter((c) => c.status !== 'flagged' && c.status !== 'pending_ai');
    }
    if (opts.category) rows = rows.filter((c) => c.category === opts.category);
    if (opts.status) rows = rows.filter((c) => c.status === opts.status);
    if (opts.search) {
      const q = opts.search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.body.toLowerCase().includes(q) ||
          (c.location_text || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const start = (page - 1) * limit;
    return {
      total: rows.length,
      hasMore: start + limit < rows.length,
      complaints: rows.slice(start, start + limit),
    };
  }

  public addEvent(ev: ComplaintEvent) {
    this.data.complaint_events.unshift(ev);
    this.save();
  }

  public eventsFor(complaintId: string) {
    return this.data.complaint_events
      .filter((e) => e.complaint_id === complaintId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public toggleSupport(userId: string, complaintId: string) {
    const c = this.findComplaint(complaintId);
    if (!c) throw new Error('Complaint not found');
    const idx = this.data.complaint_support.findIndex(
      (s) => s.user_id === userId && s.complaint_id === complaintId
    );
    if (idx > -1) {
      this.data.complaint_support.splice(idx, 1);
      c.support_count = Math.max(0, c.support_count - 1);
      this.recomputeClusterSupport(c.cluster_id);
      this.save();
      return { supported: false, support_count: c.support_count };
    }
    this.data.complaint_support.push({
      user_id: userId,
      complaint_id: complaintId,
      created_at: new Date().toISOString(),
    });
    c.support_count += 1;
    this.recomputeClusterSupport(c.cluster_id);
    this.save();
    return { supported: true, support_count: c.support_count };
  }

  public isSupported(userId: string | undefined, complaintId: string) {
    if (!userId) return false;
    return this.data.complaint_support.some(
      (s) => s.user_id === userId && s.complaint_id === complaintId
    );
  }

  public saveAnalysis(a: AiAnalysis) {
    this.data.ai_analyses = this.data.ai_analyses.filter((x) => x.complaint_id !== a.complaint_id);
    this.data.ai_analyses.unshift(a);
    this.save();
    return a;
  }

  public analysisFor(complaintId: string) {
    return this.data.ai_analyses.find((a) => a.complaint_id === complaintId) || null;
  }

  public listAnalyses() {
    return this.data.ai_analyses;
  }

  public findCluster(id: string | null) {
    if (!id) return null;
    return this.data.clusters.find((c) => c.id === id) || null;
  }

  public listClusters() {
    return [...this.data.clusters].sort((a, b) => b.size - a.size);
  }

  public upsertCluster(cluster: Cluster) {
    const existing = this.data.clusters.find((c) => c.id === cluster.id);
    if (existing) Object.assign(existing, cluster);
    else this.data.clusters.push(cluster);
    this.save();
    return cluster;
  }

  private recomputeClusterSupport(clusterId: string | null) {
    if (!clusterId) return;
    const cluster = this.findCluster(clusterId);
    if (!cluster) return;
    const members = this.data.complaints.filter((c) => c.cluster_id === clusterId);
    cluster.size = members.length;
    cluster.support_total = members.reduce((n, c) => n + c.support_count, 0);
    cluster.updated_at = new Date().toISOString();
  }

  public attachToCluster(complaintId: string, clusterId: string) {
    const c = this.findComplaint(complaintId);
    if (!c) return;
    c.cluster_id = clusterId;
    this.recomputeClusterSupport(clusterId);
    this.save();
  }

  public complaintsInCluster(clusterId: string) {
    return this.data.complaints.filter((c) => c.cluster_id === clusterId);
  }

  public audit(log: AuditLog) {
    this.data.audit_logs.unshift(log);
    this.save();
  }

  public openComplaints() {
    return this.data.complaints.filter((c) => c.status !== 'flagged');
  }

  public departmentStats() {
    const all = this.data.complaints.filter((c) => c.status !== 'flagged');

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
      const byId = this.data.departments.find((d) => d.id === lower);
      if (byId) return { id: byId.id, name: byId.name };
      const byName = this.data.departments.find((d) => d.name.toLowerCase() === lower);
      if (byName) return { id: byName.id, name: byName.name };
      const partial = this.data.departments.find(
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

    all.forEach((c) => {
      const ai = this.analysisFor(c.id);
      const cluster = this.findCluster(c.cluster_id);
      const { id, name } = resolveDept(ai?.department || cluster?.department);
      const row = ensure(id, name);
      row.total += 1;
      row[bucket(c.status)] += 1;
    });

    const departments = Array.from(rows.values())
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
    all.forEach((c) => {
      const category = c.category || 'Unclassified';
      if (!catMap.has(category)) {
        catMap.set(category, { category, open: 0, in_progress: 0, resolved: 0, rejected: 0 });
      }
      catMap.get(category)![bucket(c.status)] += 1;
    });
    const category_status = Array.from(catMap.values()).sort((a, b) => {
      const ta = a.open + a.in_progress + a.resolved + a.rejected;
      const tb = b.open + b.in_progress + b.resolved + b.rejected;
      return tb - ta;
    });

    return { departments, category_status };
  }

  public overview() {
    const all = this.data.complaints.filter((c) => c.status !== 'flagged');
    const byStatus = (s: string) => all.filter((c) => c.status === s).length;
    const urgent = all.filter((c) => {
      const ai = this.analysisFor(c.id);
      return ai?.urgency === 'high' || ai?.urgency === 'critical' || ai?.severity === 'high' || ai?.severity === 'critical';
    }).length;
    const categories: Record<string, number> = {};
    all.forEach((c) => {
      const key = c.category || 'Unclassified';
      categories[key] = (categories[key] || 0) + 1;
    });
    const wards: Record<string, number> = {};
    all.forEach((c) => {
      const key = c.ward || 'Unknown';
      wards[key] = (wards[key] || 0) + 1;
    });
    return {
      total: all.length,
      open: byStatus('open') + byStatus('needs_review'),
      in_progress: byStatus('in_progress'),
      resolved: byStatus('resolved'),
      rejected: byStatus('rejected'),
      pending_ai: byStatus('pending_ai'),
      urgent,
      clusters: this.data.clusters.length,
      categories,
      wards,
    };
  }

  public trends() {
    const days: Record<string, number> = {};
    this.openComplaints().forEach((c) => {
      const d = c.created_at.slice(0, 10);
      days[d] = (days[d] || 0) + 1;
    });
    const series = Object.keys(days)
      .sort()
      .slice(-30)
      .map((date) => ({ date, count: days[date] }));
    return { daily: series };
  }

  public emerging() {
    const now = Date.now();
    const week = 7 * 24 * 3600 * 1000;
    const recent: Record<string, number> = {};
    const prior: Record<string, number> = {};
    this.openComplaints().forEach((c) => {
      const t = new Date(c.created_at).getTime();
      const cat = c.category || 'Unclassified';
      if (now - t <= week) recent[cat] = (recent[cat] || 0) + 1;
      else if (now - t <= 2 * week) prior[cat] = (prior[cat] || 0) + 1;
    });
    return Object.keys({ ...recent, ...prior }).map((category) => ({
      category,
      last_7_days: recent[category] || 0,
      previous_7_days: prior[category] || 0,
      delta: (recent[category] || 0) - (prior[category] || 0),
    }));
  }

  public toPublic(c: Complaint, currentUserId?: string | null) {
    return publicComplaintDto(c, {
      supported_by_me: this.isSupported(currentUserId || undefined, c.id),
      ai: this.analysisFor(c.id),
      cluster: this.findCluster(c.cluster_id),
      events: this.eventsFor(c.id),
      is_owner: currentUserId === c.author_id,
    });
  }

  public seedIfEmpty(seedFn: () => void) {
    if (this.isEmpty()) seedFn();
  }
}

const jsonCivic = new JsonCivicStore();

function usePg() {
  return pgEnabled();
}

export const civic = {
  isEmpty: () => (usePg() ? pgCivic.isEmpty() : Promise.resolve(jsonCivic.isEmpty())),
  listDepartments: () =>
    usePg() ? pgCivic.listDepartments() : Promise.resolve(jsonCivic.listDepartments()),
  createComplaint: (c: Complaint, event?: ComplaintEvent) =>
    usePg() ? pgCivic.createComplaint(c, event) : Promise.resolve(jsonCivic.createComplaint(c, event)),
  updateComplaint: (id: string, patch: Partial<Complaint>) =>
    usePg() ? pgCivic.updateComplaint(id, patch) : Promise.resolve(jsonCivic.updateComplaint(id, patch)),
  findComplaint: (id: string) =>
    usePg() ? pgCivic.findComplaint(id) : Promise.resolve(jsonCivic.findComplaint(id)),
  listComplaints: (opts: Parameters<typeof jsonCivic.listComplaints>[0]) =>
    usePg() ? pgCivic.listComplaints(opts) : Promise.resolve(jsonCivic.listComplaints(opts)),
  addEvent: (ev: ComplaintEvent) =>
    usePg() ? pgCivic.addEvent(ev) : Promise.resolve(jsonCivic.addEvent(ev)),
  eventsFor: (complaintId: string) =>
    usePg() ? pgCivic.eventsFor(complaintId) : Promise.resolve(jsonCivic.eventsFor(complaintId)),
  toggleSupport: (userId: string, complaintId: string) =>
    usePg() ? pgCivic.toggleSupport(userId, complaintId) : Promise.resolve(jsonCivic.toggleSupport(userId, complaintId)),
  isSupported: (userId: string | undefined, complaintId: string) =>
    usePg() ? pgCivic.isSupported(userId, complaintId) : Promise.resolve(jsonCivic.isSupported(userId, complaintId)),
  saveAnalysis: (a: AiAnalysis) =>
    usePg() ? pgCivic.saveAnalysis(a) : Promise.resolve(jsonCivic.saveAnalysis(a)),
  analysisFor: (complaintId: string) =>
    usePg() ? pgCivic.analysisFor(complaintId) : Promise.resolve(jsonCivic.analysisFor(complaintId)),
  listAnalyses: () =>
    usePg() ? pgCivic.listAnalyses() : Promise.resolve(jsonCivic.listAnalyses()),
  findCluster: (id: string | null) =>
    usePg() ? pgCivic.findCluster(id) : Promise.resolve(jsonCivic.findCluster(id)),
  listClusters: () =>
    usePg() ? pgCivic.listClusters() : Promise.resolve(jsonCivic.listClusters()),
  upsertCluster: (cluster: Cluster) =>
    usePg() ? pgCivic.upsertCluster(cluster) : Promise.resolve(jsonCivic.upsertCluster(cluster)),
  attachToCluster: (complaintId: string, clusterId: string) =>
    usePg() ? pgCivic.attachToCluster(complaintId, clusterId) : Promise.resolve(jsonCivic.attachToCluster(complaintId, clusterId)),
  complaintsInCluster: (clusterId: string) =>
    usePg() ? pgCivic.complaintsInCluster(clusterId) : Promise.resolve(jsonCivic.complaintsInCluster(clusterId)),
  audit: (log: AuditLog) =>
    usePg() ? pgCivic.audit(log) : Promise.resolve(jsonCivic.audit(log)),
  openComplaints: () =>
    usePg() ? pgCivic.openComplaints() : Promise.resolve(jsonCivic.openComplaints()),
  departmentStats: () =>
    usePg() ? pgCivic.departmentStats() : Promise.resolve(jsonCivic.departmentStats()),
  overview: () => (usePg() ? pgCivic.overview() : Promise.resolve(jsonCivic.overview())),
  trends: () => (usePg() ? pgCivic.trends() : Promise.resolve(jsonCivic.trends())),
  emerging: () => (usePg() ? pgCivic.emerging() : Promise.resolve(jsonCivic.emerging())),
  toPublic: (c: Complaint, currentUserId?: string | null) =>
    usePg() ? pgCivic.toPublic(c, currentUserId) : Promise.resolve(jsonCivic.toPublic(c, currentUserId)),
  seedIfEmpty: (seedFn: () => void | Promise<void>) =>
    usePg() ? pgCivic.seedIfEmpty(seedFn) : Promise.resolve(jsonCivic.seedIfEmpty(seedFn as () => void)),
};

export function newId(prefix: string) {
  return `${prefix}_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
}
