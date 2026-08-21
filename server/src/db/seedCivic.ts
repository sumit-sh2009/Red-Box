import { civic, newId } from './civic.js';
import { AiAnalysis, Cluster, Complaint, ComplaintEvent } from '../types/civic.js';

const WARDS = [
  'Ward 1 - Central Zone',
  'Ward 2 - Civil Lines',
  'Ward 3 - East District',
  'Ward 4 - South Bay',
  'Ward 5 - Industrial Corridor',
];

function event(complaintId: string, status: string, note: string, at: string): ComplaintEvent {
  return {
    id: newId('evt'),
    complaint_id: complaintId,
    status,
    actor: 'Citizen',
    note,
    created_at: at,
  };
}

export function seedCivic(authorCitizenId: string) {
  if (!civic.isEmpty()) return;

  const clusterId = 'clu_central_school_road';
  const t0 = '2026-08-18T07:10:00.000Z';
  const t1 = '2026-08-19T09:40:00.000Z';
  const t2 = '2026-08-20T11:05:00.000Z';
  const t3 = '2026-08-20T14:20:00.000Z';
  const t4 = '2026-08-21T06:15:00.000Z';
  const t5 = '2026-08-15T08:00:00.000Z';

  const cluster: Cluster = {
    id: clusterId,
    title: 'Road damage — Central School area',
    summary:
      'Multiple independent reports describe broken carriageway / a large pothole outside Central School, affecting students and two-wheelers.',
    category: 'Roads & Infrastructure',
    location_text: 'Outside Central School',
    ward: WARDS[0],
    size: 3,
    support_total: 41,
    department: 'Public Works Department (Roads)',
    urgency: 'high',
    created_at: t0,
    updated_at: t2,
  };
  civic.upsertCluster(cluster);

  const rows: Array<{
    id: string;
    body: string;
    loc: string;
    ward: string;
    cat: string;
    status: Complaint['status'];
    support: number;
    cluster?: string;
    at: string;
    ai?: Partial<AiAnalysis>;
  }> = [
    {
      id: 'cmp_pothole_a',
      body: 'There is a huge pothole outside Central School. Two-wheelers are swerving into the oncoming lane.',
      loc: 'Outside Central School, Main Road',
      ward: WARDS[0],
      cat: 'Roads & Infrastructure',
      status: 'open',
      support: 18,
      cluster: clusterId,
      at: t0,
      ai: {
        urgency: 'high',
        severity: 'high',
        department: 'Public Works Department (Roads)',
        summary: 'Deep pothole on the school approach road with traffic conflict risk.',
      },
    },
    {
      id: 'cmp_pothole_b',
      body: 'The road outside Central School is broken. Students are walking into the street to avoid the crater.',
      loc: 'Central School gate',
      ward: WARDS[0],
      cat: 'Roads & Infrastructure',
      status: 'open',
      support: 14,
      cluster: clusterId,
      at: t1,
      ai: {
        urgency: 'high',
        severity: 'high',
        department: 'Public Works Department (Roads)',
        summary: 'Broken road surface at school gate forcing pedestrians into traffic.',
      },
    },
    {
      id: 'cmp_pothole_c',
      body: 'Students are struggling because of the damaged road near Central School. Same stretch for weeks.',
      loc: 'Near Central School',
      ward: WARDS[0],
      cat: 'Roads & Infrastructure',
      status: 'open',
      support: 9,
      cluster: clusterId,
      at: t2,
      ai: {
        urgency: 'medium',
        severity: 'high',
        department: 'Public Works Department (Roads)',
        summary: 'Persistent road damage near school; likely same underlying defect.',
      },
    },
    {
      id: 'cmp_water',
      body: 'Street flooding after every shower near Sector 4B community centre. Drain is clogged with silt.',
      loc: 'Sector 4B, opposite Community Centre',
      ward: WARDS[1],
      cat: 'Water Supply & Drainage',
      status: 'in_progress',
      support: 11,
      at: t3,
      ai: {
        urgency: 'high',
        severity: 'medium',
        department: 'Water Supply & Drainage',
        summary: 'Recurring waterlogging from blocked storm drain.',
      },
    },
    {
      id: 'cmp_garbage',
      body: 'Garbage has not been collected for five days on Lane 3, Kalyan Nagar. Stray dogs are tearing bags open.',
      loc: 'Kalyan Nagar, Lane 3',
      ward: WARDS[2],
      cat: 'Sanitation & Waste',
      status: 'open',
      support: 7,
      at: t4,
      ai: {
        urgency: 'medium',
        severity: 'medium',
        department: 'Sanitation & Solid Waste',
        summary: 'Missed collection creating a public health nuisance.',
      },
    },
    {
      id: 'cmp_power',
      body: 'Street lights on the industrial corridor have been dead for two weeks. Pedestrians cannot see the crossing.',
      loc: 'Industrial Corridor crossing',
      ward: WARDS[4],
      cat: 'Street Lighting & Power',
      status: 'open',
      support: 6,
      at: t5,
      ai: {
        urgency: 'medium',
        severity: 'medium',
        department: 'Electricity / Street Lighting',
        summary: 'Unlit pedestrian crossing on a heavy-vehicle corridor.',
      },
    },
    {
      id: 'cmp_review',
      body: 'Something is wrong near the old mill but I cannot tell if it is a drain or a cable. Please check.',
      loc: 'Old mill road',
      ward: WARDS[3],
      cat: 'Other Civic Issues',
      status: 'needs_review',
      support: 1,
      at: '2026-08-21T08:00:00.000Z',
      ai: {
        urgency: 'low',
        severity: 'low',
        department: 'Municipal Administration',
        summary: 'Ambiguous report; low confidence, queued for human review.',
        needs_review: true,
      },
    },
  ];

  rows.forEach((r) => {
    const complaint: Complaint = {
      id: r.id,
      author_id: authorCitizenId,
      body: r.body,
      image_url: null,
      location_text: r.loc,
      ward: r.ward,
      category: r.cat,
      status: r.status,
      support_count: r.support,
      cluster_id: r.cluster || null,
      tracking_code: `CIV-2026-${r.id.slice(-3).toUpperCase()}`,
      created_at: r.at,
      updated_at: r.at,
    };
    civic.createComplaint(complaint, event(r.id, r.status, 'Report registered.', r.at));
    civic.saveAnalysis({
      id: newId('ai'),
      complaint_id: r.id,
      workflow_id: `wf_seed_${r.id}`,
      model: 'heuristic-seed',
      used_llm: false,
      category: r.cat,
      subcategory: null,
      severity: r.ai?.severity || 'medium',
      urgency: r.ai?.urgency || 'medium',
      department: r.ai?.department || 'Municipal Administration',
      department_confidence: r.ai?.needs_review ? 0.42 : 0.86,
      overall_confidence: r.ai?.needs_review ? 0.38 : 0.84,
      needs_review: Boolean(r.ai?.needs_review),
      flagged: false,
      similar_ids: r.cluster === clusterId ? ['cmp_pothole_a', 'cmp_pothole_b', 'cmp_pothole_c'].filter((x) => x !== r.id) : [],
      summary: r.ai?.summary || '',
      recommended_action: r.ai?.needs_review
        ? 'Hold for officer review — category uncertain.'
        : 'Inspect site and assign field crew.',
      steps: ['validate', 'safety', 'classify_extract', 'retrieve_similar', 'cluster', 'route_department', 'priority', 'evaluate'],
      payload: { seeded: true },
      created_at: r.at,
    });
  });

  console.log('Seeded civic complaints, Central School cluster, and review example.');
}
