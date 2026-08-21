import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../utils/api.js';
import { User, Post, Badge } from '../types/index.js';
import { PixelAvatar } from '../components/PixelAvatar.js';
import { PixelButton } from '../components/PixelButton.js';
import { PixelIcon } from '../components/PixelIcon.js';
import { ChirpCard } from '../components/ChirpCard.js';
import { EditProfileModal } from '../components/EditProfileModal.js';
import { BadgeShowcase } from '../components/BadgeShowcase.js';
import { sound } from '../utils/sound.js';

interface ProfilePageProps {
  username: string;
  onNavigateProfile: (username: string) => void;
  onNavigateTag: (tag: string) => void;
  onNavigateThread: (postId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  username,
  onNavigateProfile,
  onNavigateTag,
  onNavigateThread,
}) => {
  const { user: currentUser, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'chirps' | 'replies' | 'media' | 'likes'>('chirps');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPostsLoading, setIsPostsLoading] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const isOwnProfile = currentUser && currentUser.username.toLowerCase() === username.toLowerCase();

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.users.getProfile(username);
      setProfileUser(res.user);
      setBadges(res.badges || []);
      setIsFollowing(!!res.user.is_following);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setProfileUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  const fetchPosts = useCallback(async () => {
    if (!profileUser) return;
    setIsPostsLoading(true);
    try {
      const res = await api.posts.getFeed({
        userId: profileUser.id,
        filter: activeTab,
        limit: 30,
      });
      setPosts(res.posts);
    } catch (err) {
      console.error('Error fetching profile posts:', err);
    } finally {
      setIsPostsLoading(false);
    }
  }, [profileUser, activeTab]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profileUser) {
      fetchPosts();
    }
  }, [profileUser, activeTab, fetchPosts]);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      openAuthModal('signup');
      return;
    }
    if (!profileUser) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setProfileUser((prev) =>
      prev
        ? {
            ...prev,
            followers_count: nextState ? prev.followers_count + 1 : Math.max(0, prev.followers_count - 1),
          }
        : null
    );
    sound.playClick();

    try {
      const res = await api.users.toggleFollow(profileUser.id);
      setIsFollowing(res.isFollowing);
      showToast(
        res.isFollowing ? `Following @${profileUser.username}` : `Unfollowed @${profileUser.username}`,
        'success'
      );
    } catch (err) {
      setIsFollowing(!nextState);
      showToast('Could not update follow state.', 'error');
    }
  };

  const tabs: { id: 'chirps' | 'replies' | 'media' | 'likes'; label: string }[] = [
    { id: 'chirps', label: 'Reports' },
    { id: 'replies', label: 'Replies' },
    { id: 'media', label: 'Photos' },
    { id: 'likes', label: 'Supported' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 bg-retro-card border-3 border-retro-border shadow-pixel-sm">
        <PixelIcon name="sparkles" size={32} color="var(--color-primary)" className="animate-spin" />
        <div className="font-body text-sm text-retro-muted">
          Loading account…
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="p-8 bg-retro-card border-3 border-retro-border shadow-pixel-sm text-center flex flex-col items-center gap-3">
        <div className="font-body text-sm text-retro-danger">Account @{username} not found</div>
        <p className="font-body text-sm text-retro-muted">
          This username is not registered.
        </p>
      </div>
    );
  }

  const effectiveUser = isOwnProfile ? (currentUser || profileUser) : profileUser;

  return (
    <>
      <div className="flex flex-col gap-3.5">
        {/* Profile Card Header with Banner & Avatar */}
        <div className="pixel-box overflow-hidden shadow-pixel animate-feed-in">
          {/* Guild Banner */}
          <div
            className="h-28 sm:h-36 w-full border-b-3 border-retro-shadow relative transition-none"
            style={{ backgroundColor: effectiveUser.banner_color || 'var(--color-primary)' }}
          >
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 font-body text-[10px] text-white">
              {effectiveUser.role === 'government' ? 'Government' : 'Citizen'}
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-5 pt-0 relative">
            {/* Top Row: Avatar & Action Buttons */}
            <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-3">
              <div className="relative">
                <PixelAvatar
                  avatarId={effectiveUser.avatar_id}
                  size={76}
                  showBorder={true}
                  className="shadow-pixel-md"
                />
              </div>

              <div>
                {isOwnProfile ? (
                  <PixelButton
                    variant="secondary"
                    size="md"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <PixelIcon name="edit" size={14} />
                    Edit profile
                  </PixelButton>
                ) : (
                  <PixelButton
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="md"
                    onClick={handleToggleFollow}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </PixelButton>
                )}
              </div>
            </div>

            {/* User details */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="font-pixel-body font-bold text-base sm:text-lg text-retro-text">
                  {effectiveUser.display_name}
                </h1>
                <PixelIcon name="badge-verified" size={16} />
              </div>
              <div className="font-terminal text-sm sm:text-[15px] text-retro-muted">
                @{effectiveUser.username}
              </div>

              {effectiveUser.bio && (
                <p className="mt-2 font-pixel-body text-sm sm:text-[15px] text-retro-text leading-relaxed">
                  {effectiveUser.bio}
                </p>
              )}

              {/* Stats Bar */}
              <div className="flex items-center gap-5 mt-3 pt-3 border-t-2 border-retro-border font-terminal text-sm">
                <div>
                  <span className="font-bold text-retro-text text-base">
                    {effectiveUser.following_count || 0}
                  </span>{' '}
                  <span className="text-retro-muted">Following</span>
                </div>
                <div>
                  <span className="font-bold text-retro-text text-base">
                    {effectiveUser.followers_count || 0}
                  </span>{' '}
                  <span className="text-retro-muted">Followers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Achievement Badges Showcase */}
          <div className="px-4 sm:px-6 pb-4">
            <BadgeShowcase badges={badges} username={effectiveUser.username} />
          </div>

          {/* Profile Navigation Tabs */}
          <div className="grid grid-cols-4 bg-retro-subtle border-t-3 border-retro-border">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playTab();
                    setActiveTab(tab.id);
                  }}
                  className={`py-2.5 font-body text-[11px] sm:text-xs font-semibold cursor-pointer ${
                    isActive
                      ? 'bg-retro-card text-retro-primary border-b-3 border-retro-primary font-bold'
                      : 'text-retro-muted hover:text-retro-text hover:bg-retro-card/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Posts Stream */}
        <div className="flex flex-col gap-3">
          {isPostsLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="pixel-box p-4 flex gap-3.5" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="pixel-skeleton w-[42px] h-[42px] rounded-none shrink-0" />
                  <div className="flex-1 flex flex-col gap-2 pt-1">
                    <div className="pixel-skeleton-text w-[40%] h-[10px]" />
                    <div className="pixel-skeleton-text w-[85%] h-[10px]" />
                    <div className="pixel-skeleton-text w-[60%] h-[10px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center bg-retro-card border-3 border-retro-border shadow-pixel-sm">
              <div className="font-body text-sm text-retro-muted mb-1">
                No reports found
              </div>
              <p className="font-pixel-body text-sm text-retro-muted">
                {activeTab === 'chirps'
                  ? `No public reports from @${effectiveUser.username} yet.`
                  : activeTab === 'media'
                  ? `No photos from @${effectiveUser.username} yet.`
                  : `No activity in this tab for @${effectiveUser.username}.`}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <ChirpCard
                key={post.id}
                post={post}
                onNavigateProfile={onNavigateProfile}
                onNavigateTag={onNavigateTag}
                onNavigateThread={onNavigateThread}
                onPostDeleted={(id) => {
                  setPosts((prev) => prev.filter((p) => p.id !== id));
                }}
                onPostUpdated={(updated) => {
                  setPosts((prev) =>
                    prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
                  );
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          fetchProfile();
        }}
      />
    </>
  );
};
