import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../utils/api.js';
import { Notification, NotificationType } from '../types/index.js';
import { PixelAvatar } from '../components/PixelAvatar.js';
import { PixelButton } from '../components/PixelButton.js';
import { PixelIcon, PixelIconName } from '../components/PixelIcon.js';
import { sound } from '../utils/sound.js';

interface NotificationsPageProps {
  onNavigateProfile: (username: string) => void;
  onNavigateThread: (postId: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onNavigateProfile,
  onNavigateThread,
  onUnreadCountChange,
}) => {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'mentions' | 'likes' | 'follows'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.notifications.getAll();
      setNotifications(res.notifications);
      const unread = res.notifications.filter((n) => !n.is_read).length;
      if (onUnreadCountChange) onUnreadCountChange(unread);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, onUnreadCountChange]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    sound.playLike();
    try {
      await api.notifications.markRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (onUnreadCountChange) onUnreadCountChange(0);
      showToast('All alerts marked as read.', 'success');
    } catch (err) {
      showToast('Failed to mark alerts as read.', 'error');
    }
  };

  const filteredList = notifications.filter((n) => {
    if (filter === 'mentions') return n.type === 'mention' || n.type === 'reply' || n.type === 'quote';
    if (filter === 'likes') return n.type === 'like';
    if (filter === 'follows') return n.type === 'follow';
    return true;
  });

  const getActionDetails = (type: NotificationType): { icon: PixelIconName; text: string; color: string } => {
    switch (type) {
      case 'like':
        return { icon: 'heart-filled', text: 'supported your report', color: 'var(--color-navy)' };
      case 'reply':
        return { icon: 'reply', text: 'replied to your report', color: 'var(--color-accent)' };
      case 'repost':
        return { icon: 'repost', text: 'shared your report', color: 'var(--color-success)' };
      case 'quote':
        return { icon: 'repost', text: 'quoted your report', color: 'var(--color-primary)' };
      case 'follow':
        return { icon: 'user', text: 'followed you', color: 'var(--color-primary)' };
      case 'mention':
        return { icon: 'sparkles', text: 'mentioned you', color: 'var(--color-accent)' };
      default:
        return { icon: 'bell', text: 'interacted with you', color: 'currentColor' };
    }
  };

  if (!user) {
    return (
      <div className="p-8 bg-retro-card border-3 border-retro-border shadow-pixel-sm text-center flex flex-col items-center gap-4">
        <PixelIcon name="bell" size={32} color="var(--color-primary)" />
        <div className="font-body text-base font-semibold text-retro-text">
          Alerts require sign-in
        </div>
        <p className="font-body text-sm text-retro-muted max-w-xs leading-relaxed">
          Log in to see support and account alerts. Public reports stay anonymous.
        </p>
        <PixelButton variant="primary" size="md" onClick={() => openAuthModal('login')}>
          Log in
        </PixelButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Header & Filter Tabs */}
      <div className="pixel-box p-3.5 sm:p-4 flex flex-col gap-3 shadow-pixel-sm">
        <div className="flex items-center justify-between border-b-2 border-retro-border pb-2.5">
          <div className="flex items-center gap-2">
            <PixelIcon name="bell" size={18} color="var(--color-primary)" />
            <h2 className="font-body text-sm font-semibold text-retro-text">
              Alerts
            </h2>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="font-body text-xs font-semibold text-retro-navy hover:underline cursor-pointer"
          >
            Mark all read
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 bg-retro-subtle p-1 border-2 border-retro-border">
          {[
            { id: 'all', label: 'All' },
            { id: 'mentions', label: 'Mentions' },
            { id: 'likes', label: 'Likes' },
            { id: 'follows', label: 'Follows' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playTab();
                setFilter(tab.id as any);
              }}
              className={`font-body text-xs font-semibold py-2 select-none truncate cursor-pointer ${
                filter === tab.id
                  ? 'bg-retro-navy text-white'
                  : 'text-retro-muted hover:text-retro-text hover:bg-retro-card/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3 bg-retro-card border-3 border-retro-border shadow-pixel-sm">
          <PixelIcon name="sparkles" size={28} color="var(--color-primary)" className="animate-spin" />
          <div className="font-body text-sm text-retro-muted">
            Loading alerts…
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-8 bg-retro-card border border-retro-border text-center font-body text-sm text-retro-muted">
          No alerts in this filter.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredList.map((notif) => {
            const { icon, text, color } = getActionDetails(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => {
                  sound.playClick();
                  if (notif.post_id) {
                    onNavigateThread(notif.post_id);
                  } else {
                    onNavigateProfile(notif.actor.username);
                  }
                }}
                className={`pixel-box p-3 sm:p-3.5 flex items-start gap-3 cursor-pointer hover:border-retro-primary hover:shadow-pixel-md transition-all duration-75 ${
                  !notif.is_read ? 'border-retro-primary/80 bg-retro-subtle/70 shadow-pixel-sm' : ''
                }`}
              >
                {/* Action Icon Badge */}
                <div className="p-1.5 bg-retro-bg border-2 border-retro-shadow shrink-0 shadow-pixel-xs">
                  <PixelIcon name={icon} size={16} color={color} />
                </div>

                {/* Actor Avatar */}
                <div className="shrink-0">
                  <PixelAvatar
                    avatarId={notif.actor.avatar_id}
                    size={36}
                    interactive={true}
                    onClick={() => onNavigateProfile(notif.actor.username)}
                  />
                </div>

                {/* Notification Text */}
                <div className="flex-1 min-w-0">
                  <div className="font-pixel-body text-sm text-retro-text leading-relaxed">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateProfile(notif.actor.username);
                      }}
                      className="font-bold text-retro-text hover:underline cursor-pointer mr-1"
                    >
                      {notif.actor.display_name}
                    </span>
                    <span className="text-retro-muted font-terminal mr-1">
                      @{notif.actor.username}
                    </span>
                    <span className="text-retro-text">{text}</span>
                  </div>

                  {/* Target Chirp snippet if exists */}
                  {notif.post && (
                    <div className="mt-1.5 p-2 bg-retro-bg border border-retro-border text-xs text-retro-muted truncate font-pixel-body">
                      "{notif.post.content}"
                    </div>
                  )}

                  <div className="mt-1 font-terminal text-xs text-retro-muted">
                    {new Date(notif.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
