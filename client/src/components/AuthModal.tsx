import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { AVATAR_PRESETS } from '../utils/avatars.js';
import { isCustomAvatarString } from '../utils/avatarBuilder.js';
import { PixelAvatar } from './PixelAvatar.js';
import { PixelButton } from './PixelButton.js';
import { PixelIcon } from './PixelIcon.js';
import { PixelAvatarBuilderModal } from './PixelAvatarBuilderModal.js';
import { sound } from '../utils/sound.js';

const BANNER_COLORS = [
  '#0b2545', '#163a66', '#c65d12', '#17663f',
  '#5c6370', '#1e2d45', '#141820', '#8a4b12'
];

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, login, signup } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode);
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('knight');
  const [selectedBanner, setSelectedBanner] = useState<string>(BANNER_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);

  React.useEffect(() => {
    setMode(authModalMode);
    setErrorMsg('');
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login({ username, password });
        showToast(`Welcome back, @${username}.`, 'success');
      } else {
        await signup({
          username,
          display_name: displayName || username,
          password,
          bio,
          avatar_id: selectedAvatar,
          banner_color: selectedBanner,
        });
        showToast(`Account @${username} created.`, 'success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
      sound.playDelete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCustom = isCustomAvatarString(selectedAvatar);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b2545]/50 animate-modal-backdrop">
        <div className="bg-retro-card border border-retro-border max-w-lg w-full p-5 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto rounded-md shadow-pixel-lg animate-modal-open">
          <div className="flex items-center justify-between border-b border-retro-border pb-3">
            <div className="flex items-center gap-2">
              <PixelIcon name="sparkles" size={20} color="var(--color-navy)" />
              <span className="font-body text-sm font-semibold text-retro-text">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </span>
            </div>
            <button
              onClick={closeAuthModal}
              className="text-retro-muted hover:text-retro-text p-1 border-2 border-transparent hover:border-retro-border"
            >
              <PixelIcon name="close" size={16} />
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-retro-subtle p-1 rounded-sm">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                sound.playTab();
              }}
              className={`font-body text-xs font-semibold py-2 rounded-sm select-none ${
                mode === 'login'
                  ? 'bg-retro-navy text-white'
                  : 'bg-transparent text-retro-muted hover:text-retro-text'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                sound.playTab();
              }}
              className={`font-body text-xs font-semibold py-2 rounded-sm select-none ${
                mode === 'signup'
                  ? 'bg-retro-navy text-white'
                  : 'bg-transparent text-retro-muted hover:text-retro-text'
              }`}
            >
              Sign up
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-[#fde8e8] border border-retro-danger font-body text-sm text-retro-danger leading-relaxed" role="alert">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <>
                {/* Avatar Selector & Custom Builder Trigger */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="civic-label">
                      Avatar
                    </label>
                    <PixelButton
                      type="button"
                      variant="accent"
                      size="sm"
                      onClick={() => setIsBuilderOpen(true)}
                    >
                      <PixelIcon name="brush" size={12} color="#fff" />
                      Design avatar
                    </PixelButton>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-retro-subtle border-2 border-retro-border">
                    <PixelAvatar avatarId={selectedAvatar} size={54} />
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-sm font-semibold text-retro-navy">
                        {isCustom
                          ? 'Custom avatar'
                          : AVATAR_PRESETS.find((a) => a.id === selectedAvatar)?.name || 'Avatar'}
                      </div>
                      <div className="text-[11px] text-retro-muted font-mono">
                        {isCustom
                          ? 'Hair, outfit, and accessories'
                          : AVATAR_PRESETS.find((a) => a.id === selectedAvatar)?.category || 'Preset'}
                      </div>
                    </div>
                  </div>

                  {/* Preset Sprites Grid */}
                  <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 bg-retro-bg border-2 border-retro-border">
                    {AVATAR_PRESETS.map((sprite) => (
                      <button
                        key={sprite.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(sprite.id);
                          sound.playClick();
                        }}
                        className={`p-1 border-2 transition-none flex items-center justify-center ${
                          selectedAvatar === sprite.id
                            ? 'border-retro-primary bg-retro-card shadow-pixel-sm'
                            : 'border-retro-border/50 hover:border-retro-muted'
                        }`}
                      >
                        <PixelAvatar avatarId={sprite.id} size={32} showBorder={false} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Name */}
                <div className="flex flex-col gap-1">
                  <label className="civic-label">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Asha Kumar"
                    maxLength={30}
                    className="pixel-input p-2.5 text-sm"
                    required
                  />
                </div>

                {/* Banner Color */}
                <div className="flex flex-col gap-1">
                  <label className="civic-label">
                    Banner color
                  </label>
                  <div className="flex gap-2">
                    {BANNER_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedBanner(color);
                          sound.playClick();
                        }}
                        className={`w-7 h-7 border-2 ${
                          selectedBanner === color
                            ? 'border-retro-primary scale-110 shadow-pixel-sm'
                            : 'border-retro-shadow'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-1">
                  <label className="civic-label">
                    Bio
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Optional. Your username stays off the public feed."
                    maxLength={100}
                    className="pixel-input p-2.5 text-sm"
                  />
                </div>
              </>
            )}

            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="civic-label">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. asha_k"
                maxLength={20}
                className="pixel-input p-2.5 text-sm font-mono"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="civic-label">
                Password {mode === 'signup' && '(min 6 chars)'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="pixel-input p-2.5 text-sm font-mono"
                required
              />
            </div>

            {mode === 'login' && (
              <div className="text-[11px] text-retro-muted bg-retro-subtle p-2.5 border-2 border-retro-border">
                💡 Demo accounts:{' '}
                <span
                  onClick={() => {
                    setUsername('citizen_demo');
                    setPassword('password123');
                  }}
                  className="text-retro-primary underline cursor-pointer hover:text-retro-primaryHover mr-2 font-mono"
                >
                  citizen_demo
                </span>
                <span
                  onClick={() => {
                    setUsername('gov_demo');
                    setPassword('password123');
                  }}
                  className="text-retro-navy underline cursor-pointer hover:text-retro-primaryHover font-mono"
                >
                  gov_demo
                </span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3 border-t-2 border-retro-border">
              <PixelButton
                type="button"
                variant="secondary"
                size="md"
                onClick={closeAuthModal}
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
                {isSubmitting
                  ? 'Signing in…'
                  : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
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
          setSelectedAvatar(customAvatarId);
          showToast('Avatar saved.', 'success');
        }}
      />
    </>
  );
};
