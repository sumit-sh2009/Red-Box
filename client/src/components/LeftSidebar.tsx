import React from 'react';
import { motion } from 'motion/react';
import { Home, Search, Bell, Landmark, User, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { PixelAvatar } from './PixelAvatar.js';
import { PixelButton } from './PixelButton.js';
import { Pressable } from './Pressable.js';
import { Reveal } from './Reveal.js';
import { ThemeName } from '../types/index.js';
import { sound } from '../utils/sound.js';

interface LeftSidebarProps {
  currentTab: string;
  unreadCount?: number;
  compact?: boolean;
  onSelectTab: (tab: string) => void;
  onOpenCompose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentTab,
  unreadCount = 0,
  compact = false,
  onSelectTab,
  onOpenCompose,
}) => {
  const { user, logout, openAuthModal } = useAuth();
  const { theme, setTheme } = useTheme();

  const navItems: NavItem[] = [
    { id: 'home', label: 'Reports', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'gov-panel', label: 'Intelligence', icon: Landmark },
    { id: 'profile', label: 'Account', icon: User },
  ];

  return (
    <aside className={`${compact ? 'w-52' : 'w-56 xl:w-64'} shrink-0 flex flex-col justify-between h-[calc(100dvh-3rem)] sticky top-6 select-none`}>
      <div className="flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
        <Reveal y={6} duration={0.32}>
          <Pressable
            as="div"
            hoverLift={false}
            className="cursor-pointer group"
            onClick={() => {
              sound.playChirp();
              onSelectTab('home');
            }}
            role="link"
            tabIndex={0}
            aria-label="CivicPulse home"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-retro-navy rounded-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.04]">
                <Landmark className="w-4 h-4 text-white" aria-hidden />
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold text-retro-text leading-none">
                  CivicPulse
                </h1>
                <div className="civic-label mt-1.5">Anonymous civic reports</div>
              </div>
            </div>
          </Pressable>
        </Reveal>

        <a
          href="/"
          className="text-left font-body text-sm font-semibold text-retro-navy border border-retro-border bg-retro-card px-3 py-2 rounded-sm cursor-pointer hover:border-retro-navy no-underline transition-[border-color,background-color] duration-150"
        >
          ← City landing
        </a>

        {compact && (
          <Pressable
            as="button"
            className="text-left font-body text-sm font-semibold text-retro-navy border border-retro-border bg-retro-card px-3 py-2 rounded-sm hover:border-retro-navy transition-[border-color,background-color] duration-150"
            onClick={() => onSelectTab('home')}
          >
            ← Back to reports
          </Pressable>
        )}

        <nav className="flex flex-col gap-1">
          {(compact
            ? navItems.filter((item) => item.id === 'gov-panel' || item.id === 'home' || item.id === 'profile')
            : navItems
          ).map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playTab();
                  onSelectTab(item.id);
                }}
                className={`relative flex items-center gap-3 px-3 py-2.5 font-body text-[13px] font-medium text-left cursor-pointer rounded-sm transition-[background-color,color] duration-150 group ${
                  isActive
                    ? 'text-retro-navy bg-[color-mix(in_srgb,var(--color-navy)_7%,var(--color-card))]'
                    : 'bg-transparent text-retro-text hover:bg-retro-subtle/90'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="civic-nav-active"
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-retro-navy"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    aria-hidden
                  />
                )}
                <motion.span
                  className="relative z-[1] w-5 flex justify-center"
                  whileHover={{ x: 2 }}
                  transition={{ type: 'spring', stiffness: 480, damping: 28 }}
                  aria-hidden
                >
                  <item.icon className="w-4 h-4" />
                </motion.span>
                <span className="relative z-[1] flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="relative z-[1] px-1.5 py-0.5 bg-retro-danger text-white text-[10px] font-body rounded-sm">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {!compact && (
          <PixelButton
            variant="glow"
            size="lg"
            onClick={() => {
              if (!user) {
                openAuthModal('signup');
                return;
              }
              onOpenCompose();
            }}
            className="w-full justify-center bg-retro-navy text-white border-retro-navy"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            File report
          </PixelButton>
        )}

        {user && (
          <div className="pixel-box-sm p-2.5 flex flex-col gap-1.5 bg-retro-card">
            <span className="civic-label">Public feed</span>
            <p className="font-body text-xs text-retro-muted leading-snug">
              Reports do not show your username. Your account exists only to file and support.
            </p>
            <div className="font-mono text-xs text-retro-muted">
              {user.role === 'government' ? 'Role: Government' : 'Role: Citizen'}
            </div>
          </div>
        )}

        <details className="pixel-box-sm p-3">
          <summary className="civic-label cursor-pointer">Appearance</summary>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {[
              { id: 'civic', label: 'Paper', color: '#0b2545' },
              { id: 'arcade', label: 'Ink', color: '#071a33' },
              { id: 'nes', label: 'Warm', color: '#c2410c' },
              { id: 'cyberpunk', label: 'Night', color: '#141c28' },
            ].map((t) => (
              <Pressable
                key={t.id}
                as="button"
                hoverLift={false}
                onClick={() => setTheme(t.id as ThemeName)}
                aria-pressed={theme === t.id}
                className={`font-body text-[11px] py-1.5 px-1 border rounded-[3px] flex items-center gap-1 transition-[background-color,color,border-color] duration-150 ${
                  theme === t.id
                    ? 'bg-retro-navy text-white border-retro-navy'
                    : 'bg-retro-subtle text-retro-muted border-retro-border hover:border-retro-navy'
                }`}
              >
                <span className="w-2 h-2 border border-black/20 shrink-0" style={{ backgroundColor: t.color }} />
                <span className="truncate">{t.label}</span>
              </Pressable>
            ))}
          </div>
        </details>
      </div>

      <div className="mt-2">
        {user ? (
          <div className="pixel-box-sm p-2.5 flex items-center justify-between gap-2 bg-retro-card transition-[border-color] duration-200 hover:border-retro-navy">
            <Pressable
              as="div"
              hoverLift={false}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
              onClick={() => {
                sound.playClick();
                onSelectTab(`profile-${user.username}`);
              }}
            >
              <PixelAvatar avatarId={user.avatar_id} size={36} />
              <div className="min-w-0">
                <div className="font-body font-semibold text-sm text-retro-text truncate">
                  {user.display_name}
                </div>
                <div className="text-xs text-retro-muted font-mono truncate">
                  @{user.username}
                </div>
              </div>
            </Pressable>
            <Pressable
              as="button"
              hoverLift={false}
              aria-label="Log out"
              onClick={logout}
              className="text-retro-muted hover:text-retro-danger p-1.5 border border-retro-border rounded-sm transition-[color,border-color] duration-150"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Pressable>
          </div>
        ) : (
          <div className="pixel-box-sm p-2.5 flex flex-col gap-2 bg-retro-card">
            <div className="civic-label text-center">Guest</div>
            <div className="grid grid-cols-2 gap-1.5">
              <PixelButton variant="primary" size="sm" onClick={() => openAuthModal('login')}>
                Log in
              </PixelButton>
              <PixelButton variant="secondary" size="sm" onClick={() => openAuthModal('signup')}>
                Join
              </PixelButton>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
