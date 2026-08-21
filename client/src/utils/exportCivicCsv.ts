import type { CitizenRequest, GovDepartmentRank } from '../types/index.js';

export type CsvKind = 'complaints' | 'clusters' | 'departments' | 'summary';

const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

function isoStamp(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toISOString();
}

function flattenCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value).replace(/\r\n|\r|\n/g, ' ').trim();
}

function csvCell(value: string | number | boolean | null | undefined): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  const s = flattenCell(value);
  if (s === '') return '';
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const lines = [
    headers.join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ];
  return `\uFEFF${lines.join('\n')}\n`;
}

export function downloadCsvFile(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function exportComplaintsCsv(requests: CitizenRequest[]) {
  const headers = [
    'id',
    'tracking_code',
    'status',
    'priority',
    'category',
    'ward',
    'location',
    'department',
    'support_count',
    'cluster_id',
    'cluster_title',
    'created_at',
  ];
  const sorted = [...requests].sort((a, b) => {
    const pr = (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0);
    if (pr !== 0) return pr;
    return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
  });
  const rows = sorted.map((r) => [
    r.id,
    r.trackingCode,
    r.sourceStatus || r.status,
    r.priority,
    r.category,
    r.ward,
    r.location,
    r.assignedOfficer ?? '',
    typeof r.supportCount === 'number' ? r.supportCount : '',
    r.clusterId ?? '',
    r.clusterTitle ?? '',
    isoStamp(r.timestamp),
  ]);
  downloadCsvFile(`civic_complaints_${stamp()}.csv`, buildCsv(headers, rows));
}

export function exportClustersCsv(clusters: Array<Record<string, any>>) {
  const headers = [
    'id',
    'title',
    'location',
    'ward',
    'size',
    'support_total',
    'urgency',
    'department',
    'government_priority',
  ];
  const rows = clusters.map((cl) => [
    cl.id ?? '',
    cl.title ?? '',
    cl.location_text ?? cl.location ?? '',
    cl.ward ?? '',
    typeof cl.size === 'number' ? cl.size : '',
    typeof cl.support_total === 'number' ? cl.support_total : '',
    cl.urgency ?? '',
    cl.department ?? '',
    typeof cl.scores?.government_priority === 'number' ? cl.scores.government_priority : '',
  ]);
  downloadCsvFile(`civic_clusters_${stamp()}.csv`, buildCsv(headers, rows));
}

export function exportDepartmentsCsv(departments: GovDepartmentRank[]) {
  const headers = [
    'id',
    'name',
    'total',
    'open',
    'in_progress',
    'resolved',
    'rejected',
    'resolution_rate',
  ];
  const rows = departments.map((d) => [
    d.id,
    d.name,
    d.total,
    d.open,
    d.in_progress,
    d.resolved,
    d.rejected,
    d.resolution_rate,
  ]);
  downloadCsvFile(`civic_departments_${stamp()}.csv`, buildCsv(headers, rows));
}

export function exportSummaryCsv(
  overview: Record<string, any> | null,
  requests: CitizenRequest[]
) {
  const categories = (overview?.categories || {}) as Record<string, number>;
  const wards = (overview?.wards || {}) as Record<string, number>;
  const catEntries = Object.entries(categories);
  const wardEntries = Object.entries(wards);
  const catTotal =
    catEntries.reduce((s, [, n]) => s + Number(n || 0), 0) || requests.length;
  const wardTotal =
    wardEntries.reduce((s, [, n]) => s + Number(n || 0), 0) || requests.length;

  const headers = ['dimension', 'name', 'count', 'pct_of_total'];
  const rows: Array<Array<string | number>> = [];

  for (const [name, count] of catEntries.sort((a, b) => Number(b[1]) - Number(a[1]))) {
    rows.push(['category', name, Number(count), pct(Number(count), catTotal)]);
  }
  for (const [name, count] of wardEntries.sort((a, b) => Number(b[1]) - Number(a[1]))) {
    rows.push(['ward', name, Number(count), pct(Number(count), wardTotal)]);
  }

  downloadCsvFile(`civic_summary_${stamp()}.csv`, buildCsv(headers, rows));
}

export function exportCivicCsv(
  kind: CsvKind,
  input: {
    requests: CitizenRequest[];
    clusters: Array<Record<string, any>>;
    departments: GovDepartmentRank[];
    overview: Record<string, any> | null;
  }
) {
  if (kind === 'complaints') exportComplaintsCsv(input.requests);
  else if (kind === 'clusters') exportClustersCsv(input.clusters);
  else if (kind === 'departments') exportDepartmentsCsv(input.departments);
  else exportSummaryCsv(input.overview, input.requests);
}
