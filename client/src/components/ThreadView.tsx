import React, { useEffect, useState } from 'react';
import { Post } from '../types/index.js';
import { api } from '../utils/api.js';
import { ChirpCard } from './ChirpCard.js';
import { ChirpComposer } from './ChirpComposer.js';
import { PixelIcon } from './PixelIcon.js';
import { sound } from '../utils/sound.js';
import { complaintToPost } from '../utils/civicMap.js';

interface ThreadViewProps {
  postId: string;
  onBack: () => void;
  onNavigateProfile: (username: string) => void;
  onNavigateTag: (tag: string) => void;
  onNavigateThread: (id: string) => void;
}

export const ThreadView: React.FC<ThreadViewProps> = ({
  postId,
  onBack,
  onNavigateProfile,
  onNavigateTag,
  onNavigateThread,
}) => {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = async () => {
    setIsLoading(true);
    setError(null);
    try {
      try {
        const civic = await api.complaints.get(postId);
        setPost(complaintToPost(civic.complaint));
      } catch {
        const res = await api.posts.getById(postId);
        setPost(res.post);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [postId]);

  const handleReplyCreated = (newReply: Post) => {
    if (!post) return;
    setPost({
      ...post,
      replies_count: (post.replies_count || 0) + 1,
      replies: [...(post.replies || []), newReply],
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 bg-retro-card border border-retro-border rounded-md">
        <div className="font-body text-sm text-retro-muted">Loading report…</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-6 bg-retro-card border border-retro-border rounded-md text-center flex flex-col items-center gap-3">
        <div className="font-body text-sm text-retro-danger">{error || 'Report not found'}</div>
        <button
          onClick={onBack}
          className="font-body text-sm font-semibold text-retro-navy hover:underline cursor-pointer"
        >
          ← Back to reports
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Back button header */}
      <div className="flex items-center gap-3 pb-3 border-b border-retro-border">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="p-1.5 bg-retro-subtle border border-retro-border hover:border-retro-navy text-retro-text cursor-pointer rounded-sm"
          aria-label="Back to reports"
        >
          <PixelIcon name="arrow-left" size={16} />
        </button>
        <h2 className="font-body text-base font-semibold text-retro-text">
          Report detail
        </h2>
      </div>

      {/* Parent Post (if this is a reply to something) */}
      {post.parent_post && (
        <div className="relative">
          <ChirpCard
            post={post.parent_post}
            onNavigateProfile={onNavigateProfile}
            onNavigateTag={onNavigateTag}
            onNavigateThread={onNavigateThread}
          />
          <div className="h-4 w-1 bg-retro-border mx-auto my-1" />
        </div>
      )}

      {/* Main Focus Post */}
      <ChirpCard
        post={post}
        isThreadView={true}
        onNavigateProfile={onNavigateProfile}
        onNavigateTag={onNavigateTag}
        onNavigateThread={onNavigateThread}
        onPostDeleted={() => {
          onBack();
        }}
      />

      {/* Reply Composer — civic reports do not use public identity threads */}
      {!post.civic && (
      <div className="my-1">
        <ChirpComposer
          parentPostId={post.id}
          placeholder={`Reply to @${post.author.username}...`}
          onPostCreated={handleReplyCreated}
          compact={true}
        />
      </div>
      )}

      {/* Threaded Replies List */}
      <div className="flex flex-col gap-3">
        <div className="civic-label px-1">
          Updates
        </div>

        {(!post.replies || post.replies.length === 0) ? (
          <div className="p-6 bg-retro-subtle border border-retro-border text-center font-body text-sm text-retro-muted">
            {post.civic ? 'Civic reports stay anonymous. There is no public comment thread.' : 'No replies yet.'}
          </div>
        ) : (
          post.replies.map((reply) => (
            <div key={reply.id} className="flex flex-col gap-2">
              <ChirpCard
                post={reply}
                onNavigateProfile={onNavigateProfile}
                onNavigateTag={onNavigateTag}
                onNavigateThread={onNavigateThread}
                showThreadConnector={true}
              />

              {/* Nested Second-Level Sub-Replies */}
              {reply.replies && reply.replies.length > 0 && (
                <div className="pl-6 sm:pl-10 flex flex-col gap-2 relative">
                  <div className="absolute left-2.5 sm:left-4 top-0 bottom-4 w-0.5 bg-retro-border" />
                  {reply.replies.map((subReply) => (
                    <ChirpCard
                      key={subReply.id}
                      post={subReply}
                      onNavigateProfile={onNavigateProfile}
                      onNavigateTag={onNavigateTag}
                      onNavigateThread={onNavigateThread}
                      showThreadConnector={true}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
