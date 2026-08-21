import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';
import { Post } from '../types/index.js';
import { ChirpCard } from '../components/ChirpCard.js';
import { PixelIcon } from '../components/PixelIcon.js';
import { complaintToPost } from '../utils/civicMap.js';
import { sound } from '../utils/sound.js';

interface HashtagPageProps {
  tag: string;
  onBack: () => void;
  onNavigateProfile: (username: string) => void;
  onNavigateTag: (tag: string) => void;
  onNavigateThread: (postId: string) => void;
}

export const HashtagPage: React.FC<HashtagPageProps> = ({
  tag,
  onBack,
  onNavigateProfile,
  onNavigateTag,
  onNavigateThread,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTagPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const cleanTag = tag.replace(/^#/, '');
      const res = await api.complaints.list({ search: cleanTag, limit: 30 });
      setPosts(res.complaints.map((c) => ({
        ...complaintToPost(c),
      })));
    } catch (err) {
      console.error('Error fetching hashtag chirps:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    fetchTagPosts();
  }, [fetchTagPosts]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Hashtag Header */}
      <div className="pixel-box p-4 flex items-center justify-between shadow-pixel-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="p-1.5 bg-retro-subtle border-2 border-retro-border hover:border-retro-primary text-retro-text active:translate-x-0.5 cursor-pointer shadow-pixel-xs"
          >
            <PixelIcon name="arrow-left" size={16} />
          </button>
          <div>
            <h1 className="font-body text-lg font-semibold text-retro-navy">
              #{tag.replace(/^#/, '')}
            </h1>
            <div className="font-body text-xs text-retro-muted mt-0.5">
              {posts.length} matching reports
            </div>
          </div>
        </div>

        <div className="p-2 bg-retro-subtle border-2 border-retro-shadow shadow-pixel-xs">
          <PixelIcon name="sparkles" size={20} color="var(--color-primary)" />
        </div>
      </div>

      {/* Feed List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3 bg-retro-card border-3 border-retro-border shadow-pixel-sm">
          <PixelIcon name="sparkles" size={28} color="var(--color-primary)" className="animate-spin" />
          <div className="font-body text-sm text-retro-muted">
            Loading…
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-8 bg-retro-card border border-retro-border text-center font-body text-sm text-retro-muted">
          No reports matched #{tag} yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <ChirpCard
              key={post.id}
              post={post}
              onNavigateProfile={onNavigateProfile}
              onNavigateTag={onNavigateTag}
              onNavigateThread={onNavigateThread}
              onPostDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
};
