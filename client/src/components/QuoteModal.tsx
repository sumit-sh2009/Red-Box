import React, { useState, useRef, useEffect } from 'react';
import { Post, User } from '../types/index.js';
import { api } from '../utils/api.js';
import { PixelAvatar } from './PixelAvatar.js';
import { PixelButton } from './PixelButton.js';
import { PixelIcon } from './PixelIcon.js';
import { MentionDropdown } from './MentionDropdown.js';
import { sound } from '../utils/sound.js';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onSubmit: (content: string) => Promise<void>;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  post,
  onSubmit,
}) => {
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Mention autocomplete in Quote Modal
  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let active = true;
    if (mentionQuery !== null && mentionQuery.length > 0) {
      api.users.search(mentionQuery).then((res) => {
        if (active) {
          setMentionUsers(res.users);
          setSelectedMentionIndex(0);
        }
      }).catch(() => {});
    } else {
      setMentionUsers([]);
      setSelectedMentionIndex(0);
    }
    return () => {
      active = false;
    };
  }, [mentionQuery]);

  if (!isOpen || !post) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 280);
    setContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt !== -1) {
      const query = textBeforeCursor.slice(lastAt + 1);
      if (!query.includes(' ') && !query.includes('\n') && query.length <= 15) {
        setMentionQuery(query);
        setMentionIndex(lastAt);
        return;
      }
    }

    setMentionQuery(null);
    setMentionIndex(-1);
  };

  const handleSelectMention = (username: string) => {
    if (mentionIndex === -1) return;
    const cursorPos = textareaRef.current?.selectionStart || content.length;
    const before = content.slice(0, mentionIndex);
    const after = content.slice(cursorPos);
    const newText = `${before}@${username} ${after}`.slice(0, 280);
    setContent(newText);
    setMentionQuery(null);
    setMentionIndex(-1);
    setSelectedMentionIndex(0);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && mentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sound.playClick();
        setSelectedMentionIndex((prev) => (prev + 1) % mentionUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        sound.playClick();
        setSelectedMentionIndex((prev) => (prev - 1 + mentionUsers.length) % mentionUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const picked = mentionUsers[selectedMentionIndex];
        if (picked) {
          handleSelectMention(picked.username);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    sound.playChirp();
    try {
      await onSubmit(content.trim());
      setContent('');
      onClose();
    } catch (err) {
      console.error('Error quoting chirp:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 280 - content.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-retro-card border-4 border-retro-shadow shadow-pixel-lg max-w-lg w-full p-4 sm:p-5 flex flex-col gap-4 animate-pixel-bounce max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-retro-border pb-2.5">
          <div className="flex items-center gap-2">
            <PixelIcon name="repost" size={18} color="var(--color-primary)" />
            <h2 className="font-pixel text-xs sm:text-sm text-retro-text tracking-wide">
              Quote report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-retro-muted hover:text-retro-text p-1 border-2 border-transparent hover:border-retro-border"
          >
            <PixelIcon name="close" size={16} />
          </button>
        </div>

        {/* Comment Input */}
        <div className="flex flex-col gap-1.5 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment…"
            rows={3}
            className="pixel-input w-full p-3 text-sm resize-none rounded-none"
            autoFocus
          />

          <MentionDropdown
            users={mentionUsers}
            selectedIndex={selectedMentionIndex}
            onSelect={handleSelectMention}
            visible={mentionQuery !== null && mentionUsers.length > 0}
          />

          <div className="flex justify-end font-pixel text-[9px] text-retro-muted">
            <span className={remainingChars < 20 ? 'text-retro-danger font-bold' : ''}>
              {remainingChars}
            </span>
          </div>
        </div>

        {/* Nested Pixel-Bordered Quoted Card Preview */}
        <div className="p-3.5 bg-retro-subtle border-3 border-retro-shadow shadow-pixel-sm select-none relative">
          <div className="flex items-center gap-2 mb-2">
            <PixelAvatar avatarId={post.author.avatar_id} size={24} />
            <span className="font-bold text-xs text-retro-text truncate">
              {post.author.display_name}
            </span>
            <span className="text-[11px] text-retro-muted font-mono truncate">
              @{post.author.username}
            </span>
          </div>

          <p className="text-xs text-retro-text/90 leading-relaxed line-clamp-4">
            {post.content}
          </p>

          {post.image_url && (
            <div className="mt-2.5 border-2 border-retro-border overflow-hidden max-h-36 flex items-center justify-center bg-retro-bg">
              <img
                src={post.image_url}
                alt="Quoted attachment"
                className="max-h-36 w-full object-contain pixel-art"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-retro-border">
          <PixelButton variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
            CANCEL
          </PixelButton>
          <PixelButton
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? 'Posting…' : 'Quote'}
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
