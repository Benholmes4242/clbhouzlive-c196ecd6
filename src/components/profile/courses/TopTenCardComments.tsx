import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useTopTenReactions, REACTION_CONFIG, ReactionType } from '@/hooks/useTopTenReactions';
import { useTopTenComments, TopTenComment } from '@/hooks/useTopTenComments';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
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
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<{ id: string; username: string; display_name: string; avatar: string | null }[]>([]);

  const canInteract = privacySetting !== 'off' && !isOwnProfile && !!user;
  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);

  // Fetch matching users when mentionQuery changes
  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length < 1) {
      setMentionResults([]);
      return;
    }
    const search = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .ilike('username', `${mentionQuery}%`)
        .limit(5);
      setMentionResults((data ?? []).map((u: any) => ({
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar: u.profile_photo_url,
      })));
    };
    search();
  }, [mentionQuery]);

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDraft(val);
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  };

  const selectMention = (username: string) => {
    setDraft(prev => prev.replace(/@\w*$/, `@${username} `));
    setMentionQuery(null);
    setMentionResults([]);
  };

  const handleSubmit = () => {
    if (!draft.trim()) return;
    addComment({ body: draft, parentId: replyingTo?.id });
    setDraft('');
    setReplyingTo(null);
    setMentionQuery(null);
    setMentionResults([]);
  };

  const renderComment = (comment: TopTenComment, isReply = false) => (
    <div key={comment.id} className={isReply ? 'flex gap-2.5' : 'flex gap-3'}>
      {comment.commenter_avatar ? (
        <img
          src={comment.commenter_avatar}
          alt={comment.commenter_name}
          className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full object-cover flex-shrink-0`}
        />
      ) : (
        <div className={`${isReply ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'} rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground flex-shrink-0`}>
          {comment.commenter_name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`${isReply ? 'text-xs' : 'text-sm'} font-semibold text-foreground`}>{comment.commenter_name}</span>
          <span className={`${isReply ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className={`${isReply ? 'text-xs' : 'text-sm'} text-foreground/90 mt-0.5`}>{comment.body}</p>
        <div className="flex items-center gap-3 mt-1">
          {!isReply && canInteract && (
            <button
              onClick={() => setReplyingTo({ id: comment.id, name: comment.commenter_name })}
              className="text-xs text-muted-foreground/60 hover:text-amber-500 transition-colors"
            >
              Reply
            </button>
          )}
          {(user?.id === comment.commenter_id || isOwnProfile) && (
            <button
              onClick={() => deleteComment(comment.id)}
              className={`${isReply ? 'text-[10px]' : 'text-xs'} text-muted-foreground/60 hover:text-destructive transition-colors`}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-[20px] max-h-[92dvh] p-0 border-0 bg-card" hideCloseButton aria-describedby={undefined}>
        <VisuallyHidden.Root>
          <SheetTitle>{courseName}</SheetTitle>
          <SheetDescription>Reactions and comments for {courseName}</SheetDescription>
        </VisuallyHidden.Root>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">{courseName}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalReactions} reaction{totalReactions !== 1 ? 's' : ''} · {totalComments} comment{totalComments !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Reaction buttons — horizontally scrollable */}
        <div className="flex gap-2 px-5 py-3 border-b border-border/30 overflow-x-auto scrollbar-hide">
          {(Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG[ReactionType]][]).map(([type, config]) => (
            <button
              key={type}
              onClick={() => canInteract && toggleReaction(type)}
              disabled={!canInteract}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                myReaction === type
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-600'
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

        {/* Comments list — threaded */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 max-h-[50vh]">
          {privacySetting === 'off' ? (
            <p className="text-sm text-muted-foreground text-center py-12">Comments are disabled for this top ten</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="space-y-3">
                {renderComment(comment)}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-11 space-y-3 border-l-2 border-border/30 pl-3">
                    {comment.replies.map(reply => renderComment(reply, true))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Comment input */}
        {canInteract && privacySetting !== 'off' && (
          <div className="relative border-t border-border/50">
            {/* Reply context strip */}
            {replyingTo && (
              <div className="flex items-center justify-between px-5 py-2 bg-muted/30 border-b border-border/30">
                <span className="text-xs text-muted-foreground">
                  Replying to <span className="font-semibold text-foreground">{replyingTo.name}</span>
                </span>
                <button onClick={() => setReplyingTo(null)} className="text-muted-foreground">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Mention dropdown */}
            {mentionResults.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 bg-card border border-border rounded-t-xl shadow-lg max-h-[200px] overflow-y-auto z-10">
                {mentionResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => selectMention(u.username)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-left transition-colors"
                  >
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.display_name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {u.display_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{u.display_name}</div>
                      <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div
              className="flex items-center gap-2 px-5 pt-3"
              style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
            >
              <input
                value={draft}
                onChange={handleDraftChange}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : 'Add a comment...'}
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};