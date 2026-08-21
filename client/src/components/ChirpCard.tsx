import React, { useState, memo } from 'react';
import {
  ThumbsUp,
  Bookmark,
  Link2,
  MapPin,
  Shield,
  MessageCircle,
  Repeat2,
  Heart,
  Share2,
} from 'lucide-react';
import { Post } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../utils/api.js';
import { PixelAvatar } from './PixelAvatar.js';
import { QuoteModal } from './QuoteModal.js';
import { sound } from '../utils/sound.js';

interface ChirpCardProps {
  post: Post;
  onNavigateProfile?: (username: string) => void;
  onNavigateTag?: (tag: string) => void;
  onNavigateThread?: (postId: string) => void;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: Partial<Post> & { id: string }) => void;
  isThreadView?: boolean;
  showThreadConnector?: boolean;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    open: 'Open',
    pending: 'Open',
    pending_ai: 'Processing',
    needs_review: 'Needs review',
    in_progress: 'In progress',
    resolved: 'Resolved',
    completed: 'Resolved',
    rejected: 'Closed',
    flagged: 'Held',
  };
  return map[status] || status.replace(/_/g, ' ');
}

export const ChirpCard: React.FC<ChirpCardProps> = memo(({
  post,
  onNavigateProfile,
  onNavigateTag,
  onNavigateThread,
  onPostDeleted,
  onPostUpdated,
  isThreadView = false,
  showThreadConnector = false,
}) => {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [liked, setLiked] = useState<boolean>(!!post.liked_by_me);
  const [likesCount, setLikesCount] = useState<number>(post.likes_count || 0);
  const [reposted, setReposted] = useState<boolean>(!!post.reposted_by_me);
  const [repostsCount, setRepostsCount] = useState<number>(post.reposts_count || 0);
  const [showRepostMenu, setShowRepostMenu] = useState<boolean>(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const displayPost = post.repost_of || post;
  const civic = displayPost.civic;

  const handleSupport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('signup');
      return;
    }

    const nextLiked = !liked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setLiked(nextLiked);
    setLikesCount(nextCount);
    sound.playClick();

    try {
      if (civic) {
        const res = await api.complaints.support(displayPost.id);
        setLiked(res.supported);
        setLikesCount(res.support_count);
        if (onPostUpdated) {
          onPostUpdated({ id: displayPost.id, liked_by_me: res.supported, likes_count: res.support_count });
        }
      } else {
        const res = await api.posts.toggleLike(displayPost.id);
        setLiked(res.liked);
        setLikesCount(res.likesCount);
        if (onPostUpdated) {
          onPostUpdated({ id: displayPost.id, liked_by_me: res.liked, likes_count: res.likesCount });
        }
      }
    } catch {
      setLiked(!nextLiked);
      setLikesCount(likesCount);
      showToast('Could not register support.', 'error');
    }
  };

  const handleSimpleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRepostMenu(false);
    if (!user) {
      openAuthModal('signup');
      return;
    }
    const nextReposted = !reposted;
    const nextCount = nextReposted ? repostsCount + 1 : Math.max(0, repostsCount - 1);
    setReposted(nextReposted);
    setRepostsCount(nextCount);
    try {
      const res = await api.posts.toggleRepost(displayPost.id);
      setReposted(res.reposted);
      setRepostsCount(res.repostsCount);
      showToast(res.reposted ? 'Shared to your feed.' : 'Share removed.', 'success');
      if (onPostUpdated) {
        onPostUpdated({ id: displayPost.id, reposted_by_me: res.reposted, reposts_count: res.repostsCount });
      }
    } catch {
      setReposted(!nextReposted);
      setRepostsCount(repostsCount);
      showToast('Could not share.', 'error');
    }
  };

  const handleQuoteSubmit = async (quoteContent: string) => {
    try {
      await api.posts.create({
        content: quoteContent,
        quote_post_id: displayPost.id,
      });
      showToast('Comment posted.', 'success');
      setRepostsCount((c) => c + 1);
    } catch (err: any) {
      showToast(err.message || 'Failed to post', 'error');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this report from your account?')) return;
    setIsDeleting(true);
    try {
      await api.posts.delete(post.id);
      showToast('Report removed.', 'info');
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete', 'error');
      setIsDeleting(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#thread-${displayPost.id}`;
    const text = civic?.tracking_code ? `${civic.tracking_code} — ${url}` : url;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(civic?.tracking_code ? 'Tracking code copied.' : 'Link copied.', 'success');
    }
  };

  const [saved, setSaved] = useState<boolean>(() => {
    try {
      const arr: string[] = JSON.parse(localStorage.getItem('pixel_saved') || '[]');
      return arr.includes(displayPost.id);
    } catch {
      return false;
    }
  });

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const key = 'pixel_saved';
    let arr: string[] = [];
    try {
      arr = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      arr = [];
    }
    arr = saved ? arr.filter((id) => id !== displayPost.id) : [...arr, displayPost.id];
    try {
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {
      /* ignore */
    }
    setSaved(!saved);
    showToast(saved ? 'Removed from saved' : 'Report saved', 'success');
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    const tokens = text.split(/(\s+)/);
    return tokens.map((token, i) => {
      if (token.startsWith('#') && token.length > 1) {
        const cleanTag = token.replace(/[^a-zA-Z0-9_#]/g, '');
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigateTag) onNavigateTag(cleanTag.slice(1));
            }}
            className="text-retro-navy hover:underline cursor-pointer font-semibold"
          >
            {token}
          </span>
        );
      }
      if (token.startsWith('@') && token.length > 1) {
        const cleanUser = token.replace(/[^a-zA-Z0-9_@]/g, '');
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigateProfile) onNavigateProfile(cleanUser.slice(1));
            }}
            className="text-retro-navy hover:underline cursor-pointer font-semibold"
          >
            {token}
          </span>
        );
      }
      return <span key={i}>{token}</span>;
    });
  };

  const actionBtn =
    'inline-flex items-center gap-1.5 px-2 py-1.5 font-body text-xs font-medium rounded-[3px] border border-transparent hover:border-retro-border hover:bg-retro-subtle cursor-pointer';

  return (
    <>
      <article
        onClick={() => {
          if (onNavigateThread && !isThreadView) onNavigateThread(displayPost.id);
        }}
        className={`pixel-box pixel-card-vis p-5 sm:p-6 relative ${
          !isThreadView ? 'cursor-pointer hover:border-retro-navy/60 transition-colors' : ''
        } ${isDeleting ? 'opacity-30 pointer-events-none' : ''}`}
      >
        {showThreadConnector && (
          <div className="absolute left-7 sm:left-8 -top-4 w-0.5 h-4 bg-retro-border" />
        )}

        {civic ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1 civic-label text-retro-navy px-0">
                  <Shield className="w-3 h-3" aria-hidden />
                  Anonymous citizen
                </span>
                {civic.tracking_code && (
                  <span className="font-mono text-xs text-retro-navy">{civic.tracking_code}</span>
                )}
              </div>
              <time className="font-body text-xs text-retro-muted whitespace-nowrap" dateTime={displayPost.created_at}>
                {formatTimestamp(displayPost.created_at)}
              </time>
            </div>

            <div className="flex flex-wrap gap-1.5" aria-label="Report metadata">
              {civic.category && (
                <span className="font-body text-[11px] font-medium px-1.5 py-0.5 border border-retro-border bg-retro-subtle rounded-[3px]">
                  {civic.category}
                </span>
              )}
              {civic.location_text && (
                <span className="inline-flex items-center gap-1 font-body text-[11px] px-1.5 py-0.5 border border-retro-border text-retro-muted rounded-[3px]">
                  <MapPin className="w-3 h-3 text-retro-saffron" aria-hidden />
                  {civic.location_text}
                </span>
              )}
              {civic.ward && (
                <span className="font-body text-[11px] px-1.5 py-0.5 border border-retro-border text-retro-muted rounded-[3px]">
                  {civic.ward}
                </span>
              )}
              <span className="inline-flex items-center gap-1 font-body text-[11px] font-semibold px-1.5 py-0.5 border border-retro-border rounded-sm">
                {statusLabel(civic.status)}
              </span>
              {civic.ai?.urgency && (
                <span className="inline-flex items-center gap-1 font-body text-[11px] font-semibold px-1.5 py-0.5 border border-retro-saffron/50 text-retro-saffron rounded-sm">
                  {civic.ai.urgency} urgency
                </span>
              )}
              {civic.ai?.department && (
                <span className="font-body text-[11px] px-1.5 py-0.5 border border-retro-navy text-retro-navy rounded-[3px]">
                  {civic.ai.department}
                </span>
              )}
              {civic.ai?.needs_review && (
                <span className="font-body text-[11px] px-1.5 py-0.5 border border-retro-danger text-retro-danger rounded-[3px]">
                  Needs review
                </span>
              )}
              {civic.cluster && civic.cluster.size > 1 && (
                <span className="font-body text-[11px] px-1.5 py-0.5 border border-retro-navy text-retro-navy rounded-[3px]">
                  Cluster · {civic.cluster.size} similar
                </span>
              )}
            </div>

            {civic.ai?.summary && isThreadView && (
              <p className="font-body text-sm text-retro-muted border-l-2 border-retro-navy pl-3">
                {civic.ai.summary}
              </p>
            )}

            {displayPost.content && (
              <p className={`font-body text-retro-text leading-[1.65] ${isThreadView ? 'text-lg' : 'text-[16px]'}`}>
                {renderFormattedContent(displayPost.content)}
              </p>
            )}

            {displayPost.image_url && (
              <div className="border border-retro-border bg-retro-subtle overflow-hidden max-h-96 rounded-[3px]">
                <img
                  src={displayPost.image_url}
                  alt="Evidence photo"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-contain max-h-96"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-retro-border">
              <button
                type="button"
                aria-label={liked ? 'Withdraw support' : 'Support this report'}
                aria-pressed={liked}
                onClick={handleSupport}
                className={`${actionBtn} ${liked ? 'text-retro-navy border-retro-navy' : 'text-retro-muted'}`}
              >
                <ThumbsUp className="w-4 h-4" aria-hidden />
                Support
                <span className="tabular-nums">{likesCount}</span>
              </button>
              <button type="button" aria-label="Save report" aria-pressed={saved} onClick={handleSave} className={`${actionBtn} ${saved ? 'text-retro-navy' : 'text-retro-muted'}`}>
                <Bookmark className="w-4 h-4" aria-hidden />
                {saved ? 'Saved' : 'Save'}
              </button>
              <button type="button" aria-label="Copy tracking code" onClick={handleShare} className={`${actionBtn} text-retro-muted`}>
                <Link2 className="w-4 h-4" aria-hidden />
                Copy ID
              </button>
              {user && civic.is_owner && (
                <button type="button" onClick={handleDelete} className={`${actionBtn} text-retro-danger ml-auto`}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-3.5">
            <div className="shrink-0">
              <PixelAvatar
                avatarId={displayPost.author.avatar_id}
                size={isThreadView ? 50 : 42}
                interactive
                onClick={() => onNavigateProfile?.(displayPost.author.username)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateProfile?.(displayPost.author.username);
                    }}
                    className="font-body font-semibold text-[15px] text-retro-text truncate hover:underline cursor-pointer"
                  >
                    {displayPost.author.display_name}
                  </span>
                  <span className="font-mono text-sm text-retro-muted truncate">@{displayPost.author.username}</span>
                  <span className="font-body text-xs text-retro-muted">{formatTimestamp(displayPost.created_at)}</span>
                </div>
                {user && user.id === post.user_id && (
                  <button type="button" onClick={handleDelete} className="text-retro-muted hover:text-retro-danger p-1 cursor-pointer">
                    Delete
                  </button>
                )}
              </div>
              {displayPost.content && (
                <p className="mt-2 font-body text-[15px] text-retro-text leading-relaxed">
                  {renderFormattedContent(displayPost.content)}
                </p>
              )}
              {displayPost.image_url && (
                <div className="mt-3 border border-retro-border overflow-hidden max-h-96 rounded-[3px]">
                  <img src={displayPost.image_url} alt="" loading="lazy" className="w-full object-contain max-h-96" />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1 mt-3 pt-2 border-t border-retro-border text-retro-muted">
                <button
                  type="button"
                  aria-label="Reply"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateThread?.(displayPost.id);
                  }}
                  className={actionBtn}
                >
                  <MessageCircle className="w-4 h-4" />
                  {displayPost.replies_count || 0}
                </button>
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Share"
                    aria-pressed={reposted}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRepostMenu(!showRepostMenu);
                    }}
                    className={actionBtn}
                  >
                    <Repeat2 className="w-4 h-4" />
                    {repostsCount || 0}
                  </button>
                  {showRepostMenu && (
                    <div className="absolute left-0 bottom-full mb-1 bg-retro-card border border-retro-border z-30 min-w-40 py-1 font-body text-xs rounded-[3px]">
                      <button type="button" onClick={handleSimpleRepost} className="w-full text-left p-2.5 hover:bg-retro-subtle cursor-pointer">
                        {reposted ? 'Undo share' : 'Share'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRepostMenu(false);
                          if (!user) {
                            openAuthModal('signup');
                            return;
                          }
                          setIsQuoteModalOpen(true);
                        }}
                        className="w-full text-left p-2.5 hover:bg-retro-subtle cursor-pointer"
                      >
                        Quote
                      </button>
                    </div>
                  )}
                </div>
                <button type="button" aria-label="Appreciate" aria-pressed={liked} onClick={handleSupport} className={actionBtn}>
                  <Heart className="w-4 h-4" />
                  {likesCount || 0}
                </button>
                <button type="button" aria-label="Share" onClick={handleShare} className={actionBtn}>
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </article>

      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        post={displayPost}
        onSubmit={handleQuoteSubmit}
      />
    </>
  );
});
