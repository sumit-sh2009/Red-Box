import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api.js';
import { Post } from '../types/index.js';
import { complaintToPost } from '../utils/civicMap.js';
import { ChirpComposer } from '../components/ChirpComposer.js';
import { ChirpCard } from '../components/ChirpCard.js';
import { PixelButton } from '../components/PixelButton.js';
import { PixelIcon } from '../components/PixelIcon.js';
import { sound } from '../utils/sound.js';

interface HomeFeedPageProps {
  onNavigateProfile: (username: string) => void;
  onNavigateTag: (tag: string) => void;
  onNavigateThread: (postId: string) => void;
}

export const HomeFeedPage: React.FC<HomeFeedPageProps> = ({
  onNavigateProfile,
  onNavigateTag,
  onNavigateThread,
}) => {
  const [feedTab, setFeedTab] = useState<'city' | 'mine'>('city');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [feedError, setFeedError] = useState<string>('');
  const [flashId, setFlashId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchFeed = useCallback(async (targetPage: number = 1, append: boolean = false) => {
    if (targetPage === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      setFeedError('');
      const res = await api.complaints.list({
        mine: feedTab === 'mine',
        page: targetPage,
        limit: 15,
      });
      const mapped = res.complaints.map(complaintToPost);

      if (append) {
        setPosts((prev) => [...prev, ...mapped]);
      } else {
        setPosts(mapped);
      }
      setHasMore(res.hasMore);
      setPage(targetPage);
    } catch (err: any) {
      setFeedError(err.message || 'Could not load reports.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [feedTab]);

  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  const handlePostCreated = useCallback((newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    setFlashId(newPost.id);
    window.setTimeout(() => setFlashId(null), 1300);
  }, []);

  const handlePostDeleted = useCallback((deletedId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  }, []);

  const handlePostUpdated = useCallback((updated: Partial<Post> & { id: string }) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    sound.playClick();
    fetchFeed(page + 1, true);
  }, [isLoadingMore, hasMore, page, fetchFeed]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { rootMargin: '400px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, isLoading, isLoadingMore, handleLoadMore]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="civic-label mb-1">City feed</p>
          <h2 className="font-display text-xl font-semibold text-retro-text">What the city is reporting</h2>
        </div>
      </div>
      <div className="flex items-center bg-retro-subtle/80 p-1 rounded-sm">
        <div className="grid grid-cols-2 flex-1 gap-1">
          <button
            onClick={() => {
              if (feedTab !== 'city') {
                sound.playTab();
                setFeedTab('city');
              }
            }}
            className={`font-body text-[13px] font-semibold py-2 select-none cursor-pointer rounded-[3px] ${
              feedTab === 'city'
                ? 'bg-retro-navy text-white'
                : 'bg-transparent text-retro-muted hover:text-retro-text hover:bg-retro-subtle'
            }`}
          >
            City reports
          </button>
          <button
            onClick={() => {
              if (feedTab !== 'mine') {
                sound.playTab();
                setFeedTab('mine');
              }
            }}
            className={`font-body text-[13px] font-semibold py-2 select-none cursor-pointer rounded-[3px] ${
              feedTab === 'mine'
                ? 'bg-retro-navy text-white'
                : 'bg-transparent text-retro-muted hover:text-retro-text hover:bg-retro-subtle'
            }`}
          >
            My filings
          </button>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            fetchFeed(1, false);
          }}
          title="Reload reports"
          aria-label="Reload reports"
          className="ml-2 px-3 py-2 text-retro-muted hover:text-retro-text rounded-sm cursor-pointer"
        >
          <PixelIcon name="sparkles" size={16} />
        </button>
      </div>

      {/* Main Composer */}
      <ChirpComposer onPostCreated={handlePostCreated} />

      {feedError && (
        <div className="pixel-box p-4 font-body text-sm text-retro-danger" role="alert">
          {feedError}
        </div>
      )}

      {/* Feed Stream */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pixel-box p-4 flex gap-3.5">
              <div className="w-[42px] h-[42px] pixel-skeleton shrink-0" />
              <div className="flex-1 flex flex-col gap-2.5 pt-1">
                <div className="pixel-skeleton-text w-[70%]" />
                <div className="pixel-skeleton-text w-[90%]" />
                <div className="pixel-skeleton-text w-[40%]" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="p-10 bg-retro-card border border-retro-border rounded-md text-center flex flex-col items-center gap-3">
          <PixelIcon name="home" size={28} color="var(--color-muted)" />
          <div className="font-display font-semibold text-lg text-retro-text">
            {feedTab === 'mine' ? 'You have not filed yet' : 'No public reports yet'}
          </div>
          <p className="font-body text-sm text-retro-muted max-w-sm">
            {feedTab === 'mine'
              ? 'Use the form above. The city feed will show Anonymous citizen — not your username.'
              : 'Be the first to file. Public identity is not shown on reports.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className={`opacity-0 ${flashId === post.id ? 'animate-card-flash animate-feed-in' : 'animate-feed-in'}`}
              style={{ animationDelay: flashId === post.id ? '0s' : `${index * 0.06}s` }}
            >
              <ChirpCard
                post={post}
                onNavigateProfile={onNavigateProfile}
                onNavigateTag={onNavigateTag}
                onNavigateThread={onNavigateThread}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={handlePostUpdated}
              />
            </div>
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-2 flex justify-center">
              <PixelButton
                variant="secondary"
                size="md"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full sm:w-auto"
              >
                {isLoadingMore ? 'Loading…' : 'Load more reports'}
              </PixelButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
