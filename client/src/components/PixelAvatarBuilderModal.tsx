import React, { useState } from 'react';
import {
  CustomAvatarConfig,
  DEFAULT_AVATAR_CONFIG,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  OUTFITS,
  OUTFIT_COLORS,
  ACCESSORIES,
  encodeAvatarConfig,
  randomizeAvatarConfig,
} from '../utils/avatarBuilder.js';
import { PixelAvatar } from './PixelAvatar.js';
import { PixelButton } from './PixelButton.js';
import { PixelIcon } from './PixelIcon.js';
import { sound } from '../utils/sound.js';

interface PixelAvatarBuilderModalProps {
  isOpen: boolean;
  initialConfig?: CustomAvatarConfig;
  onClose: () => void;
  onSave: (encodedAvatarId: string) => void;
}

export const PixelAvatarBuilderModal: React.FC<PixelAvatarBuilderModalProps> = ({
  isOpen,
  initialConfig = DEFAULT_AVATAR_CONFIG,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState<CustomAvatarConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<'skin' | 'hair' | 'hcolor' | 'outfit' | 'ocolor' | 'accessory'>('skin');

  if (!isOpen) return null;

  const currentEncoded = encodeAvatarConfig(config);

  const handleRandomize = () => {
    sound.playLike();
    const randomized = randomizeAvatarConfig();
    setConfig(randomized);
  };

  const handleSave = () => {
    sound.playNotification();
    onSave(currentEncoded);
    onClose();
  };

  const tabs: { id: 'skin' | 'hair' | 'hcolor' | 'outfit' | 'ocolor' | 'accessory'; label: string }[] = [
    { id: 'skin', label: 'Body' },
    { id: 'hair', label: 'Hair' },
    { id: 'hcolor', label: 'Hair Color' },
    { id: 'outfit', label: 'Outfit' },
    { id: 'ocolor', label: 'Outfit Color' },
    { id: 'accessory', label: 'Extras' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-retro-card border-4 border-retro-shadow shadow-pixel-lg max-w-xl w-full p-4 sm:p-5 flex flex-col gap-4 animate-pixel-bounce max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-retro-border pb-2.5">
          <div className="flex items-center gap-2">
            <PixelIcon name="brush" size={20} color="var(--color-primary)" />
            <h2 className="font-pixel text-xs sm:text-sm text-retro-text tracking-wide">
              Avatar editor
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-retro-muted hover:text-retro-text p-1 border-2 border-transparent hover:border-retro-border"
          >
            <PixelIcon name="close" size={16} />
          </button>
        </div>

        {/* Live Sprite Preview & Randomizer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 bg-retro-bg border-3 border-retro-shadow">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-retro-card border-3 border-retro-shadow">
              <PixelAvatar avatarId={currentEncoded} size={80} showBorder={false} />
            </div>
            <div>
              <div className="font-pixel text-xs text-retro-text">
                Custom avatar
              </div>
              <div className="font-mono text-[11px] text-retro-muted mt-1">
                {SKIN_TONES.find((s) => s.id === config.skin)?.name} • {HAIR_STYLES.find((h) => h.id === config.hairStyle)?.name}
              </div>
              <div className="font-mono text-[10px] text-retro-primary mt-0.5">
                Style: {OUTFITS.find((o) => o.id === config.outfit)?.name}
              </div>
            </div>
          </div>

          {/* Randomize button */}
          <button
            type="button"
            onClick={handleRandomize}
            className="flex items-center gap-2 px-3 py-2 bg-retro-subtle hover:bg-retro-card border-2 border-retro-border hover:border-retro-primary text-retro-text font-pixel text-[9px] uppercase active:translate-x-0.5 active:translate-y-0.5"
          >
            <PixelIcon name="sparkles" size={14} color="var(--color-primary)" />
            <span>Randomize</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-retro-subtle p-1 border-2 border-retro-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playTab();
                setActiveTab(tab.id);
              }}
              className={`font-pixel text-[8px] sm:text-[9px] py-1.5 px-1 uppercase select-none transition-none truncate ${
                activeTab === tab.id
                  ? 'bg-retro-primary text-black border-2 border-retro-shadow font-bold'
                  : 'text-retro-muted hover:text-retro-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Option Chooser */}
        <div className="p-3 bg-retro-subtle border-2 border-retro-border min-h-[160px] max-h-56 overflow-y-auto">
          {/* 1. Skin Tone & Body */}
          {activeTab === 'skin' && (
            <div className="grid grid-cols-3 gap-2">
              {SKIN_TONES.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => {
                    sound.playClick();
                    setConfig({ ...config, skin: skin.id });
                  }}
                  className={`flex items-center gap-2 p-2 border-2 text-left font-pixel text-[8px] select-none ${
                    config.skin === skin.id
                      ? 'bg-retro-card border-retro-primary text-retro-primary font-bold shadow-pixel-sm'
                      : 'bg-retro-card/60 text-retro-text border-retro-border hover:border-retro-muted'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-none border border-retro-shadow shrink-0"
                    style={{ backgroundColor: skin.hex }}
                  />
                  <span className="truncate">{skin.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* 2. Hair Style */}
          {activeTab === 'hair' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {HAIR_STYLES.map((hair) => (
                <button
                  key={hair.id}
                  onClick={() => {
                    sound.playClick();
                    setConfig({ ...config, hairStyle: hair.id });
                  }}
                  className={`p-2 border-2 text-left font-pixel text-[9px] select-none truncate ${
                    config.hairStyle === hair.id
                      ? 'bg-retro-card border-retro-primary text-retro-primary font-bold shadow-pixel-sm'
                      : 'bg-retro-card/60 text-retro-text border-retro-border hover:border-retro-muted'
                  }`}
                >
                  {hair.name}
                </button>
              ))}
            </div>
          )}

          {/* 3. Hair Color */}
          {activeTab === 'hcolor' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {HAIR_COLORS.map((hc) => (
                <button
                  key={hc.id}
                  onClick={() => {
                    sound.playClick();
                    setConfig({ ...config, hairColor: hc.hex });
                  }}
                  className={`flex items-center gap-2 p-2 border-2 text-left font-pixel text-[8px] select-none ${
                    config.hairColor === hc.hex
                      ? 'bg-retro-card border-retro-primary text-retro-primary font-bold shadow-pixel-sm'
                      : 'bg-retro-card/60 text-retro-text border-retro-border hover:border-retro-muted'
                  }`}
                >
                  <span
                    className="w-4 h-4 border border-retro-shadow shrink-0"
                    style={{ backgroundColor: hc.hex }}
                  />
                  <span className="truncate">{hc.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* 4. Outfit Style */}
          {activeTab === 'outfit' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OUTFITS.map((outfit) => (
                <button
                  key={outfit.id}
                  onClick={() => {
                    sound.playClick();
                    setConfig({ ...config, outfit: outfit.id });
                  }}
                  className={`p-2 border-2 text-left font-pixel text-[9px] select-none truncate ${
                    config.outfit === outfit.id
                      ? 'bg-retro-card border-retro-primary text-retro-primary font-bold shadow-pixel-sm'
                      : 'bg-retro-card/60 text-retro-text border-retro-border hover:border-retro-muted'
                  }`}
                >
                  {outfit.name}
                </button>
              ))}
            </div>
          )}

          {/* 5. Outfit Color */}
          {activeTab === 'ocolor' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {OUTFIT_COLORS.map((oc) => (
                <button
                  key={oc.id}
                  onClick={() => {
                    sound.playClick();
                    setConfig({ ...config, outfitColor: oc.hex });
                  }}
                  className={`flex items-center gap-2 p-2 border-2 text-left font-pixel text-[8px] select-none ${
                    config.outfitColor === oc.hex
                      ? 'bg-retro-card border-retro-primary text-retro-primary font-bold shadow-pixel-sm'
                      : 'bg-retro-card/60 text-retro-text border-retro-border hover:border-retro-muted'
                  }`}
                >
                  <span
                    className="w-4 h-4 border border-retro-shadow shrink-0"
                    style={{ backgroundColor: oc.hex }}
                  />
                  <span className="truncate">{oc.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* 6. Accessories */}
          {activeTab === 'accessory' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACCESSORIES.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    sound.playClick();
                    setConfig({ ...config, accessory: acc.id });
                  }}
                  className={`p-2 border-2 text-left font-pixel text-[9px] select-none truncate ${
                    config.accessory === acc.id
                      ? 'bg-retro-card border-retro-primary text-retro-primary font-bold shadow-pixel-sm'
                      : 'bg-retro-card/60 text-retro-text border-retro-border hover:border-retro-muted'
                  }`}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-retro-border">
          <button
            onClick={onClose}
            className="font-pixel text-[9px] text-retro-muted hover:text-retro-text uppercase"
          >
            Cancel
          </button>
          <PixelButton variant="primary" size="md" onClick={handleSave}>
            Save avatar
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
