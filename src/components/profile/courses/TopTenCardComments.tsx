import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useTopTenReactions, REACTION_CONFIG, ReactionType } from '@/hooks/useTopTenReactions';
import { useTopTenComments } from '@/hooks/useTopTenComments';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatDistanceToNow } from 'date-fns';

interface TopTenCardCommentsProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  courseId: string;
  courseName: string;
  isOwnProfile: boolean;
  privacySetting?: string;
}

export const TopTenCardComments: React.FC<TopTenCardCommentsProps> = ({
  isOpen, onClose, targetUserId, courseId, courseName,
  isOwnProfile, privacySetting = 'followers',
}) => {
  const { user } = useSupabaseSession();
  const { counts, myReaction, toggleReaction } = useTopTenReactions(targetUserId, courseId);
  const { comments, addComment, deleteComment } = useTopTenComments(targetUserId, courseId);
  const [draft, setDraft] = useState('');

  const canInteract = privacySetting !== 'off' && !isOwnProfile && !!user;
  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  const handleSubmit = () => {
    if (!draft.trim()) return;
    addComment(draft);
    setDraft('');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-[20px] max-h-[92dvh] p-0 border-0 bg-card">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{courseName}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalReactions} reaction{totalReactions !== 1 ? 's' : ''} · {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Reaction buttons */}
        <div className="flex gap-2 px-5 py-3 border-b border-border/30">
          {(Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG[ReactionType]][]).map(([type, config]) => (
            <button
              key={type}
              onClick={() => canInteract && toggleReaction(type)}
              disabled={!canInteract}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                myReaction === type ? 'bg-amber-500/15 border-amber-500/50 text-amber-600'
                : 'bg-muted/50 border-border/50 text-muted-foreground'
              } ${!canInteract ? 'opacity-50 cursor-default' : 'active:scale-95'}`}
            >
              <span>{config.emoji}</span>
              <span>{config.label}</span>
              {(counts[type] ?? 0) > 0 && (
                <span className="ml-0.5 text-xs opacity-70">{counts[type]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 max-h-[50vh]">
          {privacySetting === 'off' ? (
            <p className="text-sm text-muted-foreground text-center py-6">Comments are disabled for this top ten</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                {comment.commenter_avatar ? (
                  <img src={comment.commenter_avatar} alt={comment.commenter_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                    {comment.commenter_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">{comment.commenter_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-0.5">{comment.body}</p>
                  {(user?.id === comment.commenter_id || isOwnProfile) && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-xs text-muted-foreground/60 hover:text-destructive mt-1"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input — only shown when interaction is allowed */}
        {canInteract && privacySetting !== 'off' && (
          <div className="flex items-center gap-2 px-5 pt-3 border-t border-border/50"
            style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              placeholder="Add a comment..."
              maxLength={500}
              className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-sm outline-none border border-border/50 focus:border-amber-500/50 transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={!draft.trim()}
              className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
