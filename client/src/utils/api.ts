import { User, Post, Notification, HashtagTrend, Badge, CivicComplaint, GovDepartmentRank, GovCategoryStatus } from '../types/index.js';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('pixel_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export class ApiError extends Error {
  status: number;
  action?: string;
  rewrite_message?: string;
  reason?: string;

  constructor(message: string, status: number, extra?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.action = extra?.action as string | undefined;
    this.rewrite_message = extra?.rewrite_message as string | undefined;
    this.reason = extra?.reason as string | undefined;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.rewrite_message || data.error || 'Server request failed', res.status, data);
  }
  return data as T;
}

export const api = {
  auth: {
    signup: async (body: { username: string; display_name: string; password: string; bio?: string; avatar_id?: string; banner_color?: string }) => {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<{ message: string; user: User; token: string }>(res);
    },
    login: async (body: { username: string; password: string }) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<{ message: string; user: User; token: string }>(res);
    },
    me: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
      return handleResponse<{ user: User }>(res);
    },
  },

  posts: {
    getFeed: async (params?: {
      tab?: 'foryou' | 'following';
      userId?: string;
      tag?: string;
      search?: string;
      filter?: 'chirps' | 'replies' | 'likes' | 'media';
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.tab) query.set('tab', params.tab);
      if (params?.userId) query.set('userId', params.userId);
      if (params?.tag) query.set('tag', params.tag);
      if (params?.search) query.set('search', params.search);
      if (params?.filter) query.set('filter', params.filter);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());

      const res = await fetch(`${API_BASE}/posts?${query.toString()}`, {
        headers: getHeaders(),
      });
      return handleResponse<{ posts: Post[]; total: number; hasMore: boolean }>(res);
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse<{ post: Post }>(res);
    },
    create: async (body: {
      content: string;
      image_url?: string | null;
      parent_post_id?: string | null;
      repost_of_id?: string | null;
      quote_post_id?: string | null;
    }) => {
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<{ message: string; post: Post }>(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse<{ message: string }>(res);
    },
    toggleLike: async (id: string) => {
      const res = await fetch(`${API_BASE}/posts/${id}/like`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse<{ liked: boolean; likesCount: number }>(res);
    },
    toggleRepost: async (id: string) => {
      const res = await fetch(`${API_BASE}/posts/${id}/repost`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse<{ reposted: boolean; repostsCount: number; newPostId?: string }>(res);
    },
  },

  users: {
    getProfile: async (username: string) => {
      const res = await fetch(`${API_BASE}/users/profile/${username}`, {
        headers: getHeaders(),
      });
      return handleResponse<{ user: User; badges: Badge[] }>(res);
    },
    updateProfile: async (body: { display_name?: string; bio?: string; avatar_id?: string; banner_color?: string }) => {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<{ message: string; user: User }>(res);
    },
    toggleFollow: async (id: string) => {
      const res = await fetch(`${API_BASE}/users/${id}/follow`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse<{ isFollowing: boolean }>(res);
    },
    getSuggestions: async () => {
      const res = await fetch(`${API_BASE}/users/suggestions`, {
        headers: getHeaders(),
      });
      return handleResponse<{ suggestions: User[] }>(res);
    },
    search: async (q: string) => {
      const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(q)}`, {
        headers: getHeaders(),
      });
      return handleResponse<{ users: User[] }>(res);
    },
  },

  notifications: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: getHeaders(),
      });
      return handleResponse<{ notifications: Notification[] }>(res);
    },
    markRead: async () => {
      const res = await fetch(`${API_BASE}/notifications/read`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse<{ success: boolean }>(res);
    },
  },

  trends: {
    getTrends: async () => {
      const res = await fetch(`${API_BASE}/trends`, {
        headers: getHeaders(),
      });
      return handleResponse<{ trends: HashtagTrend[] }>(res);
    },
  },

  complaints: {
    list: async (params?: { page?: number; limit?: number; mine?: boolean; search?: string; category?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.mine) query.set('mine', '1');
      if (params?.search) query.set('search', params.search);
      if (params?.category) query.set('category', params.category);
      const res = await fetch(`${API_BASE}/complaints?${query}`, { headers: getHeaders() });
      return handleResponse<{ complaints: CivicComplaint[]; total: number; hasMore: boolean }>(res);
    },
    get: async (id: string) => {
      const res = await fetch(`${API_BASE}/complaints/${id}`, { headers: getHeaders() });
      return handleResponse<{ complaint: CivicComplaint }>(res);
    },
    moderate: async (body: { body: string; location_text: string }) => {
      const res = await fetch(`${API_BASE}/complaints/moderate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<{
        action: 'allow' | 'revise' | 'reject';
        reason: string;
        rewrite_message: string;
        used_llm: boolean;
        model: string;
      }>(res);
    },
    create: async (body: { body: string; location_text: string; category?: string | null; image_url?: string | null }) => {
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<{ message: string; complaint: CivicComplaint }>(res);
    },
    support: async (id: string) => {
      const res = await fetch(`${API_BASE}/complaints/${id}/support`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse<{ supported: boolean; support_count: number }>(res);
    },
  },

  gov: {
    overview: async () => {
      const res = await fetch(`${API_BASE}/gov/overview`, { headers: getHeaders() });
      return handleResponse<Record<string, any>>(res);
    },
    trends: async () => {
      const res = await fetch(`${API_BASE}/gov/trends`, { headers: getHeaders() });
      return handleResponse<Record<string, any>>(res);
    },
    clusters: async () => {
      const res = await fetch(`${API_BASE}/gov/clusters`, { headers: getHeaders() });
      return handleResponse<{ clusters: any[] }>(res);
    },
    departments: async () => {
      const res = await fetch(`${API_BASE}/gov/departments`, { headers: getHeaders() });
      return handleResponse<{ departments: GovDepartmentRank[]; category_status: GovCategoryStatus[] }>(res);
    },
    complaints: async () => {
      const res = await fetch(`${API_BASE}/gov/complaints?limit=80`, { headers: getHeaders() });
      return handleResponse<{ complaints: CivicComplaint[]; total: number }>(res);
    },
    patchComplaint: async (id: string, body: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/gov/complaints/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<{ complaint: CivicComplaint }>(res);
    },
    reports: async () => {
      const res = await fetch(`${API_BASE}/gov/reports`, { headers: getHeaders() });
      return handleResponse<Record<string, any>>(res);
    },
    briefing: async () => {
      const res = await fetch(`${API_BASE}/gov/briefing`, { headers: getHeaders() });
      return handleResponse<Record<string, any>>(res);
    },
    ask: async (question: string) => {
      const res = await fetch(`${API_BASE}/gov/ask`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question }),
      });
      return handleResponse<{
        answer: string;
        used_llm: boolean;
        model: string;
        tools_used?: string[];
        stats?: Record<string, unknown>;
      }>(res);
    },
  },
};
