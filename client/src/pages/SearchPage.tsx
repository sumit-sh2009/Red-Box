import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';
import { Post, User } from '../types/index.js';
import { ChirpCard } from '../components/ChirpCard.js';
import { PixelAvatar } from '../components/PixelAvatar.js';
import { PixelButton } from '../components/PixelButton.js';
import { PixelIcon } from '../components/PixelIcon.js';
import { useAuth } from '../context/AuthContext.js';
import { complaintToPost } from '../utils/civicMap.js';
import { sound } from '../utils/sound.js';

interface SearchPageProps {
  initialQuery?: string;
  onNavigateProfile: (username: string) => void;
  onNavigateTag: (tag: string) => void;
  onNavigateThread: (postId: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  initialQuery = '',
  onNavigateProfile,
  onNavigateTag,
  onNavigateThread,
}) => {
  const { user, openAuthModal } = useAuth();

  const [query, setQuery] = useState<string>(initialQuery);
  const [activeTab, setActiveTab] = useState<'chirps' | 'players'>('chirps');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const executeSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPosts([]);
      setUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'chirps') {
        const res = await api.complaints.list({ search: q, limit: 30 });
        setPosts(res.complaints.map(complaintToPost));
      } else {
        const res = await api.users.search(q);
        setUsers(res.users);
        const fMap: Record<string, boolean> = {};
        res.users.forEach((u) => {
          fMap[u.id] = !!u.is_following;
        });
        setFollowingMap(fMap);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      executeSearch(initialQuery);
    }
  }, [initialQuery, executeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    executeSearch(query);
  };

  const handleToggleFollow = async (targetUser: User) => {
    if (!user) {
      openAuthModal('signup');
      return;
    }
    const current = !!followingMap[targetUser.id];
    setFollowingMap((prev) => ({ ...prev, [targetUser.id]: !current }));
    sound.playClick();

    try {
      const res = await api.users.toggleFollow(targetUser.id);
      setFollowingMap((prev) => ({ ...prev, [targetUser.id]: res.isFollowing }));
    } catch (err) {
      setFollowingMap((prev) => ({ ...prev, [targetUser.id]: current }));
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Search Bar & Filter */}
      <div className="pixel-box p-3.5 sm:p-4 flex flex-col gap-3 shadow-pixel-sm">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports, location, or category…"
            className="pixel-input w-full pl-9 pr-24 py-2.5 font-pixel-body text-sm"
            autoFocus
          />
          <div className="absolute left-3 top-3 text-retro-muted pointer-events-none">
            <PixelIcon name="search" size={16} />
          </div>
          <div className="absolute right-2 top-2">
            <PixelButton type="submit" variant="primary" size="sm">
              Search
            </PixelButton>
          </div>
        </form>

        <div className="grid grid-cols-2 gap-1 bg-retro-subtle p-1 rounded-sm">
          <button
            onClick={() => {
              sound.playTab();
              setActiveTab('chirps');
              if (query) executeSearch(query);
            }}
            className={`font-body text-xs font-semibold py-2 rounded-sm select-none cursor-pointer ${
              activeTab === 'chirps'
                ? 'bg-retro-navy text-white'
                : 'text-retro-muted hover:text-retro-text hover:bg-retro-card/40'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => {
              sound.playTab();
              setActiveTab('players');
              if (query) executeSearch(query);
            }}
            className={`font-body text-xs font-semibold py-2 rounded-sm select-none cursor-pointer ${
              activeTab === 'players'
                ? 'bg-retro-navy text-white'
                : 'text-retro-muted hover:text-retro-text hover:bg-retro-card/40'
            }`}
          >
            People
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3 bg-retro-card border border-retro-border rounded-md">
          <div className="font-body text-sm text-retro-muted">
            Searching the live report store…
          </div>
        </div>
      ) : activeTab === 'chirps' ? (
        posts.length === 0 ? (
          <div className="p-8 bg-retro-card border border-retro-border text-center font-body text-sm text-retro-muted">
            {query ? `No reports matched “${query}”.` : 'Type a query to search city reports.'}
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
        )
      ) : users.length === 0 ? (
          <div className="p-8 bg-retro-card border border-retro-border text-center font-body text-sm text-retro-muted">
          {query ? `No people found for “${query}”.` : 'Search by username or display name.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {users.map((u) => (
            <div
              key={u.id}
              className="pixel-box p-3 sm:p-4 flex items-center justify-between gap-3 shadow-pixel-sm hover:border-retro-primary transition-colors duration-75"
            >
              <div
                onClick={() => {
                  sound.playClick();
                  onNavigateProfile(u.username);
                }}
                className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <PixelAvatar avatarId={u.avatar_id} size={42} />
                <div className="min-w-0">
                  <div className="font-pixel-body font-bold text-sm sm:text-base text-retro-text truncate">
                    {u.display_name}
                  </div>
                  <div className="text-xs text-retro-muted font-terminal truncate">
                    @{u.username}
                  </div>
                  {u.bio && (
                    <div className="text-xs text-retro-muted truncate mt-0.5 font-pixel-body">
                      {u.bio}
                    </div>
                  )}
                </div>
              </div>

              <PixelButton
                variant={followingMap[u.id] ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => handleToggleFollow(u)}
              >
                {followingMap[u.id] ? 'Following' : 'Follow'}
              </PixelButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
