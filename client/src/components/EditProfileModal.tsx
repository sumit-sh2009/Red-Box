import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useToast } from '../context/ToastContext.js';
import { AVATAR_PRESETS } from '../utils/avatars.js';
import { isCustomAvatarString } from '../utils/avatarBuilder.js';
import { PixelAvatar } from './PixelAvatar.js';
import { PixelButton } from './PixelButton.js';
import { PixelIcon } from './PixelIcon.js';
import { PixelAvatarBuilderModal } from './PixelAvatarBuilderModal.js';
import { sound } from '../utils/sound.js';

const BANNER_COLORS = [
  '#3a86ff', '#ff006e', '#8338ec', '#fb5607',
  '#06d6a0', '#ffbe0b', '#1a1a24', '#00b4d8'
];

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateProfile } = useAuth();
  const { soundEnabled, setSoundEnabled } = useTheme();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState<string>(user?.display_name || '');
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [avatarId, setAvatarId] = useState<string>(user?.avatar_id || 'knight');
  const [bannerColor, setBannerColor] = useState<string>(user?.banner_color || BANNER_COLORS[0]);
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.display_name);
      setBio(user.bio);
      setAvatarId(user.avatar_id);
      setBannerColor(user.banner_color || BANNER_COLORS[0]);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_id: avatarId,
        banner_color: bannerColor,
      });
      showToast('Profile saved.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCustom = isCustomAvatarString(avatarId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
        <div className="bg-retro-card border-4 border-retro-shadow shadow-pixel-lg max-w-lg w-full p-5 sm:p-6 flex flex-col gap-4 animate-pixel-bounce max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b-3 border-retro-border pb-3">
            <div className="flex items-center gap-2">
              <PixelIcon name="settings" size={20} color="var(--color-primary)" />
              <h2 className="font-pixel text-xs sm:text-sm text-retro-text tracking-wide uppercase">
                Profile settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-retro-muted hover:text-retro-text p-1 border-2 border-transparent hover:border-retro-border"
            >
              <PixelIcon name="close" size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Banner preview */}
            <div
              className="h-20 w-full border-2 border-retro-shadow relative flex items-end p-2"
              style={{ backgroundColor: bannerColor }}
            >
              <div className="absolute -bottom-5 left-3">
                <PixelAvatar avatarId={avatarId} size={56} />
              </div>
            </div>

            {/* Banner Colors */}
            <div className="flex flex-col gap-1 mt-4">
              <label className="font-pixel text-[9px] text-retro-muted uppercase">
                Banner colour
              </label>
              <div className="flex gap-2">
                {BANNER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setBannerColor(color);
                      sound.playClick();
                    }}
                    className={`w-7 h-7 border-2 ${
                      bannerColor === color
                        ? 'border-retro-primary scale-110 shadow-pixel-sm'
                        : 'border-retro-shadow'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Avatar Selector & Builder Triggers */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="font-pixel text-[9px] text-retro-muted uppercase">
                  Avatar
                </label>
                <div className="flex gap-1.5">
                  <PixelButton
                    type="button"
                    variant="accent"
                    size="sm"
                    onClick={() => setIsBuilderOpen(true)}
                  >
                    <PixelIcon name="brush" size={12} color="#000" />
                    Design avatar
                  </PixelButton>
                </div>
              </div>

              {/* Active Avatar Preview Card */}
              <div className="flex items-center gap-3 p-3 bg-retro-subtle border-2 border-retro-border">
                <PixelAvatar avatarId={avatarId} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="font-pixel text-[10px] text-retro-primary truncate">
                    {isCustom
                      ? 'Custom avatar'
                      : AVATAR_PRESETS.find((a) => a.id === avatarId)?.name || 'Avatar'}
                  </div>
                  <div className="text-[11px] text-retro-muted font-mono truncate">
                    {isCustom
                      ? 'Designed in the avatar editor'
                      : AVATAR_PRESETS.find((a) => a.id === avatarId)?.category || 'Preset'}
                  </div>
                </div>
              </div>

              {/* Preset Sprites Quick-Picker */}
              <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 bg-retro-bg border-2 border-retro-border">
                {AVATAR_PRESETS.map((sprite) => (
                  <button
                    key={sprite.id}
                    type="button"
                    onClick={() => {
                      setAvatarId(sprite.id);
                      sound.playClick();
                    }}
                    className={`p-1 border-2 transition-none flex items-center justify-center ${
                      avatarId === sprite.id
                        ? 'border-retro-primary bg-retro-card shadow-pixel-sm'
                        : 'border-retro-border/50 hover:border-retro-muted'
                    }`}
                  >
                    <PixelAvatar avatarId={sprite.id} size={30} showBorder={false} />
                  </button>
                ))}
              </div>
            </div>

            {/* Display Name */}
            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[9px] text-retro-muted uppercase">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                className="pixel-input p-2.5 text-sm"
                required
              />
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[9px] text-retro-muted uppercase">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                maxLength={160}
                className="pixel-input p-2.5 text-sm resize-none"
              />
            </div>

            <div className="p-3 bg-retro-subtle border-2 border-retro-border flex flex-col gap-3">
              <div className="font-pixel text-[9px] text-retro-text uppercase tracking-wider border-b border-retro-border pb-1.5 flex items-center gap-1.5">
                <PixelIcon name="settings" size={14} color="var(--color-primary)" />
                Audio
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 border font-body text-xs rounded-[3px] w-full cursor-pointer ${
                  soundEnabled
                    ? 'bg-retro-navy text-white border-retro-navy'
                    : 'bg-retro-card text-retro-muted border-retro-border'
                }`}
              >
                Sounds: {soundEnabled ? 'On' : 'Off'}
              </button>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t-2 border-retro-border">
              <PixelButton
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </PixelButton>
              <PixelButton
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving…' : 'Save'}
              </PixelButton>
            </div>
          </form>
        </div>
      </div>

      {/* Custom Avatar Builder Modal */}
      <PixelAvatarBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={(customAvatarId) => {
          setAvatarId(customAvatarId);
          showToast('Avatar updated. Save to keep it.', 'success');
        }}
      />
    </>
  );
};
