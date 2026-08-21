import { jsPDF } from 'jspdf';
import type { CitizenRequest, GovDepartmentRank } from '../types/index.js';

export interface CivicPdfInput {
  overview: Record<string, any> | null;
  narrative: string;
  briefingModel?: string;
  generatedAt?: string;
  clusters: Array<Record<string, any>>;
  departments: GovDepartmentRank[];
  requests: CitizenRequest[];
}

type RGB = [number, number, number];

const NAVY: RGB = [30, 58, 95];
const TEAL: RGB = [15, 118, 110];
const SLATE: RGB = [71, 85, 105];
const INK: RGB = [30, 41, 55];
const MUTED: RGB = [100, 110, 120];
const LINE: RGB = [203, 213, 225];
const PAPER: RGB = [248, 247, 244];
const WHITE: RGB = [255, 255, 255];
const HIGH: RGB = [176, 72, 48];
const MED: RGB = [176, 130, 48];
const LOW: RGB = [120, 125, 132];
const OPEN: RGB = [30, 58, 95];
const PROG: RGB = [15, 118, 110];
const DONE: RGB = [70, 120, 90];
const REJ: RGB = [140, 110, 100];

const CATEGORY_COLORS: Record<string, RGB> = {
  'Roads & Infrastructure': [30, 58, 95],
  'Water Supply & Drainage': [15, 118, 110],
  'Sanitation & Waste': [90, 112, 72],
  'Street Lighting & Power': [176, 140, 52],
  'Public Safety & Hazards': [160, 72, 56],
  'Parks & Public Amenities': [48, 118, 92],
  'Education & Community': [72, 92, 140],
  Transport: [52, 92, 132],
  Noise: [120, 100, 80],
  Construction: [100, 92, 80],
  'Other Civic Issues': [90, 100, 110],
  Unclassified: [140, 145, 150],
};

const MARGIN = 16;
const FOOTER_H = 12;
const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

function catColor(name: string): RGB {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const palette = Object.values(CATEGORY_COLORS);
  return palette[h % palette.length];
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDay(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function clip(text: string, max: number) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t || '—';
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Strip markdown artifacts so the PDF never shows ** * - from briefing text. */
export function stripBriefingMarkdown(raw: string): string {
  const lines = (raw || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => {
      let s = line.trim();
      s = s.replace(/^#{1,6}\s+/, '');
      s = s.replace(/^\s*[-*+]\s+/, '');
      s = s.replace(/^\s*\d+\.\s+/, '');
      s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
      s = s.replace(/__([^_]+)__/g, '$1');
      s = s.replace(/\*([^*]+)\*/g, '$1');
      s = s.replace(/_([^_]+)_/g, '$1');
      s = s.replace(/`([^`]+)`/g, '$1');
      s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      return s.trim();
    });
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function entries(record: Record<string, number> | undefined): Array<[string, number]> {
  if (!record) return [];
  return Object.entries(record)
    .map(([k, v]) => [k, num(v)] as [string, number])
    .sort((a, b) => b[1] - a[1]);
}

function fill(doc: jsPDF, c: RGB) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function stroke(doc: jsPDF, c: RGB) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function ink(doc: jsPDF, c: RGB) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function priorityColor(p: string): RGB {
  if (p === 'high') return HIGH;
  if (p === 'medium') return MED;
  return LOW;
}

class ReportDoc {
  doc: jsPDF;
  pageW: number;
  pageH: number;
  maxW: number;
  y: number;
  contentBottom: number;

  constructor() {
    this.doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', putOnlyUsedFonts: true });
    this.pageW = this.doc.internal.pageSize.getWidth();
    this.pageH = this.doc.internal.pageSize.getHeight();
    this.maxW = this.pageW - MARGIN * 2;
    this.y = MARGIN;
    this.contentBottom = this.pageH - FOOTER_H - 4;
  }

  remaining() {
    return this.contentBottom - this.y;
  }

  newPage() {
    this.doc.addPage();
    this.y = MARGIN;
  }

  ensure(needed: number, opts?: { keepWith?: number }) {
    const need = needed + (opts?.keepWith || 0);
    if (this.y + need > this.contentBottom) {
      this.newPage();
    }
  }

  sectionTitle(title: string, keepWith = 22) {
    this.ensure(10, { keepWith });
    this.y += this.y === MARGIN ? 0 : 3;
    fill(this.doc, NAVY);
    this.doc.rect(MARGIN, this.y, 1.6, 6, 'F');
    ink(this.doc, NAVY);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text(title, MARGIN + 4, this.y + 5);
    this.y += 10;
  }

  mutedLine(text: string) {
    ink(this.doc, MUTED);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.text(text, MARGIN, this.y);
    this.y += 5;
  }

  wrapped(text: string, x: number, width: number, size = 9, lh = 4.2, color: RGB = INK): number {
    this.doc.setFontSize(size);
    ink(this.doc, color);
    const lines = this.doc.splitTextToSize(text || '—', width) as string[];
    for (const line of lines) {
      this.ensure(lh);
      this.doc.text(line, x, this.y);
      this.y += lh;
    }
    return lines.length;
  }
}

function deriveKpis(overview: Record<string, any> | null, requests: CitizenRequest[], clusterCount: number) {
  const ov = overview || {};
  const fromReq = (status: CitizenRequest['status']) => requests.filter((r) => r.status === status).length;
  const pendingFromQueue = requests.filter((r) => r.sourceStatus === 'pending_ai').length;
  const pendingAi =
    ov.pending_ai ?? (requests.some((r) => r.sourceStatus != null) ? pendingFromQueue : undefined);
  const open = ov.open ?? fromReq('pending');
  return [
    { label: 'Total reports', value: ov.total ?? requests.length },
    { label: 'Urgent', value: ov.urgent ?? requests.filter((r) => r.priority === 'high').length },
    { label: 'Clusters', value: ov.clusters ?? clusterCount },
    { label: 'Open / pending', value: open },
    { label: 'In progress', value: ov.in_progress ?? fromReq('in_progress') },
    { label: 'Resolved', value: ov.resolved ?? fromReq('completed') },
    { label: 'Rejected', value: ov.rejected ?? fromReq('rejected') },
    ...(pendingAi != null ? [{ label: 'Pending AI', value: pendingAi }] : []),
  ];
}

function drawHeader(r: ReportDoc, generatedAt?: string) {
  const { doc, pageW } = r;
  fill(doc, NAVY);
  doc.rect(0, 0, pageW, 28, 'F');
  fill(doc, TEAL);
  doc.rect(0, 28, pageW, 1.4, 'F');
  ink(doc, WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Red-Box', MARGIN, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Civic Intelligence Report', MARGIN, 19);
  const right = [
    'Municipal intelligence',
    fmtDay(generatedAt || new Date().toISOString()),
  ];
  doc.setFontSize(8);
  doc.text(right, pageW - MARGIN, 11, { align: 'right' });
  r.y = 34;
}

function drawKpiGrid(r: ReportDoc, kpis: Array<{ label: string; value: number }>) {
  const cols = 4;
  const gap = 2.4;
  const cellW = (r.maxW - gap * (cols - 1)) / cols;
  const cellH = 16;
  const rows = Math.ceil(kpis.length / cols);
  r.ensure(rows * (cellH + gap) + 2);
  kpis.forEach((kpi, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + col * (cellW + gap);
    const y = r.y + row * (cellH + gap);
    fill(r.doc, PAPER);
    stroke(r.doc, LINE);
    r.doc.setLineWidth(0.2);
    r.doc.rect(x, y, cellW, cellH, 'FD');
    fill(r.doc, i === 1 && kpi.value > 0 ? HIGH : TEAL);
    r.doc.rect(x, y, 1.4, cellH, 'F');
    ink(r.doc, MUTED);
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(6.5);
    r.doc.text(kpi.label.toUpperCase(), x + 4, y + 5.2);
    ink(r.doc, NAVY);
    r.doc.setFont('helvetica', 'bold');
    r.doc.setFontSize(13);
    r.doc.text(String(kpi.value ?? 0), x + 4, y + 12.4);
  });
  r.y += rows * (cellH + gap) + 3;
}

function drawBriefing(r: ReportDoc, narrative: string, model?: string) {
  const body = stripBriefingMarkdown(narrative) || 'Counts above are from the civic store. No narrative was returned.';
  r.ensure(32);
  r.doc.setFont('helvetica', 'normal');
  r.doc.setFontSize(8.5);
  const lines = r.doc.splitTextToSize(body, r.maxW - 8) as string[];
  const maxLines = Math.min(14, Math.max(3, Math.floor((r.remaining() - 16) / 3.8)));
  const shown = lines.slice(0, maxLines);
  const extra = lines.length > shown.length ? 4 : 0;
  const h = 10 + shown.length * 3.8 + extra;
  fill(r.doc, PAPER);
  stroke(r.doc, LINE);
  r.doc.rect(MARGIN, r.y, r.maxW, h, 'FD');
  fill(r.doc, TEAL);
  r.doc.rect(MARGIN, r.y, r.maxW, 5.5, 'F');
  ink(r.doc, WHITE);
  r.doc.setFont('helvetica', 'bold');
  r.doc.setFontSize(8);
  r.doc.text('Grounded AI briefing', MARGIN + 3, r.y + 3.8);
  if (model) {
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(7);
    r.doc.text(clip(model, 42), MARGIN + r.maxW - 3, r.y + 3.8, { align: 'right' });
  }
  let ty = r.y + 10;
  ink(r.doc, INK);
  r.doc.setFont('helvetica', 'normal');
  r.doc.setFontSize(8.5);
  for (const line of shown) {
    r.doc.text(line, MARGIN + 3.5, ty);
    ty += 3.8;
  }
  if (lines.length > shown.length) {
    ink(r.doc, MUTED);
    r.doc.setFontSize(7.5);
    r.doc.text('Narrative truncated for print layout — live totals are unchanged.', MARGIN + 3.5, ty);
  }
  r.y += h + 4;
}

function drawHBars(
  r: ReportDoc,
  items: Array<[string, number]>,
  total: number,
  opts: { highlightFirst?: boolean; maxRows?: number }
) {
  const rows = items.slice(0, opts.maxRows ?? 8);
  if (!rows.length) {
    r.mutedLine('No counts in the live store for this dimension.');
    return;
  }
  const labelW = 52;
  const barW = r.maxW - labelW - 22;
  const rowH = 6.2;
  r.ensure(rows.length * rowH + 2);
  const maxVal = Math.max(...rows.map(([, n]) => n), 1);
  rows.forEach(([name, count], i) => {
    r.ensure(rowH);
    const y = r.y;
    ink(r.doc, i === 0 && opts.highlightFirst ? NAVY : SLATE);
    r.doc.setFont('helvetica', i === 0 && opts.highlightFirst ? 'bold' : 'normal');
    r.doc.setFontSize(7.5);
    r.doc.text(clip(name, 28), MARGIN, y + 3.6);
    const x = MARGIN + labelW;
    fill(r.doc, [232, 234, 237]);
    r.doc.rect(x, y + 1.2, barW, 3.6, 'F');
    const w = Math.max(0.8, (count / maxVal) * barW);
    fill(r.doc, i === 0 && opts.highlightFirst ? TEAL : catColor(name));
    r.doc.rect(x, y + 1.2, w, 3.6, 'F');
    ink(r.doc, INK);
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(7);
    r.doc.text(`${count}  ${pct(count, total)}%`, x + barW + 2, y + 3.8);
    r.y += rowH;
  });
  r.y += 2;
}

function drawDistribution(r: ReportDoc, cats: Array<[string, number]>, total: number) {
  r.ensure(18);
  if (!cats.length || !total) {
    r.mutedLine('No issue distribution yet — the live store has no categorized filings.');
    return;
  }
  const h = 10;
  let x = MARGIN;
  cats.forEach(([name, count]) => {
    const w = (count / total) * r.maxW;
    if (w <= 0) return;
    fill(r.doc, catColor(name));
    r.doc.rect(x, r.y, w, h, 'F');
    x += w;
  });
  r.y += h + 3;
  const colW = r.maxW / 2;
  cats.slice(0, 8).forEach(([name, count], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx = MARGIN + col * colW;
    const ly = r.y + row * 4.2;
    fill(r.doc, catColor(name));
    r.doc.rect(lx, ly - 2.2, 2.6, 2.6, 'F');
    ink(r.doc, SLATE);
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(7);
    r.doc.text(`${clip(name, 32)}  ${count} (${pct(count, total)}%)`, lx + 4, ly);
  });
  r.y += Math.ceil(Math.min(cats.length, 8) / 2) * 4.2 + 3;
}

function drawDeptTable(r: ReportDoc, departments: GovDepartmentRank[]) {
  if (!departments.length) {
    r.mutedLine('No department routing in the live store yet.');
    return;
  }
  const cols = [
    { key: 'name', label: 'Department', w: 82, align: 'left' as const },
    { key: 'total', label: 'Total', w: 16, align: 'right' as const },
    { key: 'open', label: 'Open', w: 16, align: 'right' as const },
    { key: 'in_progress', label: 'In prog.', w: 20, align: 'right' as const },
    { key: 'resolved', label: 'Resolved', w: 22, align: 'right' as const },
    { key: 'rate', label: 'Res. rate', w: 22, align: 'right' as const },
  ];
  const rowH = 6.4;
  const headerH = 6.5;
  const drawHead = () => {
    r.ensure(headerH + rowH * 2);
    fill(r.doc, NAVY);
    r.doc.rect(MARGIN, r.y, r.maxW, headerH, 'F');
    ink(r.doc, WHITE);
    r.doc.setFont('helvetica', 'bold');
    r.doc.setFontSize(7);
    let x = MARGIN;
    cols.forEach((c) => {
      const tx = c.align === 'right' ? x + c.w - 1.5 : x + 1.8;
      r.doc.text(c.label, tx, r.y + 4.4, c.align === 'right' ? { align: 'right' } : undefined);
      x += c.w;
    });
    r.y += headerH;
  };
  drawHead();
  departments.forEach((d, i) => {
    if (r.remaining() < rowH + 2) {
      r.newPage();
      drawHead();
    }
    if (i % 2 === 0) {
      fill(r.doc, PAPER);
      r.doc.rect(MARGIN, r.y, r.maxW, rowH, 'F');
    }
    ink(r.doc, INK);
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(7.5);
    const vals = [
      clip(d.name, 38),
      String(d.total ?? 0),
      String(d.open ?? 0),
      String(d.in_progress ?? 0),
      String(d.resolved ?? 0),
      `${num(d.resolution_rate)}%`,
    ];
    let x = MARGIN;
    cols.forEach((c, ci) => {
      const tx = c.align === 'right' ? x + c.w - 1.5 : x + 1.8;
      r.doc.text(vals[ci], tx, r.y + 4.4, c.align === 'right' ? { align: 'right' } : undefined);
      x += c.w;
    });
    r.y += rowH;
  });
  r.y += 3;
}

function drawDeptStacks(r: ReportDoc, departments: GovDepartmentRank[]) {
  const rows = departments.slice(0, 8);
  if (!rows.length) return;
  const maxTotal = Math.max(...rows.map((d) => num(d.total)), 1);
  const labelW = 48;
  const barW = r.maxW - labelW - 16;
  r.ensure(10 + rows.length * 6.5);
  r.doc.setFontSize(7);
  const legend: Array<[string, RGB]> = [
    ['Open', OPEN],
    ['In progress', PROG],
    ['Resolved', DONE],
    ['Rejected', REJ],
  ];
  let lx = MARGIN;
  legend.forEach(([lab, c]) => {
    fill(r.doc, c);
    r.doc.rect(lx, r.y - 2.2, 2.4, 2.4, 'F');
    ink(r.doc, SLATE);
    r.doc.text(lab, lx + 3.4, r.y);
    lx += 28;
  });
  r.y += 4;
  rows.forEach((d) => {
    r.ensure(6.4);
    ink(r.doc, SLATE);
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(7);
    r.doc.text(clip(d.name, 26), MARGIN, r.y + 3.2);
    const x0 = MARGIN + labelW;
    fill(r.doc, [232, 234, 237]);
    r.doc.rect(x0, r.y + 0.8, barW, 3.6, 'F');
    const scale = barW / maxTotal;
    let x = x0;
    const segs: Array<[number, RGB]> = [
      [num(d.open), OPEN],
      [num(d.in_progress), PROG],
      [num(d.resolved), DONE],
      [num(d.rejected), REJ],
    ];
    segs.forEach(([n, c]) => {
      if (n <= 0) return;
      const w = n * scale;
      fill(r.doc, c);
      r.doc.rect(x, r.y + 0.8, Math.max(0.4, w), 3.6, 'F');
      x += w;
    });
    ink(r.doc, MUTED);
    r.doc.setFontSize(6.5);
    r.doc.text(String(d.total ?? 0), x0 + barW + 2, r.y + 3.4);
    r.y += 6.2;
  });
  r.y += 2;
}

function clusterLocation(cl: Record<string, any>): string {
  return (
    cl.location_text ||
    cl.location ||
    cl.representative?.location_text ||
    cl.ward ||
    '—'
  );
}

function drawClusters(r: ReportDoc, clusters: Array<Record<string, any>>) {
  if (!clusters.length) {
    r.mutedLine('No active clusters in the live store.');
    return;
  }
  const gap = 2.5;
  const colW = (r.maxW - gap) / 2;
  const panelH = 28;
  clusters.forEach((cl, i) => {
    if (i % 2 === 0) r.ensure(panelH + 2);
    const col = i % 2;
    const x = MARGIN + col * (colW + gap);
    const y = r.y;
    fill(r.doc, PAPER);
    stroke(r.doc, LINE);
    r.doc.setLineWidth(0.2);
    r.doc.rect(x, y, colW, panelH, 'FD');
    const urg = String(cl.urgency || '').toLowerCase();
    fill(r.doc, urg === 'high' || urg === 'critical' ? HIGH : urg === 'low' ? LOW : TEAL);
    r.doc.rect(x, y, 1.5, panelH, 'F');
    ink(r.doc, NAVY);
    r.doc.setFont('helvetica', 'bold');
    r.doc.setFontSize(8);
    r.doc.text(clip(String(cl.title || 'Untitled cluster'), 42), x + 4, y + 5.5);
    ink(r.doc, SLATE);
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(7);
    r.doc.text(clip(clusterLocation(cl), 46), x + 4, y + 10.5);
    const meta = [
      `Size ${cl.size ?? '—'}`,
      `Support ${cl.support_total ?? '—'}`,
      cl.urgency ? `Urgency ${cl.urgency}` : null,
      cl.department ? String(cl.department) : null,
    ]
      .filter(Boolean)
      .join('  ·  ');
    r.doc.text(clip(meta, 58), x + 4, y + 16.2);
    if (cl.scores?.government_priority != null) {
      ink(r.doc, MUTED);
      r.doc.setFontSize(6.5);
      r.doc.text(`Gov. priority ${cl.scores.government_priority}`, x + 4, y + 21.5);
    }
    if (col === 1 || i === clusters.length - 1) r.y += panelH + gap;
  });
  r.y += 1;
}

function topPriorityIssues(requests: CitizenRequest[], n = 5): CitizenRequest[] {
  return [...requests]
    .sort((a, b) => {
      const pr = (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0);
      if (pr !== 0) return pr;
      return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
    })
    .slice(0, n);
}

function drawPriorityIssues(r: ReportDoc, items: CitizenRequest[]) {
  if (!items.length) {
    r.mutedLine('No filings in the current queue.');
    return;
  }
  items.forEach((req, i) => {
    r.ensure(16);
    const y = r.y;
    fill(r.doc, PAPER);
    stroke(r.doc, LINE);
    r.doc.rect(MARGIN, y, r.maxW, 14, 'FD');
    fill(r.doc, priorityColor(req.priority));
    r.doc.rect(MARGIN, y, 1.6, 14, 'F');
    ink(r.doc, NAVY);
    r.doc.setFont('helvetica', 'bold');
    r.doc.setFontSize(8);
    r.doc.text(`${i + 1}.  ${req.trackingCode}`, MARGIN + 4, y + 5);
    ink(r.doc, priorityColor(req.priority));
    r.doc.setFont('helvetica', 'bold');
    r.doc.setFontSize(7);
    r.doc.text(req.priority.toUpperCase(), MARGIN + r.maxW - 4, y + 5, { align: 'right' });
    ink(r.doc, SLATE);
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(7);
    r.doc.text(
      clip(
        `${req.category}  ·  ${req.ward}  ·  ${req.location}  ·  ${req.sourceStatus || req.status}`,
        110
      ),
      MARGIN + 4,
      y + 10
    );
    r.y += 16;
  });
}

function drawQueueTable(r: ReportDoc, requests: CitizenRequest[]) {
  const cols = [
    { label: 'Tracking', w: 26 },
    { label: 'Status', w: 22 },
    { label: 'Pri.', w: 14 },
    { label: 'Category', w: 38 },
    { label: 'Ward / location', w: 48 },
    { label: 'Description', w: 30 },
  ];
  const headerH = 6.5;
  const rowH = 8.2;
  const drawHead = () => {
    r.ensure(headerH + rowH * 2);
    fill(r.doc, NAVY);
    r.doc.rect(MARGIN, r.y, r.maxW, headerH, 'F');
    ink(r.doc, WHITE);
    r.doc.setFont('helvetica', 'bold');
    r.doc.setFontSize(7);
    let x = MARGIN;
    cols.forEach((c) => {
      r.doc.text(c.label, x + 1.5, r.y + 4.4);
      x += c.w;
    });
    r.y += headerH;
  };

  if (!requests.length) {
    r.mutedLine('Queue is empty. This page still documents the live store snapshot.');
    return;
  }

  drawHead();
  const sorted = [...requests].sort((a, b) => {
    const pr = (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0);
    if (pr !== 0) return pr;
    return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
  });

  sorted.forEach((req, i) => {
    if (r.remaining() < rowH + 1) {
      r.newPage();
      drawHead();
    }
    if (i % 2 === 0) {
      fill(r.doc, PAPER);
      r.doc.rect(MARGIN, r.y, r.maxW, rowH, 'F');
    }
    fill(r.doc, priorityColor(req.priority));
    r.doc.rect(MARGIN, r.y, 1.2, rowH, 'F');
    ink(r.doc, INK);
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(6.8);
    const wardLoc = clip(`${req.ward} · ${req.location}`, 34);
    const cells = [
      clip(req.trackingCode, 16),
      clip(String(req.sourceStatus || req.status), 14),
      req.priority,
      clip(req.category, 24),
      wardLoc,
      clip(req.description, 22),
    ];
    let x = MARGIN;
    cells.forEach((val, ci) => {
      if (ci === 2) ink(r.doc, priorityColor(req.priority));
      else ink(r.doc, INK);
      r.doc.setFont('helvetica', ci === 2 ? 'bold' : 'normal');
      r.doc.text(val, x + 1.6, r.y + 5.2);
      x += cols[ci].w;
    });
    r.y += rowH;
  });
}

function drawFooters(r: ReportDoc) {
  const pages = r.doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    r.doc.setPage(i);
    stroke(r.doc, LINE);
    r.doc.setLineWidth(0.2);
    r.doc.line(MARGIN, r.pageH - FOOTER_H, r.pageW - MARGIN, r.pageH - FOOTER_H);
    ink(r.doc, MUTED);
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(7);
    r.doc.text(
      'Red-Box  ·  Anonymous filings  ·  Figures from live civic store',
      MARGIN,
      r.pageH - 6
    );
    r.doc.text(`Page ${i} of ${pages}`, r.pageW - MARGIN, r.pageH - 6, { align: 'right' });
  }
}

/**
 * Multi-page Civic Intelligence Report from live dashboard/store data.
 * Empty datasets still produce a valid PDF with headers and empty-state notes.
 */
export function downloadCivicIntelligencePdf(input: CivicPdfInput) {
  const r = new ReportDoc();
  const overview = input.overview || {};
  const cats = entries(overview.categories);
  const wards = entries(overview.wards);
  const catTotal = cats.reduce((s, [, n]) => s + n, 0) || input.requests.length;
  const wardTotal = wards.reduce((s, [, n]) => s + n, 0) || input.requests.length;
  const kpis = deriveKpis(input.overview, input.requests, input.clusters.length);
  const generatedAt = input.generatedAt || new Date().toISOString();

  drawHeader(r, generatedAt);
  ink(r.doc, MUTED);
  r.doc.setFont('helvetica', 'normal');
  r.doc.setFontSize(7.5);
  r.doc.text(
    `Snapshot freshness  ${fmtDate(generatedAt)}   ·   Anonymous citizen filings only   ·   Live civic store`,
    MARGIN,
    r.y
  );
  r.y += 6;

  r.sectionTitle('Operations snapshot', 36);
  drawKpiGrid(r, kpis);

  r.sectionTitle('Grounded briefing', 28);
  drawBriefing(
    r,
    input.narrative || 'Counts above are from the civic store. The model only narrates those totals.',
    input.briefingModel
  );

  r.sectionTitle('Top civic pressures', 24);
  if (cats.length) {
    const top = cats.slice(0, 5);
    ink(r.doc, SLATE);
    r.doc.setFont('helvetica', 'normal');
    r.doc.setFontSize(8);
    const pressure = top
      .map(([name, count]) => `${name} ${pct(count, catTotal)}% (${count})`)
      .join('   ·   ');
    r.wrapped(pressure, MARGIN, r.maxW, 8, 3.8, SLATE);
  } else {
    r.mutedLine('No category shares yet — derived percentages need live totals.');
  }

  r.sectionTitle('Issue distribution', 22);
  drawDistribution(r, cats, catTotal);

  r.newPage();
  r.sectionTitle('Category load', 28);
  drawHBars(r, cats, catTotal, { maxRows: 10 });

  r.sectionTitle('Ward ranking', 28);
  drawHBars(r, wards, wardTotal, { highlightFirst: true, maxRows: 10 });

  r.sectionTitle('Department workload', 40);
  drawDeptTable(r, input.departments);
  if (input.departments.length) {
    r.sectionTitle('Department mix (stacked)', 28);
    drawDeptStacks(r, input.departments);
  }

  r.newPage();
  r.sectionTitle('Issue cluster board', 32);
  drawClusters(r, input.clusters.slice(0, 10));

  r.sectionTitle('Top priority issues', 24);
  drawPriorityIssues(r, topPriorityIssues(input.requests, 5));

  r.newPage();
  r.sectionTitle('Priority queue', 28);
  r.mutedLine('One row per filing in the current government queue. Descriptions truncated for print.');
  drawQueueTable(r, input.requests);

  drawFooters(r);
  r.doc.save(`civic_intelligence_${generatedAt.slice(0, 10)}.pdf`);
}
