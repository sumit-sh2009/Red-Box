import React from 'react';
import { User } from '../types/index.js';
import { PixelAvatar } from './PixelAvatar.js';
import { sound } from '../utils/sound.js';

interface MentionDropdownProps {
  users: User[];
  selectedIndex?: number;
  onSelect: (username: string) => void;
  visible: boolean;
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  users,
  selectedIndex = 0,
  onSelect,
  visible,
}) => {
  if (!visible || users.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-retro-card border-3 border-retro-shadow shadow-pixel-md z-50 max-h-56 overflow-y-auto">
      <div className="p-2 border-b-2 border-retro-border bg-retro-subtle font-pixel text-[9px] text-retro-muted uppercase flex items-center justify-between">
        <span>Mention a user</span>
        <span className="font-mono text-[9px] text-retro-muted">↑↓ to navigate • Enter to pick</span>
      </div>
      <div className="divide-y-2 divide-retro-border">
        {users.map((u, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={u.id}
              onMouseDown={(e) => {
                // onMouseDown prevents textarea blur before click finishes
                e.preventDefault();
                sound.playClick();
                onSelect(u.username);
              }}
              className={`flex items-center gap-2.5 p-2 cursor-pointer transition-none select-none ${
                isSelected
                  ? 'bg-retro-primary text-black font-bold'
                  : 'hover:bg-retro-subtle text-retro-text'
              }`}
            >
              <PixelAvatar avatarId={u.avatar_id} size={26} />
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-xs truncate ${isSelected ? 'text-black' : 'text-retro-text'}`}>
                  {u.display_name}
                </div>
                <div className={`text-[11px] font-mono truncate ${isSelected ? 'text-black/80' : 'text-retro-muted'}`}>
                  @{u.username}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
