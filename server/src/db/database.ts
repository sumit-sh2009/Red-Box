import fs from 'fs';
import path from 'path';
import { User, SafeUser, Post, PostWithDetails, Like, Follow, Notification, NotificationWithDetails, HashtagTrend, Badge } from '../types/index.js';
import { initialUsers, initialPosts, initialFollows, initialLikes, initialNotifications } from './seed.js';

interface DatabaseSchema {
  users: User[];
  posts: Post[];
  likes: Like[];
  follows: Follow[];
  notifications: Notification[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    posts: [],
    likes: [],
    follows: [],
    notifications: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('📦 Database loaded successfully from disk.');
      } else {
        console.log('🌱 Seeding initial pixel database...');
        this.data = {
          users: initialUsers,
          posts: initialPosts,
          likes: initialLikes,
          follows: initialFollows,
          notifications: initialNotifications,
        };
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database, using in-memory seed:', err);
      this.data = {
        users: initialUsers,
        posts: initialPosts,
        likes: initialLikes,
        follows: initialFollows,
        notifications: initialNotifications,
      };
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  public toSafeUser(user: User, currentUserId?: string | null): SafeUser {
    const isFollowing = currentUserId
      ? this.data.follows.some((f) => f.follower_id === currentUserId && f.following_id === user.id)
      : false;

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

  // --- USER QUERIES ---
  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  public searchUsers(query: string, currentUserId?: string): SafeUser[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return this.data.users
      .filter((u) => u.username.toLowerCase().includes(q) || u.display_name.toLowerCase().includes(q))
      .slice(0, 10)
      .map((u) => this.toSafeUser(u, currentUserId));
  }

  public getSuggestedUsers(currentUserId?: string, limit = 5): SafeUser[] {
    const myFollowingIds = currentUserId
      ? this.data.follows
          .filter((f) => f.follower_id === currentUserId)
          .map((f) => f.following_id)
      : [];

    const myFollowingSet = new Set(myFollowingIds);

    // Candidates: all other users not yet followed by current user
    const candidates = this.data.users
      .filter((u) => u.id !== currentUserId && !myFollowingSet.has(u.id));

    // Calculate score & mutual connections for each candidate
    const scored = candidates.map((candidate) => {
      let mutualUsernames: string[] = [];

      if (currentUserId && myFollowingIds.length > 0) {
        const mutualFollowerIds = this.data.follows
          .filter((f) => myFollowingSet.has(f.follower_id) && f.following_id === candidate.id)
          .map((f) => f.follower_id);

        mutualUsernames = mutualFollowerIds
          .map((id) => this.findUserById(id)?.username)
          .filter((un): un is string => Boolean(un));
      }

      const mutualCount = mutualUsernames.length;
      const postCount = this.data.posts.filter((p) => p.user_id === candidate.id).length;
      const score = (mutualCount * 50) + (candidate.followers_count * 2) + postCount;

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

      const safe = this.toSafeUser(candidate, currentUserId);
      safe.recommendation_reason = reason;

      return {
        user: safe,
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.user);
  }

  public getUserBadges(userId: string): Badge[] {
    const user = this.findUserById(userId);
    if (!user) return [];

    const userPosts = this.data.posts.filter((p) => p.user_id === userId);
    const chirpsCount = userPosts.filter((p) => !p.parent_post_id && !p.repost_of_id).length;
    const repliesCount = userPosts.filter((p) => Boolean(p.parent_post_id)).length;
    const mediaPostsCount = userPosts.filter((p) => Boolean(p.image_url)).length;
    const followersCount = user.followers_count || 0;
    
    // Total likes received across all user's chirps
    const totalLikesReceived = userPosts.reduce((acc, p) => acc + (p.likes_count || 0), 0);

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
        earned_at: chirpsCount >= 1 ? userPosts[0]?.created_at : null,
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



  // --- POST QUERIES ---
  public enrichPost(post: Post, currentUserId?: string | null): PostWithDetails {
    const authorRaw = this.findUserById(post.user_id) || {
      id: post.user_id,
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

    const author = this.toSafeUser(authorRaw, currentUserId);
    const liked_by_me = currentUserId
      ? this.data.likes.some((l) => l.post_id === post.id && l.user_id === currentUserId)
      : false;
    const reposted_by_me = currentUserId
      ? this.data.posts.some((p) => p.user_id === currentUserId && p.repost_of_id === post.id)
      : false;

    let quote_post: PostWithDetails | null = null;
    if (post.quote_post_id) {
      const qp = this.data.posts.find((p) => p.id === post.quote_post_id);
      if (qp) {
        quote_post = this.enrichPost(qp, currentUserId);
      }
    }

    let repost_of: PostWithDetails | null = null;
    if (post.repost_of_id) {
      const rp = this.data.posts.find((p) => p.id === post.repost_of_id);
      if (rp) {
        repost_of = this.enrichPost(rp, currentUserId);
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

  public getPosts(options: {
    tab?: 'foryou' | 'following';
    userId?: string;
    tag?: string;
    search?: string;
    filter?: 'chirps' | 'replies' | 'likes' | 'media';
    currentUserId?: string | null;
    page?: number;
    limit?: number;
  }): { posts: PostWithDetails[]; total: number; hasMore: boolean } {
    let result = [...this.data.posts];

    if (options.userId) {
      if (options.filter === 'replies') {
        result = result.filter((p) => p.user_id === options.userId && !!p.parent_post_id);
      } else if (options.filter === 'likes') {
        const likedPostIds = this.data.likes.filter((l) => l.user_id === options.userId).map((l) => l.post_id);
        result = result.filter((p) => likedPostIds.includes(p.id));
      } else if (options.filter === 'media') {
        result = result.filter((p) => p.user_id === options.userId && !!p.image_url);
      } else {
        // Default 'chirps': top-level posts + reposts + quote posts by user
        result = result.filter((p) => p.user_id === options.userId && !p.parent_post_id);
      }
    } else if (options.tag) {
      const tagLower = `#${options.tag.replace(/^#/, '').toLowerCase()}`;
      result = result.filter((p) => p.content.toLowerCase().includes(tagLower));
    } else if (options.search) {
      const s = options.search.toLowerCase();
      result = result.filter((p) => p.content.toLowerCase().includes(s));
    } else if (options.tab === 'following' && options.currentUserId) {
      const followingIds = this.data.follows
        .filter((f) => f.follower_id === options.currentUserId)
        .map((f) => f.following_id);
      // Include own posts and followed users' posts
      const validAuthors = new Set([...followingIds, options.currentUserId]);
      result = result.filter((p) => validAuthors.has(p.user_id) && !p.parent_post_id);
    } else {
      // 'foryou' or global feed: top-level posts and reposts
      result = result.filter((p) => !p.parent_post_id);
    }

    // Sort reverse chronological
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const page = options.page || 1;
    const limit = options.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      posts: paginated.map((p) => this.enrichPost(p, options.currentUserId)),
      total: result.length,
      hasMore: startIndex + limit < result.length,
    };
  }

  public findPostById(id: string, currentUserId?: string | null): PostWithDetails | undefined {
    const post = this.data.posts.find((p) => p.id === id);
    if (!post) return undefined;

    const enriched = this.enrichPost(post, currentUserId);

    // If parent post exists, enrich parent post
    if (post.parent_post_id) {
      const parent = this.data.posts.find((p) => p.id === post.parent_post_id);
      if (parent) {
        enriched.parent_post = this.enrichPost(parent, currentUserId);
      }
    }

    // Fetch replies tree
    const directReplies = this.data.posts
      .filter((p) => p.parent_post_id === post.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    enriched.replies = directReplies.map((reply) => {
      const enrichedReply = this.enrichPost(reply, currentUserId);
      // Fetch nested replies (second-level replies)
      const subReplies = this.data.posts
        .filter((p) => p.parent_post_id === reply.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((sub) => this.enrichPost(sub, currentUserId));
      enrichedReply.replies = subReplies;
      return enrichedReply;
    });

    return enriched;
  }

  public createPost(post: Post): Post {
    this.data.posts.unshift(post);

    // If this is a reply, increment parent post replies_count
    if (post.parent_post_id) {
      const parent = this.data.posts.find((p) => p.id === post.parent_post_id);
      if (parent) {
        parent.replies_count = (parent.replies_count || 0) + 1;
        // Create reply notification if parent post author is someone else
        if (parent.user_id !== post.user_id) {
          this.createNotification({
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

    // If this is a quote post, increment quote post reposts_count
    if (post.quote_post_id) {
      const quoted = this.data.posts.find((p) => p.id === post.quote_post_id);
      if (quoted) {
        quoted.reposts_count = (quoted.reposts_count || 0) + 1;
        if (quoted.user_id !== post.user_id) {
          this.createNotification({
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

    // Check for @mentions in post content and create notifications
    const mentions = post.content.match(/@(\w+)/g);
    if (mentions) {
      mentions.forEach((m) => {
        const username = m.slice(1);
        const mentionedUser = this.findUserByUsername(username);
        if (mentionedUser && mentionedUser.id !== post.user_id) {
          this.createNotification({
            id: `notif_men_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            recipient_id: mentionedUser.id,
            actor_id: post.user_id,
            type: 'mention',
            post_id: post.id,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      });
    }

    this.save();
    return post;
  }

  public deletePost(postId: string, userId: string): boolean {
    const index = this.data.posts.findIndex((p) => p.id === postId && p.user_id === userId);
    if (index === -1) return false;

    const post = this.data.posts[index];
    if (post.parent_post_id) {
      const parent = this.data.posts.find((p) => p.id === post.parent_post_id);
      if (parent && parent.replies_count > 0) {
        parent.replies_count -= 1;
      }
    }

    this.data.posts.splice(index, 1);
    this.data.likes = this.data.likes.filter((l) => l.post_id !== postId);
    this.data.notifications = this.data.notifications.filter((n) => n.post_id !== postId);
    this.save();
    return true;
  }

  // --- LIKES ---
  public toggleLike(userId: string, postId: string): { liked: boolean; likesCount: number } {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    const existingIndex = this.data.likes.findIndex((l) => l.user_id === userId && l.post_id === postId);

    if (existingIndex > -1) {
      // Unlike
      this.data.likes.splice(existingIndex, 1);
      post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
      this.save();
      return { liked: false, likesCount: post.likes_count };
    } else {
      // Like
      this.data.likes.push({
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString(),
      });
      post.likes_count = (post.likes_count || 0) + 1;

      // Notification
      if (post.user_id !== userId) {
        this.createNotification({
          id: `notif_like_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          recipient_id: post.user_id,
          actor_id: userId,
          type: 'like',
          post_id: postId,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }

      this.save();
      return { liked: true, likesCount: post.likes_count };
    }
  }

  // --- REPOSTS ---
  public toggleRepost(userId: string, postId: string): { reposted: boolean; repostsCount: number; newPostId?: string } {
    const originalPost = this.data.posts.find((p) => p.id === postId);
    if (!originalPost) throw new Error('Post not found');

    const existingRepostIndex = this.data.posts.findIndex((p) => p.user_id === userId && p.repost_of_id === postId);

    if (existingRepostIndex > -1) {
      // Un-repost
      this.data.posts.splice(existingRepostIndex, 1);
      originalPost.reposts_count = Math.max(0, (originalPost.reposts_count || 1) - 1);
      this.save();
      return { reposted: false, repostsCount: originalPost.reposts_count };
    } else {
      // Repost
      const newRepostId = `post_rp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newRepost: Post = {
        id: newRepostId,
        user_id: userId,
        content: '',
        repost_of_id: postId,
        created_at: new Date().toISOString(),
        likes_count: 0,
        replies_count: 0,
        reposts_count: 0,
      };

      this.data.posts.unshift(newRepost);
      originalPost.reposts_count = (originalPost.reposts_count || 0) + 1;

      if (originalPost.user_id !== userId) {
        this.createNotification({
          id: `notif_rp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          recipient_id: originalPost.user_id,
          actor_id: userId,
          type: 'repost',
          post_id: postId,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }

      this.save();
      return { reposted: true, repostsCount: originalPost.reposts_count, newPostId: newRepostId };
    }
  }

  // --- FOLLOWS ---
  public toggleFollow(followerId: string, followingId: string): { isFollowing: boolean } {
    if (followerId === followingId) throw new Error('Cannot follow yourself');

    const follower = this.findUserById(followerId);
    const following = this.findUserById(followingId);
    if (!follower || !following) throw new Error('User not found');

    const existingIndex = this.data.follows.findIndex(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );

    if (existingIndex > -1) {
      // Unfollow
      this.data.follows.splice(existingIndex, 1);
      follower.following_count = Math.max(0, follower.following_count - 1);
      following.followers_count = Math.max(0, following.followers_count - 1);
      this.save();
      return { isFollowing: false };
    } else {
      // Follow
      this.data.follows.push({
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString(),
      });
      follower.following_count += 1;
      following.followers_count += 1;

      // Notification
      this.createNotification({
        id: `notif_fol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        recipient_id: followingId,
        actor_id: followerId,
        type: 'follow',
        is_read: false,
        created_at: new Date().toISOString(),
      });

      this.save();
      return { isFollowing: true };
    }
  }

  // --- NOTIFICATIONS ---
  public createNotification(notif: Notification): Notification {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public getNotifications(userId: string): NotificationWithDetails[] {
    const list = this.data.notifications.filter((n) => n.recipient_id === userId);
    return list.map((n) => {
      const actorRaw = this.findUserById(n.actor_id) || {
        id: n.actor_id,
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
      const actor = this.toSafeUser(actorRaw, userId);
      let post: PostWithDetails | null = null;
      if (n.post_id) {
        const p = this.data.posts.find((x) => x.id === n.post_id);
        if (p) {
          post = this.enrichPost(p, userId);
        }
      }
      return {
        ...n,
        actor,
        post,
      };
    });
  }

  public markNotificationsAsRead(userId: string): void {
    let updated = false;
    this.data.notifications.forEach((n) => {
      if (n.recipient_id === userId && !n.is_read) {
        n.is_read = true;
        updated = true;
      }
    });
    if (updated) {
      this.save();
    }
  }

  // --- TRENDS ---
  public getTrends(): HashtagTrend[] {
    const tagCounts: Record<string, number> = {};

    this.data.posts.forEach((post) => {
      const tags = post.content.match(/#(\w+)/g);
      if (tags) {
        tags.forEach((tag) => {
          const t = tag.toLowerCase();
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }
    });

    // Default trends if few posts
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

    // Add any default trends not present
    Object.keys(defaultTrends).forEach((tag) => {
      if (!trendsList.some((t) => t.tag === tag)) {
        trendsList.push({
          tag,
          count: defaultTrends[tag].count,
          category: defaultTrends[tag].category,
        });
      }
    });

    trendsList.sort((a, b) => b.count - a.count);
    return trendsList.slice(0, 7);
  }
}

export const db = new Database();
