import {
  User,
  SafeUser,
  Post,
  PostWithDetails,
  Notification,
  NotificationWithDetails,
  HashtagTrend,
  Badge,
} from '../types/index.js';
import {
  initialPosts,
  initialFollows,
  initialLikes,
  initialNotifications,
} from './seed.js';
import { pgQuery, iso } from './pg.js';

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_id: string;
  banner_color: string;
  password_hash: string;
  role: string;
  created_at: Date | string;
  followers_count: number;
  following_count: number;
}

interface PostRow {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  parent_post_id: string | null;
  repost_of_id: string | null;
  quote_post_id: string | null;
  created_at: Date | string;
  likes_count: number;
  replies_count: number;
  reposts_count: number;
}

interface NotificationRow {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: string;
  post_id: string | null;
  is_read: boolean;
  created_at: Date | string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    avatar_id: row.avatar_id,
    banner_color: row.banner_color,
    password_hash: row.password_hash,
    role: (row.role as User['role']) || 'citizen',
    created_at: iso(row.created_at),
    followers_count: row.followers_count,
    following_count: row.following_count,
  };
}

function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    image_url: row.image_url,
    parent_post_id: row.parent_post_id,
    repost_of_id: row.repost_of_id,
    quote_post_id: row.quote_post_id,
    created_at: iso(row.created_at),
    likes_count: row.likes_count,
    replies_count: row.replies_count,
    reposts_count: row.reposts_count,
  };
}

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    recipient_id: row.recipient_id,
    actor_id: row.actor_id,
    type: row.type as Notification['type'],
    post_id: row.post_id,
    is_read: row.is_read,
    created_at: iso(row.created_at),
  };
}

const GHOST_AUTHOR: User = {
  id: '',
  username: 'pixel_ghost',
  display_name: 'Lost Traveler',
  bio: '',
  avatar_id: 'retro_ghost',
  banner_color: '#333344',
  password_hash: '',
  created_at: new Date().toISOString(),
  followers_count: 0,
  following_count: 0,
  role: 'citizen',
};

const DEFAULT_ACTOR: User = {
  id: '',
  username: 'pixel_user',
  display_name: 'Player',
  bio: '',
  avatar_id: 'knight',
  banner_color: '#222',
  password_hash: '',
  created_at: '',
  followers_count: 0,
  following_count: 0,
  role: 'citizen',
};

export async function toSafeUser(user: User, currentUserId?: string | null): Promise<SafeUser> {
  let isFollowing = false;
  if (currentUserId) {
    const res = await pgQuery(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1',
      [currentUserId, user.id]
    );
    isFollowing = (res.rowCount ?? 0) > 0;
  }

  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    bio: user.bio,
    avatar_id: user.avatar_id,
    banner_color: user.banner_color,
    created_at: user.created_at,
    followers_count: user.followers_count,
    following_count: user.following_count,
    role: user.role || 'citizen',
    is_following: isFollowing,
  };
}

export async function findUserById(id: string): Promise<User | undefined> {
  const res = await pgQuery<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0] ? rowToUser(res.rows[0]) : undefined;
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const res = await pgQuery<UserRow>(
    'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );
  return res.rows[0] ? rowToUser(res.rows[0]) : undefined;
}

export async function createUser(user: User): Promise<User> {
  await pgQuery(
    `INSERT INTO users (
      id, username, display_name, bio, avatar_id, banner_color,
      password_hash, role, created_at, followers_count, following_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      user.id,
      user.username,
      user.display_name,
      user.bio,
      user.avatar_id,
      user.banner_color,
      user.password_hash,
      user.role || 'citizen',
      user.created_at,
      user.followers_count,
      user.following_count,
    ]
  );
  return user;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
  const existing = await findUserById(id);
  if (!existing) return undefined;

  const merged = { ...existing, ...updates };
  await pgQuery(
    `UPDATE users SET
      username = $2,
      display_name = $3,
      bio = $4,
      avatar_id = $5,
      banner_color = $6,
      password_hash = $7,
      role = $8,
      followers_count = $9,
      following_count = $10
    WHERE id = $1`,
    [
      id,
      merged.username,
      merged.display_name,
      merged.bio,
      merged.avatar_id,
      merged.banner_color,
      merged.password_hash,
      merged.role || 'citizen',
      merged.followers_count,
      merged.following_count,
    ]
  );
  return merged;
}

export async function searchUsers(query: string, currentUserId?: string): Promise<SafeUser[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const res = await pgQuery<UserRow>(
    `SELECT * FROM users
     WHERE LOWER(username) LIKE $1 OR LOWER(display_name) LIKE $1
     LIMIT 10`,
    [`%${q}%`]
  );

  return Promise.all(res.rows.map((row) => toSafeUser(rowToUser(row), currentUserId)));
}

export async function getSuggestedUsers(currentUserId?: string, limit = 5): Promise<SafeUser[]> {
  let myFollowingIds: string[] = [];
  if (currentUserId) {
    const followRes = await pgQuery<{ following_id: string }>(
      'SELECT following_id FROM follows WHERE follower_id = $1',
      [currentUserId]
    );
    myFollowingIds = followRes.rows.map((r) => r.following_id);
  }
  const myFollowingSet = new Set(myFollowingIds);

  const usersRes = await pgQuery<UserRow>('SELECT * FROM users');
  const candidates = usersRes.rows
    .map(rowToUser)
    .filter((u) => u.id !== currentUserId && !myFollowingSet.has(u.id));

  const scored = await Promise.all(
    candidates.map(async (candidate) => {
      let mutualUsernames: string[] = [];

      if (currentUserId && myFollowingIds.length > 0) {
        const mutualRes = await pgQuery<{ follower_id: string }>(
          `SELECT follower_id FROM follows
           WHERE following_id = $1 AND follower_id = ANY($2::text[])`,
          [candidate.id, myFollowingIds]
        );

        const usernames = await Promise.all(
          mutualRes.rows.map(async (r) => {
            const u = await findUserById(r.follower_id);
            return u?.username;
          })
        );
        mutualUsernames = usernames.filter((un): un is string => Boolean(un));
      }

      const postCountRes = await pgQuery<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM posts WHERE user_id = $1',
        [candidate.id]
      );
      const postCount = parseInt(postCountRes.rows[0]?.count || '0', 10);
      const mutualCount = mutualUsernames.length;
      const score = mutualCount * 50 + candidate.followers_count * 2 + postCount;

      let reason = '';
      if (mutualCount > 1) {
        reason = `Followed by @${mutualUsernames[0]} +${mutualCount - 1} more`;
      } else if (mutualCount === 1) {
        reason = `Followed by @${mutualUsernames[0]}`;
      } else if (candidate.followers_count >= 50) {
        reason = `🔥 Popular (${candidate.followers_count} followers)`;
      } else if (postCount >= 2) {
        reason = `⚔️ Active Pixel Creator`;
      } else {
        reason = `✨ Recommended for you`;
      }

      const safe = await toSafeUser(candidate, currentUserId);
      safe.recommendation_reason = reason;

      return { user: safe, score };
    })
  );

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.user);
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const user = await findUserById(userId);
  if (!user) return [];

  const statsRes = await pgQuery<{
    chirps_count: string;
    replies_count: string;
    media_posts_count: string;
    total_likes_received: string;
    first_chirp_at: Date | string | null;
  }>(
    `SELECT
      COUNT(*) FILTER (WHERE parent_post_id IS NULL AND repost_of_id IS NULL)::text AS chirps_count,
      COUNT(*) FILTER (WHERE parent_post_id IS NOT NULL)::text AS replies_count,
      COUNT(*) FILTER (WHERE image_url IS NOT NULL)::text AS media_posts_count,
      COALESCE(SUM(likes_count), 0)::text AS total_likes_received,
      MIN(created_at) FILTER (WHERE parent_post_id IS NULL AND repost_of_id IS NULL) AS first_chirp_at
    FROM posts
    WHERE user_id = $1`,
    [userId]
  );

  const stats = statsRes.rows[0];
  const chirpsCount = parseInt(stats?.chirps_count || '0', 10);
  const repliesCount = parseInt(stats?.replies_count || '0', 10);
  const mediaPostsCount = parseInt(stats?.media_posts_count || '0', 10);
  const totalLikesReceived = parseInt(stats?.total_likes_received || '0', 10);
  const followersCount = user.followers_count || 0;
  const firstChirpAt = stats?.first_chirp_at ? iso(stats.first_chirp_at) : null;

  const badges: Badge[] = [
    {
      id: 'first_chirp',
      name: 'First Transmission',
      description: 'Transmitted your very first chirp into the pixelverse.',
      icon: 'rocket',
      tier: 'bronze',
      category: 'milestone',
      earned: chirpsCount >= 1,
      progress: {
        current: Math.min(1, chirpsCount),
        target: 1,
        label: `${chirpsCount >= 1 ? '1/1' : '0/1'} chirp`,
      },
      earned_at: chirpsCount >= 1 ? firstChirpAt : null,
    },
    {
      id: 'chirp_master_10',
      name: 'Pixel Scribe',
      description: 'Broadcasted 10+ chirps into the realm.',
      icon: 'scroll',
      tier: 'silver',
      category: 'engagement',
      earned: chirpsCount >= 10,
      progress: {
        current: Math.min(10, chirpsCount),
        target: 10,
        label: `${chirpsCount}/10 chirps`,
      },
    },
    {
      id: 'chirp_legend_50',
      name: 'Realm Herald',
      description: 'A veteran voice of the pixelverse with 50+ chirps.',
      icon: 'horn',
      tier: 'gold',
      category: 'engagement',
      earned: chirpsCount >= 50,
      progress: {
        current: Math.min(50, chirpsCount),
        target: 50,
        label: `${chirpsCount}/50 chirps`,
      },
    },
    {
      id: 'follower_10',
      name: 'Party Leader',
      description: 'Gathered a party of 10+ loyal adventurers.',
      icon: 'shield',
      tier: 'silver',
      category: 'social',
      earned: followersCount >= 10,
      progress: {
        current: Math.min(10, followersCount),
        target: 10,
        label: `${followersCount}/10 followers`,
      },
    },
    {
      id: 'follower_100',
      name: 'Pixel Sovereign',
      description: 'Commanding an army of 100+ followers.',
      icon: 'crown',
      tier: 'diamond',
      category: 'social',
      earned: followersCount >= 100,
      progress: {
        current: Math.min(100, followersCount),
        target: 100,
        label: `${followersCount}/100 followers`,
      },
    },
    {
      id: 'likes_received_10',
      name: 'Spark of Glory',
      description: 'Received 10+ likes from fellow adventurers.',
      icon: 'star',
      tier: 'bronze',
      category: 'milestone',
      earned: totalLikesReceived >= 10,
      progress: {
        current: Math.min(10, totalLikesReceived),
        target: 10,
        label: `${totalLikesReceived}/10 likes`,
      },
    },
    {
      id: 'likes_received_100',
      name: 'Realm Champion',
      description: 'Earned 100+ total likes across your transmissions.',
      icon: 'trophy',
      tier: 'gold',
      category: 'milestone',
      earned: totalLikesReceived >= 100,
      progress: {
        current: Math.min(100, totalLikesReceived),
        target: 100,
        label: `${totalLikesReceived}/100 likes`,
      },
    },
    {
      id: 'pixel_artisan',
      name: 'Pixel Artisan',
      description: 'Transmitted custom 8-bit artwork or dithered graphics.',
      icon: 'palette',
      tier: 'silver',
      category: 'creation',
      earned: mediaPostsCount >= 1,
      progress: {
        current: Math.min(1, mediaPostsCount),
        target: 1,
        label: `${mediaPostsCount >= 1 ? '1/1' : '0/1'} art attached`,
      },
    },
    {
      id: 'thread_weaver',
      name: 'Story Weaver',
      description: 'Engaged in 5+ active discussion threads.',
      icon: 'crystal',
      tier: 'bronze',
      category: 'social',
      earned: repliesCount >= 5,
      progress: {
        current: Math.min(5, repliesCount),
        target: 5,
        label: `${repliesCount}/5 replies`,
      },
    },
    {
      id: 'early_pioneer',
      name: 'Genesis Player',
      description: 'Joined CivicPulse in the first wave.',
      icon: 'diamond',
      tier: 'gold',
      category: 'milestone',
      earned: true,
      progress: {
        current: 1,
        target: 1,
        label: 'Genesis',
      },
      earned_at: user.created_at,
    },
  ];

  return badges;
}

export async function enrichPost(post: Post, currentUserId?: string | null): Promise<PostWithDetails> {
  const authorRaw =
    (await findUserById(post.user_id)) ||
    ({ ...GHOST_AUTHOR, id: post.user_id } as User);

  const author = await toSafeUser(authorRaw, currentUserId);

  let liked_by_me = false;
  let reposted_by_me = false;

  if (currentUserId) {
    const likeRes = await pgQuery(
      'SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2 LIMIT 1',
      [post.id, currentUserId]
    );
    liked_by_me = (likeRes.rowCount ?? 0) > 0;

    const repostRes = await pgQuery(
      'SELECT 1 FROM posts WHERE repost_of_id = $1 AND user_id = $2 LIMIT 1',
      [post.id, currentUserId]
    );
    reposted_by_me = (repostRes.rowCount ?? 0) > 0;
  }

  let quote_post: PostWithDetails | null = null;
  if (post.quote_post_id) {
    const qpRes = await pgQuery<PostRow>('SELECT * FROM posts WHERE id = $1', [post.quote_post_id]);
    if (qpRes.rows[0]) {
      quote_post = await enrichPost(rowToPost(qpRes.rows[0]), currentUserId);
    }
  }

  let repost_of: PostWithDetails | null = null;
  if (post.repost_of_id) {
    const rpRes = await pgQuery<PostRow>('SELECT * FROM posts WHERE id = $1', [post.repost_of_id]);
    if (rpRes.rows[0]) {
      repost_of = await enrichPost(rowToPost(rpRes.rows[0]), currentUserId);
    }
  }

  return {
    ...post,
    author,
    liked_by_me,
    reposted_by_me,
    quote_post,
    repost_of,
  };
}

async function fetchPostsByParentId(parentId: string): Promise<Post[]> {
  const res = await pgQuery<PostRow>(
    'SELECT * FROM posts WHERE parent_post_id = $1 ORDER BY created_at ASC',
    [parentId]
  );
  return res.rows.map(rowToPost);
}

export async function getPosts(options: {
  tab?: 'foryou' | 'following';
  userId?: string;
  tag?: string;
  search?: string;
  filter?: 'chirps' | 'replies' | 'likes' | 'media';
  currentUserId?: string | null;
  page?: number;
  limit?: number;
}): Promise<{ posts: PostWithDetails[]; total: number; hasMore: boolean }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (options.userId) {
    if (options.filter === 'replies') {
      conditions.push(`user_id = $${paramIdx++}`);
      params.push(options.userId);
      conditions.push('parent_post_id IS NOT NULL');
    } else if (options.filter === 'likes') {
      conditions.push(`id IN (SELECT post_id FROM post_likes WHERE user_id = $${paramIdx++})`);
      params.push(options.userId);
    } else if (options.filter === 'media') {
      conditions.push(`user_id = $${paramIdx++}`);
      params.push(options.userId);
      conditions.push('image_url IS NOT NULL');
    } else {
      conditions.push(`user_id = $${paramIdx++}`);
      params.push(options.userId);
      conditions.push('parent_post_id IS NULL');
    }
  } else if (options.tag) {
    const tagLower = `#${options.tag.replace(/^#/, '').toLowerCase()}`;
    conditions.push(`LOWER(content) LIKE $${paramIdx++}`);
    params.push(`%${tagLower}%`);
  } else if (options.search) {
    conditions.push(`LOWER(content) LIKE $${paramIdx++}`);
    params.push(`%${options.search.toLowerCase()}%`);
  } else if (options.tab === 'following' && options.currentUserId) {
    conditions.push(
      `user_id IN (
        SELECT following_id FROM follows WHERE follower_id = $${paramIdx}
        UNION SELECT $${paramIdx}::text
      )`
    );
    params.push(options.currentUserId);
    paramIdx++;
    conditions.push('parent_post_id IS NULL');
  } else {
    conditions.push('parent_post_id IS NULL');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pgQuery<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM posts ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0]?.count || '0', 10);

  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  const postsRes = await pgQuery<PostRow>(
    `SELECT * FROM posts ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  const posts = await Promise.all(
    postsRes.rows.map((row) => enrichPost(rowToPost(row), options.currentUserId))
  );

  return {
    posts,
    total,
    hasMore: offset + limit < total,
  };
}

export async function findPostById(
  id: string,
  currentUserId?: string | null
): Promise<PostWithDetails | undefined> {
  const res = await pgQuery<PostRow>('SELECT * FROM posts WHERE id = $1', [id]);
  if (!res.rows[0]) return undefined;

  const post = rowToPost(res.rows[0]);
  const enriched = await enrichPost(post, currentUserId);

  if (post.parent_post_id) {
    const parentRes = await pgQuery<PostRow>('SELECT * FROM posts WHERE id = $1', [post.parent_post_id]);
    if (parentRes.rows[0]) {
      enriched.parent_post = await enrichPost(rowToPost(parentRes.rows[0]), currentUserId);
    }
  }

  const directReplies = await fetchPostsByParentId(post.id);
  enriched.replies = await Promise.all(
    directReplies.map(async (reply) => {
      const enrichedReply = await enrichPost(reply, currentUserId);
      const subReplies = await fetchPostsByParentId(reply.id);
      enrichedReply.replies = await Promise.all(
        subReplies.map((sub) => enrichPost(sub, currentUserId))
      );
      return enrichedReply;
    })
  );

  return enriched;
}

export async function createPost(post: Post): Promise<Post> {
  await pgQuery(
    `INSERT INTO posts (
      id, user_id, content, image_url, parent_post_id,
      repost_of_id, quote_post_id, created_at,
      likes_count, replies_count, reposts_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      post.id,
      post.user_id,
      post.content,
      post.image_url ?? null,
      post.parent_post_id ?? null,
      post.repost_of_id ?? null,
      post.quote_post_id ?? null,
      post.created_at,
      post.likes_count,
      post.replies_count,
      post.reposts_count,
    ]
  );

  if (post.parent_post_id) {
    const parentRes = await pgQuery<PostRow>('SELECT * FROM posts WHERE id = $1', [post.parent_post_id]);
    const parent = parentRes.rows[0];
    if (parent) {
      await pgQuery(
        'UPDATE posts SET replies_count = replies_count + 1 WHERE id = $1',
        [post.parent_post_id]
      );
      if (parent.user_id !== post.user_id) {
        await createNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          recipient_id: parent.user_id,
          actor_id: post.user_id,
          type: 'reply',
          post_id: post.id,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  if (post.quote_post_id) {
    const quotedRes = await pgQuery<PostRow>('SELECT * FROM posts WHERE id = $1', [post.quote_post_id]);
    const quoted = quotedRes.rows[0];
    if (quoted) {
      await pgQuery(
        'UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = $1',
        [post.quote_post_id]
      );
      if (quoted.user_id !== post.user_id) {
        await createNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          recipient_id: quoted.user_id,
          actor_id: post.user_id,
          type: 'quote',
          post_id: post.id,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  const mentions = post.content.match(/@(\w+)/g);
  if (mentions) {
    for (const m of mentions) {
      const username = m.slice(1);
      const mentionedUser = await findUserByUsername(username);
      if (mentionedUser && mentionedUser.id !== post.user_id) {
        await createNotification({
          id: `notif_men_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          recipient_id: mentionedUser.id,
          actor_id: post.user_id,
          type: 'mention',
          post_id: post.id,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  return post;
}

export async function deletePost(postId: string, userId: string): Promise<boolean> {
  const res = await pgQuery<PostRow>(
    'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *',
    [postId, userId]
  );
  if (!res.rows[0]) return false;

  const post = res.rows[0];
  if (post.parent_post_id) {
    await pgQuery(
      'UPDATE posts SET replies_count = GREATEST(0, replies_count - 1) WHERE id = $1',
      [post.parent_post_id]
    );
  }

  await pgQuery('DELETE FROM notifications WHERE post_id = $1', [postId]);
  return true;
}

export async function toggleLike(
  userId: string,
  postId: string
): Promise<{ liked: boolean; likesCount: number }> {
  const postRes = await pgQuery<PostRow>('SELECT * FROM posts WHERE id = $1', [postId]);
  const post = postRes.rows[0];
  if (!post) throw new Error('Post not found');

  const existing = await pgQuery(
    'SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );

  if ((existing.rowCount ?? 0) > 0) {
    await pgQuery('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    const newCount = Math.max(0, post.likes_count - 1);
    await pgQuery('UPDATE posts SET likes_count = $2 WHERE id = $1', [postId, newCount]);
    return { liked: false, likesCount: newCount };
  }

  await pgQuery(
    'INSERT INTO post_likes (user_id, post_id, created_at) VALUES ($1, $2, $3)',
    [userId, postId, new Date().toISOString()]
  );
  const newCount = post.likes_count + 1;
  await pgQuery('UPDATE posts SET likes_count = $2 WHERE id = $1', [postId, newCount]);

  if (post.user_id !== userId) {
    await createNotification({
      id: `notif_like_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      recipient_id: post.user_id,
      actor_id: userId,
      type: 'like',
      post_id: postId,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  return { liked: true, likesCount: newCount };
}

export async function toggleRepost(
  userId: string,
  postId: string
): Promise<{ reposted: boolean; repostsCount: number; newPostId?: string }> {
  const originalRes = await pgQuery<PostRow>('SELECT * FROM posts WHERE id = $1', [postId]);
  const originalPost = originalRes.rows[0];
  if (!originalPost) throw new Error('Post not found');

  const existingRepostRes = await pgQuery<PostRow>(
    'SELECT * FROM posts WHERE user_id = $1 AND repost_of_id = $2',
    [userId, postId]
  );

  if (existingRepostRes.rows[0]) {
    await pgQuery('DELETE FROM posts WHERE id = $1', [existingRepostRes.rows[0].id]);
    const newCount = Math.max(0, originalPost.reposts_count - 1);
    await pgQuery('UPDATE posts SET reposts_count = $2 WHERE id = $1', [postId, newCount]);
    return { reposted: false, repostsCount: newCount };
  }

  const newRepostId = `post_rp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const createdAt = new Date().toISOString();

  await pgQuery(
    `INSERT INTO posts (
      id, user_id, content, repost_of_id, created_at,
      likes_count, replies_count, reposts_count
    ) VALUES ($1, $2, $3, $4, $5, 0, 0, 0)`,
    [newRepostId, userId, '', postId, createdAt]
  );

  const newCount = originalPost.reposts_count + 1;
  await pgQuery('UPDATE posts SET reposts_count = $2 WHERE id = $1', [postId, newCount]);

  if (originalPost.user_id !== userId) {
    await createNotification({
      id: `notif_rp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      recipient_id: originalPost.user_id,
      actor_id: userId,
      type: 'repost',
      post_id: postId,
      is_read: false,
      created_at: createdAt,
    });
  }

  return { reposted: true, repostsCount: newCount, newPostId: newRepostId };
}

export async function toggleFollow(
  followerId: string,
  followingId: string
): Promise<{ isFollowing: boolean }> {
  if (followerId === followingId) throw new Error('Cannot follow yourself');

  const follower = await findUserById(followerId);
  const following = await findUserById(followingId);
  if (!follower || !following) throw new Error('User not found');

  const existing = await pgQuery(
    'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );

  if ((existing.rowCount ?? 0) > 0) {
    await pgQuery(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    await pgQuery(
      'UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = $1',
      [followerId]
    );
    await pgQuery(
      'UPDATE users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = $1',
      [followingId]
    );
    return { isFollowing: false };
  }

  await pgQuery(
    'INSERT INTO follows (follower_id, following_id, created_at) VALUES ($1, $2, $3)',
    [followerId, followingId, new Date().toISOString()]
  );
  await pgQuery('UPDATE users SET following_count = following_count + 1 WHERE id = $1', [followerId]);
  await pgQuery('UPDATE users SET followers_count = followers_count + 1 WHERE id = $1', [followingId]);

  await createNotification({
    id: `notif_fol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    recipient_id: followingId,
    actor_id: followerId,
    type: 'follow',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return { isFollowing: true };
}

export async function createNotification(notif: Notification): Promise<Notification> {
  await pgQuery(
    `INSERT INTO notifications (
      id, recipient_id, actor_id, type, post_id, is_read, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      notif.id,
      notif.recipient_id,
      notif.actor_id,
      notif.type,
      notif.post_id ?? null,
      notif.is_read,
      notif.created_at,
    ]
  );
  return notif;
}

export async function getNotifications(userId: string): Promise<NotificationWithDetails[]> {
  const res = await pgQuery<NotificationRow>(
    'SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  return Promise.all(
    res.rows.map(async (row) => {
      const n = rowToNotification(row);
      const actorRaw =
        (await findUserById(n.actor_id)) ||
        ({ ...DEFAULT_ACTOR, id: n.actor_id } as User);
      const actor = await toSafeUser(actorRaw, userId);

      let post: PostWithDetails | null = null;
      if (n.post_id) {
        const pRes = await pgQuery<PostRow>('SELECT * FROM posts WHERE id = $1', [n.post_id]);
        if (pRes.rows[0]) {
          post = await enrichPost(rowToPost(pRes.rows[0]), userId);
        }
      }

      return {
        ...n,
        actor,
        post,
      };
    })
  );
}

export async function markNotificationsAsRead(userId: string): Promise<void> {
  await pgQuery(
    'UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE',
    [userId]
  );
}

export async function getTrends(): Promise<HashtagTrend[]> {
  const res = await pgQuery<{ content: string }>('SELECT content FROM posts');
  const tagCounts: Record<string, number> = {};

  for (const row of res.rows) {
    const tags = row.content.match(/#(\w+)/g);
    if (tags) {
      for (const tag of tags) {
        const t = tag.toLowerCase();
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
  }

  const defaultTrends: Record<string, { count: number; category: string }> = {
    '#pixelart': { count: 128, category: 'Art & Design' },
    '#gamedev': { count: 94, category: 'Gaming' },
    '#8bit': { count: 76, category: 'Retro Tech' },
    '#indiedev': { count: 62, category: 'Development' },
    '#retrogaming': { count: 53, category: 'Gaming' },
    '#chiptune': { count: 41, category: 'Music' },
    '#sprites': { count: 35, category: 'Art' },
  };

  const trendsList: HashtagTrend[] = Object.keys(tagCounts).map((tag) => ({
    tag,
    count: (tagCounts[tag] || 1) + (defaultTrends[tag]?.count || 5),
    category: defaultTrends[tag]?.category || 'Trending in Pixelverse',
  }));

  for (const tag of Object.keys(defaultTrends)) {
    if (!trendsList.some((t) => t.tag === tag)) {
      trendsList.push({
        tag,
        count: defaultTrends[tag].count,
        category: defaultTrends[tag].category,
      });
    }
  }

  trendsList.sort((a, b) => b.count - a.count);
  return trendsList.slice(0, 7);
}

export async function seedSocialIfEmpty(): Promise<void> {
  const countRes = await pgQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM posts');
  if (parseInt(countRes.rows[0]?.count || '0', 10) > 0) return;

  for (const post of initialPosts) {
    await pgQuery(
      `INSERT INTO posts (
        id, user_id, content, image_url, parent_post_id,
        repost_of_id, quote_post_id, created_at,
        likes_count, replies_count, reposts_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO NOTHING`,
      [
        post.id,
        post.user_id,
        post.content,
        post.image_url ?? null,
        post.parent_post_id ?? null,
        post.repost_of_id ?? null,
        post.quote_post_id ?? null,
        post.created_at,
        post.likes_count,
        post.replies_count,
        post.reposts_count,
      ]
    );
  }

  for (const follow of initialFollows) {
    await pgQuery(
      `INSERT INTO follows (follower_id, following_id, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [follow.follower_id, follow.following_id, follow.created_at]
    );
  }

  for (const like of initialLikes) {
    await pgQuery(
      `INSERT INTO post_likes (user_id, post_id, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, post_id) DO NOTHING`,
      [like.user_id, like.post_id, like.created_at]
    );
  }

  for (const notif of initialNotifications) {
    await pgQuery(
      `INSERT INTO notifications (
        id, recipient_id, actor_id, type, post_id, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING`,
      [
        notif.id,
        notif.recipient_id,
        notif.actor_id,
        notif.type,
        notif.post_id ?? null,
        notif.is_read,
        notif.created_at,
      ]
    );
  }
}
