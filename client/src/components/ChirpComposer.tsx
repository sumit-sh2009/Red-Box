import React, { useState, useRef, useEffect } from 'react';
import { ImagePlus, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { ApiError, api } from '../utils/api.js';
import { User, Post } from '../types/index.js';
import { complaintToPost } from '../utils/civicMap.js';
import { PixelAvatar } from './PixelAvatar.js';
import { PixelButton } from './PixelButton.js';
import { MentionDropdown } from './MentionDropdown.js';
import { sound } from '../utils/sound.js';
import { AIProcessing } from './gov/AIProcessing.js';
import { PIPELINE_NODES, PIPELINE_LABEL } from '../constants/pipeline.js';

interface ChirpComposerProps {
  parentPostId?: string;
  placeholder?: string;
  onPostCreated?: (newPost: Post) => void;
  className?: string;
  compact?: boolean;
}

export const ChirpComposer: React.FC<ChirpComposerProps> = ({
  parentPostId,
  placeholder = 'Describe the civic issue. Your name will not appear on the public report.',
  onPostCreated,
  className = '',
  compact = false,
}) => {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [content, setContent] = useState<string>('');
  const [locationText, setLocationText] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [pipelineIndex, setPipelineIndex] = useState<number>(-1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reviseMessage, setReviseMessage] = useState<string>('');

  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    if (parentPostId && mentionQuery !== null && mentionQuery.length > 0) {
      api.users.search(mentionQuery).then((res) => {
        if (active) {
          setMentionUsers(res.users);
          setSelectedMentionIndex(0);
        }
      }).catch(() => {});
    } else {
      setMentionUsers([]);
    }
    return () => {
      active = false;
    };
  }, [mentionQuery, parentPostId]);

  useEffect(() => {
    if (!isSubmitting || parentPostId) return;
    setPipelineIndex(0);
    const id = window.setInterval(() => {
      setPipelineIndex((i) => Math.min(i + 1, PIPELINE_NODES.length - 1));
    }, 420);
    return () => window.clearInterval(id);
  }, [isSubmitting, parentPostId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const cap = parentPostId ? 280 : 800;
    const val = e.target.value.slice(0, cap);
    setContent(val);
    if (!parentPostId) return;
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
    setContent(`${before}@${username} ${after}`.slice(0, 280));
    setMentionQuery(null);
    setMentionIndex(-1);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && mentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % mentionUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + mentionUsers.length) % mentionUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const picked = mentionUsers[selectedMentionIndex];
        if (picked) handleSelectMention(picked.username);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Image is too large (max 8MB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) {
      openAuthModal('signup');
      return;
    }
    const trimmed = content.trim();
    if (!trimmed && !imageUrl) {
      showToast('Describe the issue or attach evidence.', 'error');
      return;
    }
    if (!parentPostId && !locationText.trim()) {
      showToast('Add a location (area, landmark, or street).', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (parentPostId) {
        const res = await api.posts.create({
          content: trimmed,
          image_url: imageUrl,
          parent_post_id: parentPostId,
        });
        sound.playChirp();
        setContent('');
        setImageUrl(null);
        showToast('Reply posted.', 'success');
        if (onPostCreated) onPostCreated(res.post);
      } else {
        await api.complaints.moderate({
          body: trimmed,
          location_text: locationText.trim(),
        });
        setReviseMessage('');
        const res = await api.complaints.create({
          body: trimmed,
          location_text: locationText.trim(),
          category: category || null,
          image_url: imageUrl,
        });
        sound.playChirp();
        setContent('');
        setLocationText('');
        setCategory('');
        setImageUrl(null);
        setReviseMessage('');
        showToast(
          res.complaint.ai?.needs_review
            ? 'Filed. Flagged for human review (low confidence).'
            : `Filed anonymously. ${res.complaint.ai?.category || 'Classified'}.`,
          'success'
        );
        if (onPostCreated) onPostCreated(complaintToPost(res.complaint));
      }
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : null;
      const message = apiErr?.rewrite_message || (err instanceof Error ? err.message : 'Failed to submit');
      if (apiErr?.action === 'revise' || apiErr?.status === 422) {
        setReviseMessage(message);
        showToast(message, 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
      setPipelineIndex(-1);
    }
  };

  const remainingChars = (parentPostId ? 280 : 800) - content.length;
  const progressRatio = Math.min(1, content.length / (parentPostId ? 280 : 800));

  return (
    <>
      <div className={`pixel-box p-5 sm:p-6 relative overflow-hidden ${className}`}>
        {!parentPostId && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-retro-saffron" aria-hidden />
        )}
        <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-retro-border">
          <div>
            <p className="civic-label mb-1.5">{parentPostId ? 'Official note' : 'File a civic report'}</p>
            {!parentPostId && (
              <p className="font-body text-sm text-retro-muted flex items-start gap-1.5 max-w-md">
                <Shield className="w-3.5 h-3.5 text-retro-navy shrink-0 mt-0.5" aria-hidden />
                Published as “Anonymous citizen”. Your account is never shown on the public card.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3.5">
          <div className="shrink-0 pt-0.5 hidden sm:block">
            <PixelAvatar avatarId={user?.avatar_id || 'ghost'} size={compact ? 36 : 44} />
          </div>

          <div className="flex-1 min-w-0 relative">
            <label htmlFor="civic-body" className="sr-only">
              {parentPostId ? 'Reply text' : 'Issue description'}
            </label>
            <textarea
              id="civic-body"
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (!user) openAuthModal('signup');
              }}
              placeholder={user ? placeholder : 'Log in to file an anonymous report…'}
              rows={compact ? 2 : 4}
              maxLength={parentPostId ? 280 : 800}
              className="pixel-input w-full p-3 font-body text-[15px] sm:text-base text-retro-text placeholder:text-retro-muted/70 resize-none leading-relaxed min-h-[88px]"
            />

            {reviseMessage && !parentPostId && (
              <div className="mt-3 p-3 border border-retro-navy/30 bg-[#e8eef6] rounded-sm" role="alert">
                <p className="civic-label mb-1 text-retro-navy">Please revise</p>
                <p className="font-body text-sm text-retro-text leading-relaxed">{reviseMessage}</p>
                <p className="font-body text-xs text-retro-muted mt-2">
                  The filing was not discarded. Edit the description and submit again.
                </p>
              </div>
            )}

            {!parentPostId && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="civic-location" className="font-body text-xs font-semibold text-retro-text">
                    Location <span className="text-retro-danger">required</span>
                  </label>
                  <input
                    id="civic-location"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder="Area, landmark, or street"
                    className="pixel-input w-full p-2 font-body text-sm"
                    maxLength={120}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="civic-category" className="font-body text-xs font-semibold text-retro-text">
                    Category <span className="text-retro-muted font-normal">optional — AI can fill</span>
                  </label>
                  <select
                    id="civic-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="pixel-input w-full p-2 font-body text-sm bg-retro-card"
                  >
                    <option value="">Let intelligence classify</option>
                    <option>Roads & Infrastructure</option>
                    <option>Water Supply & Drainage</option>
                    <option>Sanitation & Waste</option>
                    <option>Street Lighting & Power</option>
                    <option>Public Safety & Hazards</option>
                    <option>Parks & Public Amenities</option>
                    <option>Other Civic Issues</option>
                  </select>
                </div>
              </div>
            )}

            {isSubmitting && !parentPostId && (
              <div className="mt-4">
                <AIProcessing
                  steps={PIPELINE_NODES}
                  activeIndex={pipelineIndex}
                  labels={PIPELINE_LABEL}
                  title="Live pipeline"
                  compact
                />
              </div>
            )}

            <MentionDropdown
              users={mentionUsers}
              selectedIndex={selectedMentionIndex}
              onSelect={handleSelectMention}
              visible={!!parentPostId && mentionQuery !== null && mentionUsers.length > 0}
            />

            {imageUrl && (
              <div className="relative mt-3 p-2 bg-retro-subtle border border-retro-border inline-block max-w-full rounded-[3px]">
                <img src={imageUrl} alt="Attached evidence" className="max-h-48 sm:max-h-60 object-contain" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute top-1 right-1 bg-retro-card border border-retro-border p-1 cursor-pointer rounded-[3px]"
                  aria-label="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {content.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-retro-subtle border border-retro-border rounded-[2px] overflow-hidden">
                  <div
                    className="h-full bg-retro-navy"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>
                <span className={`font-mono text-xs tabular-nums ${remainingChars <= 20 ? 'text-retro-danger' : 'text-retro-muted'}`}>
                  {remainingChars}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-retro-border">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      openAuthModal('signup');
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-retro-subtle hover:bg-retro-card border border-retro-border font-body text-xs font-semibold cursor-pointer rounded-[3px]"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-retro-navy" />
                  Attach photo
                </button>
              </div>

              <PixelButton
                variant="primary"
                size={compact ? 'sm' : 'md'}
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !imageUrl)}
              >
                {isSubmitting ? (parentPostId ? 'Posting…' : 'Filing…') : parentPostId ? 'Reply' : 'File report'}
              </PixelButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
