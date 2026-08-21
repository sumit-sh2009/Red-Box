import { CivicComplaint, Post } from '../types/index.js';

export function complaintToPost(c: CivicComplaint): Post {
  return {
    id: c.id,
    user_id: 'anonymous',
    content: c.body,
    image_url: c.image_url,
    created_at: c.created_at,
    likes_count: c.support_count,
    replies_count: 0,
    reposts_count: c.cluster?.size ? Math.max(0, c.cluster.size - 1) : 0,
    author: c.author,
    liked_by_me: c.supported_by_me,
    civic: c,
  };
}
