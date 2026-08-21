import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/** Same hashed n-gram vectors as ai/embeddings.py */
export const EMBED_DIM = 384;
export const CLUSTER_THRESHOLD = 0.4;

interface Taxonomy {
  categories: Array<{ id: string; name: string; keywords: string[] }>;
  departments: Array<{ id: string; name: string; keywords: string[]; responsibilities: string }>;
}

function taxonomyPath() {
  const candidates = [
    path.resolve(process.cwd(), '../config/civic-taxonomy.json'),
    path.resolve(process.cwd(), 'config/civic-taxonomy.json'),
    path.resolve(process.cwd(), '../../config/civic-taxonomy.json'),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function loadTaxonomy(): Taxonomy {
  const p = taxonomyPath();
  if (!p) {
    return { categories: [], departments: [] };
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as Taxonomy;
}

const TAXONOMY = loadTaxonomy();

export const CATEGORY_NAMES = TAXONOMY.categories.map((c) => c.name);
export const DEPARTMENTS = TAXONOMY.departments;

export function tokenizeWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2);
}

export function embed(text: string): number[] {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  const compact = words.join('');
  const toks = [...words];
  for (let i = 0; i + 3 <= compact.length; i++) toks.push(compact.slice(i, i + 3));
  const vec = new Array(EMBED_DIM).fill(0);
  for (const tok of toks) {
    const h = crypto.createHash('md5').update(tok).digest();
    const idx = h.readUInt16LE(0) % EMBED_DIM;
    const sign = h[2] % 2 === 0 ? 1 : -1;
    vec[idx] += sign;
  }
  const n = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / n);
}

export function cosine(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function similarity(a: string, b: string): number {
  let score = cosine(embed(a), embed(b));
  const la = new Set(tokenizeWords(a));
  const lb = new Set(tokenizeWords(b));
  if (la.has('central') && la.has('school') && lb.has('central') && lb.has('school')) {
    score = Math.min(1, score + 0.18);
  }
  return score;
}

export function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  A.forEach((x) => {
    if (B.has(x)) inter += 1;
  });
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function tokenize(text: string): string[] {
  return tokenizeWords(text);
}

export function classifyHeuristic(body: string, location: string) {
  const blob = `${body} ${location}`.toLowerCase();
  let best = { category: 'Other Civic Issues', score: 0 };
  for (const rule of TAXONOMY.categories) {
    const hits = rule.keywords.filter((w) => w && blob.includes(w.toLowerCase())).length;
    if (hits > best.score) best = { category: rule.name, score: hits };
  }
  const confidence = best.score === 0 ? 0.35 : Math.min(0.92, 0.5 + best.score * 0.15);

  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (/accident|spark|collapse|fire|electroc|child|school|drown/.test(blob)) {
    severity = 'high';
    urgency = 'high';
  }

  const query = embed(`${body} ${location} ${best.category}`);
  let department = 'Municipal Administration';
  let deptConf = 0.42;
  for (const d of TAXONOMY.departments) {
    const text = `${d.name} ${d.keywords.join(' ')} ${d.responsibilities}`;
    const s = cosine(query, embed(text));
    const conf = Math.min(0.95, Math.max(0.42, 0.5 + s));
    if (conf > deptConf) {
      department = d.name;
      deptConf = conf;
    }
  }

  return {
    category: best.category,
    subcategory: null as string | null,
    severity,
    urgency,
    department,
    department_confidence: Number(deptConf.toFixed(2)),
    overall_confidence: Number(confidence.toFixed(2)),
    summary: `${best.category} reported at ${location || 'unspecified location'}.`,
    recommended_action: `Route to ${department} for site inspection.`,
    used_llm: false,
    model: 'heuristic',
  };
}

const INJECTION = ['ignore previous', 'system prompt', 'you are now', '<script', 'drop table', 'ignore all', 'bypass'];
const THREATS = ['kill', 'bomb', 'blow up', 'shoot', 'plant a bomb', 'explosive', 'murder', 'burn down', 'attack the'];
const SPAM = ['buy now', 'crypto pump', 'free viagra', 'cheap crypto', '1000x gainz', 'click link'];
const VULGAR = ['fuck you', 'fucking bitch', 'motherfucker', 'suck my', 'go die', 'kill yourself', 'rape', 'slut', 'bitch', 'bastard'];
const CIVIC_HINTS = [
  'pothole',
  'road',
  'drain',
  'water',
  'garbage',
  'light',
  'school',
  'street',
  'sewage',
  'flood',
  'waste',
  'footpath',
  'transformer',
  'leak',
  'bin',
  'signal',
];

export interface ModerationResult {
  action: 'allow' | 'revise' | 'reject';
  reason: string;
  rewrite_message: string;
  used_llm: boolean;
  model: string;
}

export function moderateHeuristic(body: string, location = ''): ModerationResult {
  const text = body.trim();
  const low = text.toLowerCase();
  const blob = `${low} ${location.toLowerCase()}`;

  if (INJECTION.some((p) => low.includes(p))) {
    return {
      action: 'reject',
      reason: 'prompt_injection',
      rewrite_message:
        'This text looks like an injection or script, not a civic report. Describe the real street issue in your own words.',
      used_llm: false,
      model: 'heuristic',
    };
  }

  if (THREATS.some((p) => low.includes(p))) {
    return {
      action: 'reject',
      reason: 'violent_threat',
      rewrite_message:
        'Threats of violence cannot be filed. If there is a public hazard, describe the location and the defect without targeting people.',
      used_llm: false,
      model: 'heuristic',
    };
  }

  if (SPAM.some((p) => low.includes(p)) || /(.)\1{12,}/.test(text)) {
    return {
      action: 'reject',
      reason: 'spam',
      rewrite_message: 'This looks like spam. Please file a specific civic problem at a real place.',
      used_llm: false,
      model: 'heuristic',
    };
  }

  const vulgar = VULGAR.filter((p) => low.includes(p));
  const civic = CIVIC_HINTS.some((w) => blob.includes(w));

  if (vulgar.length > 0 && !civic) {
    return {
      action: 'reject',
      reason: 'vulgar',
      rewrite_message:
        'This post is vulgar and does not describe a civic issue. Rewrite with the place and the problem (for example a pothole, leak, or missed garbage pickup).',
      used_llm: false,
      model: 'heuristic',
    };
  }

  if (vulgar.length > 0 && civic) {
    return {
      action: 'revise',
      reason: 'abuse_with_issue',
      rewrite_message:
        'There is a civic issue here, but the wording is abusive. Keep the facts (what, where, who is affected) and drop personal attacks and sexual language, then submit again.',
      used_llm: false,
      model: 'heuristic',
    };
  }

  if (text.length < 12) {
    return {
      action: 'revise',
      reason: 'too_short',
      rewrite_message: 'Add at least a short sentence: what is wrong, and where it is.',
      used_llm: false,
      model: 'heuristic',
    };
  }

  return {
    action: 'allow',
    reason: 'civic_report',
    rewrite_message: '',
    used_llm: false,
    model: 'heuristic',
  };
}

export function safetyHeuristic(body: string) {
  const m = moderateHeuristic(body);
  return {
    flagged: m.action === 'reject',
    reason: m.reason,
    needs_review: m.action === 'revise',
  };
}

export function priorityScore(input: {
  clusterSize: number;
  support: number;
  severity: string;
  urgency: string;
  ageHours: number;
}) {
  const sev: Record<string, number> = { low: 0.25, medium: 0.5, high: 0.8, critical: 1 };
  const urg: Record<string, number> = { low: 0.25, medium: 0.5, high: 0.8, critical: 1 };
  const sizeN = Math.min(1, input.clusterSize / 8);
  const supN = Math.min(1, input.support / 40);
  const persist = Math.min(1, input.ageHours / (14 * 24));
  const government =
    0.22 * sizeN +
    0.18 * supN +
    0.28 * (sev[input.severity] || 0.5) +
    0.22 * (urg[input.urgency] || 0.5) +
    0.1 * persist;
  return {
    popularity: Number((0.6 * supN + 0.4 * sizeN).toFixed(3)),
    severity: Number((sev[input.severity] || 0.5).toFixed(3)),
    urgency: Number((urg[input.urgency] || 0.5).toFixed(3)),
    government_priority: Number(government.toFixed(3)),
  };
}

export function guessWard(location: string) {
  const l = location.toLowerCase();
  if (l.includes('central') || l.includes('school') || l.includes('market')) return 'Ward 1 - Central Zone';
  if (l.includes('civil') || l.includes('sector 4')) return 'Ward 2 - Civil Lines';
  if (l.includes('kalyan') || l.includes('east')) return 'Ward 3 - East District';
  if (l.includes('bay') || l.includes('mill')) return 'Ward 4 - South Bay';
  if (l.includes('industrial')) return 'Ward 5 - Industrial Corridor';
  return 'Ward 1 - Central Zone';
}
