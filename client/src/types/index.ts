export interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_id: string;
  banner_color: string;
  created_at: string;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
  recommendation_reason?: string;
  role?: 'citizen' | 'government';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // 'rocket' | 'scroll' | 'horn' | 'shield' | 'crown' | 'star' | 'trophy' | 'palette' | 'crystal' | 'diamond'
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  category: 'engagement' | 'social' | 'creation' | 'milestone';
  earned: boolean;
  progress?: {
    current: number;
    target: number;
    label: string;
  };
  earned_at?: string | null;
}

export interface CivicAi {
  category?: string | null;
  subcategory?: string | null;
  severity?: string | null;
  urgency?: string | null;
  department?: string | null;
  department_confidence?: number;
  overall_confidence?: number;
  needs_review?: boolean;
  flagged?: boolean;
  similar_ids?: string[];
  summary?: string;
  recommended_action?: string;
  steps?: string[];
  used_llm?: boolean;
  model?: string;
}

export interface CivicCluster {
  id: string;
  title: string;
  summary: string;
  size: number;
  support_total: number;
  department?: string | null;
  urgency?: string | null;
}

export interface GovDepartmentRank {
  id: string;
  name: string;
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  resolution_rate: number;
}

export interface GovCategoryStatus {
  category: string;
  open: number;
  in_progress: number;
  resolved: number;
  rejected: number;
}

export interface CivicComplaint {
  id: string;
  tracking_code: string;
  body: string;
  image_url?: string | null;
  location_text: string;
  ward?: string | null;
  category?: string | null;
  status: string;
  support_count: number;
  cluster_id?: string | null;
  created_at: string;
  updated_at?: string;
  author: User;
  supported_by_me?: boolean;
  ai?: CivicAi | null;
  cluster?: CivicCluster | null;
  events?: Array<{ id: string; status: string; actor: string; note: string; created_at: string }>;
  is_owner?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | null;
  parent_post_id?: string | null;
  repost_of_id?: string | null;
  quote_post_id?: string | null;
  created_at: string;
  likes_count: number;
  replies_count: number;
  reposts_count: number;
  author: User;
  liked_by_me?: boolean;
  reposted_by_me?: boolean;
  repost_of?: Post | null;
  quote_post?: Post | null;
  parent_post?: Post | null;
  replies?: Post[];
  civic?: CivicComplaint | null;
}

export type NotificationType = 'like' | 'reply' | 'repost' | 'quote' | 'follow' | 'mention';

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  post_id?: string | null;
  is_read: boolean;
  created_at: string;
  actor: User;
  post?: Post | null;
}

export interface HashtagTrend {
  tag: string;
  count: number;
  category?: string;
}

export type ThemeName = 'civic' | 'arcade' | 'nes' | 'cyberpunk';

export type Priority = 'high' | 'medium' | 'low';

export type Status = 'pending' | 'in_progress' | 'completed' | 'rejected';

export type Category = 
  | 'Roads & Infrastructure'
  | 'Water Supply & Drainage'
  | 'Sanitation & Waste'
  | 'Street Lighting & Power'
  | 'Public Safety & Hazards'
  | 'Parks & Public Amenities'
  | 'Other Civic Issues';

export type Ward = 
  | 'Ward 1 - Central Zone'
  | 'Ward 2 - Civil Lines'
  | 'Ward 3 - East District'
  | 'Ward 4 - South Bay'
  | 'Ward 5 - Industrial Corridor';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: Status;
  actor: string;
  note: string;
}

export interface CitizenRequest {
  id: string;
  trackingCode: string;
  citizenName: string;
  citizenPhone: string;
  citizenEmail?: string;
  location: string;
  ward: Ward;
  category: Category;
  description: string;
  imageUrl: string;
  priority: Priority;
  status: Status;
  timestamp: string;
  assignedOfficer?: string;
  rejectionReason?: string;
  resolutionNotes?: string;
  timeline: TimelineEvent[];
  /** Live civic store fields used by tabular CSV export (optional; UI still uses mapped status). */
  supportCount?: number;
  clusterId?: string | null;
  clusterTitle?: string | null;
  sourceStatus?: string;
}

export interface WardStatistic {
  ward: Ward;
  shortName: string;
  completed: number;
  pending: number;
  inProgress: number;
  rejected: number;
  total: number;
}

