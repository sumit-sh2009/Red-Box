import React from 'react';
import { Home, Search, Bell, Landmark, User, Plus } from 'lucide-react';
import { sound } from '../utils/sound.js';

interface MobileBottomNavProps {
  currentTab: string;
  unreadCount?: number;
  onSelectTab: (tab: string) => void;
  onOpenCompose: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  unreadCount = 0,
  onSelectTab,
  onOpenCompose,
}) => {
  const items: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Reports', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'gov-panel', label: 'Intel', icon: Landmark },
    { id: 'profile', label: 'Account', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-retro-card/95 border-t border-retro-border px-2 py-2 flex items-center justify-around" aria-label="Primary">
      {items.map((item) => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              sound.playTab();
              onSelectTab(item.id);
            }}
            className={`relative flex flex-col items-center justify-center p-2 font-body text-[10px] font-semibold cursor-pointer ${
              isActive ? 'text-retro-navy' : 'text-retro-muted hover:text-retro-text'
            }`}
          >
            <Icon className="w-[18px] h-[18px]" aria-hidden />
            <span className="mt-1">{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span className="absolute top-1 right-2 px-1 bg-retro-danger text-white text-[9px] font-mono rounded-[2px]">
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => {
          sound.playChirp();
          onOpenCompose();
        }}
        className="p-2.5 bg-retro-navy text-white font-body text-xs cursor-pointer rounded-sm"
        aria-label="File report"
      >
        <Plus className="w-4 h-4 text-white" />
      </button>
    </nav>
  );
};
