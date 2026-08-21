export type UserRole = 'citizen' | 'government';

export interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_id: string;
  banner_color: string;
  password_hash: string;
  role?: UserRole;
  created_at: string;
  followers_count: number;
  following_count: number;
}

export type SafeUser = Omit<User, 'password_hash'> & {
  is_following?: boolean;
  recommendation_reason?: string;
};

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
}

export interface PostWithDetails extends Post {
  author: SafeUser;
  liked_by_me?: boolean;
  reposted_by_me?: boolean;
  repost_of?: PostWithDetails | null;
  quote_post?: PostWithDetails | null;
  parent_post?: PostWithDetails | null;
  replies?: PostWithDetails[];
}

export interface Like {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
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
}

export interface NotificationWithDetails extends Notification {
  actor: SafeUser;
  post?: PostWithDetails | null;
}

export interface HashtagTrend {
  tag: string;
  count: number;
  category?: string;
}
