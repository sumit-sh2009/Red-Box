export type UserRole = 'citizen' | 'government';

export type ComplaintStatus =
  | 'pending_ai'
  | 'open'
  | 'flagged'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'needs_review';

export type CivicCategory =
  | 'Roads & Infrastructure'
  | 'Water Supply & Drainage'
  | 'Sanitation & Waste'
  | 'Street Lighting & Power'
  | 'Public Safety & Hazards'
  | 'Parks & Public Amenities'
  | 'Education & Community'
  | 'Transport'
  | 'Noise'
  | 'Construction'
  | 'Other Civic Issues';

export interface Complaint {
  id: string;
  author_id: string;
  body: string;
  image_url?: string | null;
  location_text: string;
  ward: string | null;
  category: CivicCategory | string | null;
  status: ComplaintStatus;
  support_count: number;
  cluster_id: string | null;
  tracking_code: string;
  created_at: string;
  updated_at: string;
}

export interface ComplaintEvent {
  id: string;
  complaint_id: string;
  status: string;
  actor: string;
  note: string;
  created_at: string;
}

export interface ComplaintSupport {
  user_id: string;
  complaint_id: string;
  created_at: string;
}

export interface Cluster {
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
  created_at: string;
  updated_at: string;
}

export interface AiAnalysis {
  id: string;
  complaint_id: string;
  workflow_id: string;
  model: string;
  used_llm: boolean;
  category: string | null;
  subcategory: string | null;
  severity: string | null;
  urgency: string | null;
  department: string | null;
  department_confidence: number;
  overall_confidence: number;
  needs_review: boolean;
  flagged: boolean;
  similar_ids: string[];
  summary: string;
  recommended_action: string;
  steps: string[];
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  keywords: string;
  responsibilities: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  detail: string;
  created_at: string;
}

export const ANONYMOUS_AUTHOR = {
  id: 'anonymous',
  username: 'anonymous',
  display_name: 'Anonymous citizen',
  bio: '',
  avatar_id: 'ghost',
  banner_color: '#333344',
  created_at: '',
  followers_count: 0,
  following_count: 0,
};

export function publicComplaintDto(
  complaint: Complaint,
  extras?: {
    supported_by_me?: boolean;
    ai?: AiAnalysis | null;
    cluster?: Cluster | null;
    events?: ComplaintEvent[];
    is_owner?: boolean;
  }
) {
  return {
    id: complaint.id,
    tracking_code: complaint.tracking_code,
    body: complaint.body,
    image_url: complaint.image_url || null,
    location_text: complaint.location_text,
    ward: complaint.ward,
    category: complaint.category,
    status: complaint.status,
    support_count: complaint.support_count,
    cluster_id: complaint.cluster_id,
    created_at: complaint.created_at,
    updated_at: complaint.updated_at,
    author: ANONYMOUS_AUTHOR,
    supported_by_me: extras?.supported_by_me || false,
    ai: extras?.ai
      ? {
          category: extras.ai.category,
          subcategory: extras.ai.subcategory,
          severity: extras.ai.severity,
          urgency: extras.ai.urgency,
          department: extras.ai.department,
          department_confidence: extras.ai.department_confidence,
          overall_confidence: extras.ai.overall_confidence,
          needs_review: extras.ai.needs_review,
          flagged: extras.ai.flagged,
          similar_ids: extras.ai.similar_ids,
          summary: extras.ai.summary,
          recommended_action: extras.ai.recommended_action,
          steps: extras.ai.steps,
          used_llm: extras.ai.used_llm,
          model: extras.ai.model,
        }
      : null,
    cluster: extras?.cluster
      ? {
          id: extras.cluster.id,
          title: extras.cluster.title,
          summary: extras.cluster.summary,
          size: extras.cluster.size,
          support_total: extras.cluster.support_total,
          department: extras.cluster.department,
          urgency: extras.cluster.urgency,
        }
      : null,
    events: extras?.events || [],
    is_owner: extras?.is_owner || false,
  };
}
