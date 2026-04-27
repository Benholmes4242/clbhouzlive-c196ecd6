/**
 * TopTenCardComments — Engagement bottom sheet for Top 10 carousel cards.
 *
 * Visual pattern mirrors the feed CommentsSheet (tabs, course pin link,
 * compose bar, Dispatch tokens) — but data layer remains Top-10-specific
 * (typed-enum reactions, top_ten_comments table).
 *
 * Tabs: Comments / Reactions
 *  - Comments: thread + replies + mention autocomplete + quick-reaction strip
 *  - Reactions: grouped reactor list (🔥 Top pick / 👀 Really? / ⛳ On my list)
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Send, MapPin, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useTopTenReactions, REACTION_CONFIG, ReactionType, TopTenReactor } from '@/hooks/useTopTenReactions';
import { useTopTenComments, TopTenComment } from '@/hooks/useTopTenComments';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/comments/MentionText';
import { useActiveActor } from '@/context/ActiveActorContext';
import { cn } from '@/lib/utils';

// ── Dispatch tokens (mirrored from CommentsSheet) ──
const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_SUBTLE = '#94A3B8';
const AMBER = '#F7931E';
const BORDER = 'rgba(15,23,42,0.07)';
const BG_SURFACE = '#F8FAFC';

type SheetTab = 'comments' | 'reactions';

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
  const navigate = useNavigate();
  const { activeActor } = useActiveActor();
  const { reactors, counts, myReaction, toggleReaction } = useTopTenReactions(targetUserId, courseId);
  const { comments, addComment, deleteComment, isAddingComment } = useTopTenComments(targetUserId, courseId);

  const [activeTab, setActiveTab] = useState<SheetTab>('comments');
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mention autocomplete
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<{ id: string; username: string; display_name: string; avatar: string | null }[]>([]);

  const canInteract = privacySetting !== 'off' && !isOwnProfile && !!user;
  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);

  // Reset to Comments tab on every open (matches feed sheet pattern)
  useEffect(() => {
    if (isOpen) setActiveTab('comments');
  }, [isOpen]);

  // Clear compose state when sheet closes (matches feed sheet behavior)
  useEffect(() => {
    if (!isOpen) {
      setDraft('');
      setReplyingTo(null);
      setMentionQuery(null);
      setMentionResults([]);
    }
  }, [isOpen]);

  // Mention autocomplete query
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

  const handleDraftChange = (val: string) => {
    setDraft(val);
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) setMentionQuery(atMatch[1]);
    else { setMentionQuery(null); setMentionResults([]); }
  };

  const selectMention = (username: string) => {
    setDraft(prev => prev.replace(/@\w*$/, `@${username} `));
    setMentionQuery(null);
    setMentionResults([]);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSubmit = () => {
    if (!draft.trim()) return;
    addComment({ body: draft, parentId: replyingTo?.id });
    setDraft('');
    setReplyingTo(null);
    setMentionQuery(null);
    setMentionResults([]);
  };

  // Group reactors by type for Reactions tab
  const reactorsByType = useMemo(() => {
    const byType: Record<ReactionType, TopTenReactor[]> = {
      agree: [], interesting: [], want_to_play: [],
    };
    reactors.forEach(r => byType[r.reaction_type]?.push(r));
    return byType;
  }, [reactors]);

  const renderComment = (comment: TopTenComment, isReply = false) => (
    <div key={comment.id} className={isReply ? 'flex gap-2.5' : 'flex gap-3'}>
      <div className="flex-shrink-0">
        <SquircleAvatar
          size={isReply ? 24 : 32}
          src={comment.commenter_avatar}
          alt={comment.commenter_name}
          fallback={comment.commenter_name.charAt(0).toUpperCase()}
          hideRing
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`${isReply ? 'text-xs' : 'text-sm'} font-semibold`} style={{ color: INK }}>
            {comment.commenter_name}
          </span>
          <span className={isReply ? 'text-[10px]' : 'text-xs'} style={{ color: INK_SUBTLE }}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <MentionText
          text={comment.body}
          className={`${isReply ? 'text-xs' : 'text-sm'} mt-0.5 block`}
          mentionClassName="font-semibold"
        />
        <div className="flex items-center gap-3 mt-1">
          {!isReply && canInteract && (
            <button
              onClick={() => setReplyingTo({ id: comment.id, name: comment.commenter_name })}
              className="text-xs transition-colors"
              style={{ color: INK_SUBTLE }}
            >
              Reply
            </button>
          )}
          {(user?.id === comment.commenter_id || isOwnProfile) && (
            <button
              onClick={() => deleteComment(comment.id)}
              className={isReply ? 'text-[10px]' : 'text-xs'}
              style={{ color: INK_SUBTLE }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderReactorRow = (r: TopTenReactor) => (
    <button
      key={r.id}
      type="button"
      onClick={() => {
        if (r.username) {
          navigate(`/profile/${r.username}`);
          onClose();
        }
      }}
      className="w-full px-5 py-3 flex items-center gap-3 active:bg-slate-100 bg-transparent border-0 text-left cursor-pointer"
    >
      <div className="flex-shrink-0">
        <SquircleAvatar
          size={36}
          src={r.avatar}
          alt={r.display_name}
          userId={r.reactor_id}
          fallback={r.display_name.charAt(0).toUpperCase()}
          hideRing
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold truncate" style={{ color: INK }}>{r.display_name}</div>
        {r.username && (
          <div className="text-xs truncate" style={{ color: INK_SUBTLE }}>@{r.username}</div>
        )}
      </div>
    </button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] p-0 border-0 flex flex-col"
        style={{ background: BG_SURFACE, maxHeight: '92dvh', minHeight: 'min(52dvh, 380px)' }}
        hideCloseButton
        aria-describedby={undefined}
      >
        <VisuallyHidden.Root>
          <SheetTitle>{courseName}</SheetTitle>
          <SheetDescription>Reactions and comments for {courseName}</SheetDescription>
        </VisuallyHidden.Root>

        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.12)' }} />
        </div>

        {/* Tab strip + close */}
        <div
          className="flex items-end justify-between px-4 pt-3 pb-0 shrink-0"
          style={{ borderBottom: `0.5px solid ${BORDER}` }}
        >
          <div className="flex items-end gap-6">
            {(['comments', 'reactions'] as const).map(tab => {
              const isActive = activeTab === tab;
              const count = tab === 'comments' ? totalComments : totalReactions;
              const label = tab === 'comments' ? 'Comments' : 'Reactions';
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="relative flex items-baseline gap-1.5 pt-[10px] pb-[14px] min-h-[44px] bg-transparent border-0 cursor-pointer"
                >
                  <span
                    className="whitespace-nowrap transition-colors duration-200"
                    style={{
                      fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em',
                      color: isActive ? INK : INK_SUBTLE, lineHeight: 1.2,
                    }}
                  >
                    {label}
                  </span>
                  {count > 0 && (
                    <span
                      className="transition-colors duration-200 tabular-nums"
                      style={{
                        fontSize: 13, fontWeight: 500,
                        color: isActive ? 'rgba(15,23,42,0.5)' : INK_SUBTLE,
                        lineHeight: 1.2,
                      }}
                    >
                      {count}
                    </span>
                  )}
                  <div
                    className="absolute bottom-0 transition-opacity duration-200"
                    style={{
                      left: '50%', transform: 'translateX(-50%)',
                      width: 24, height: 2, background: AMBER, borderRadius: 1,
                      opacity: isActive ? 1 : 0,
                    }}
                  />
                </button>
              );
            })}
          </div>
          <div className="flex items-center pb-[8px]">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-0 cursor-pointer"
              aria-label="Close"
            >
              <X size={16} style={{ color: INK_SUBTLE }} />
            </button>
          </div>
        </div>

        {/* Course pin link */}
        <button
          type="button"
          onClick={() => { navigate(`/courses/${courseId}`); onClose(); }}
          className="px-4 py-3 flex items-center gap-1.5 active:opacity-60 bg-transparent border-0 cursor-pointer text-left shrink-0"
          style={{ borderBottom: `0.5px solid ${BORDER}` }}
          aria-label={`View ${courseName}`}
        >
          <MapPin size={11} style={{ color: AMBER }} strokeWidth={2.25} />
          <span
            className="truncate"
            style={{
              fontSize: 11.5, color: INK_SUBTLE, maxWidth: 280,
              textDecoration: 'underline', textDecorationColor: 'rgba(15,23,42,0.15)',
              textUnderlineOffset: 2,
            }}
          >
            {courseName}
          </span>
        </button>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {activeTab === 'comments' ? (
            <div className="px-5 py-4 space-y-4">
              {privacySetting === 'off' ? (
                <p className="text-sm text-center py-12" style={{ color: INK_SUBTLE }}>
                  Comments are turned off for this Top 10
                </p>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex items-center gap-1 text-2xl mb-3" aria-hidden>
                    <span>⛳</span><span>🏌️‍♂️</span><span>💬</span>
                  </div>
                  <div className="text-[15px] font-semibold mb-1" style={{ color: INK }}>
                    No comments yet
                  </div>
                  <div className="text-[13px]" style={{ color: INK_SUBTLE }}>
                    Be the first to drop your thoughts
                  </div>
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="space-y-3">
                    {renderComment(comment)}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-11 space-y-3 border-l-2 pl-3" style={{ borderColor: BORDER }}>
                        {comment.replies.map(reply => renderComment(reply, true))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div>
              {reactors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="text-[15px] font-semibold mb-1" style={{ color: INK }}>
                    No reactions yet
                  </div>
                  <div className="text-[13px]" style={{ color: INK_SUBTLE }}>
                    Be the first to react
                  </div>
                </div>
              ) : (
                (['agree', 'interesting', 'want_to_play'] as ReactionType[]).map(type => {
                  const list = reactorsByType[type];
                  if (!list || list.length === 0) return null;
                  const config = REACTION_CONFIG[type];
                  return (
                    <div key={type}>
                      <div
                        className="flex items-center gap-2 px-5 py-2.5"
                        style={{ background: BG_SURFACE, borderBottom: `0.5px solid ${BORDER}` }}
                      >
                        <span className="text-base" aria-hidden>{config.emoji}</span>
                        <span
                          className="uppercase"
                          style={{ fontSize: 10, fontWeight: 700, color: INK_SOFT, letterSpacing: '0.14em' }}
                        >
                          {config.label}
                        </span>
                        <span
                          className="tabular-nums"
                          style={{ fontSize: 11, fontWeight: 500, color: INK_SUBTLE, marginLeft: 'auto' }}
                        >
                          {list.length}
                        </span>
                      </div>
                      <div style={{ background: '#ffffff' }}>
                        {list.map(renderReactorRow)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Compose bar — Comments tab only, when canInteract */}
        {activeTab === 'comments' && canInteract && (
          <div
            className="shrink-0 px-4 py-3"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
              borderTop: `0.5px solid ${BORDER}`,
              background: BG_SURFACE,
            }}
          >
            {/* Reply indicator */}
            {replyingTo && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]" style={{ color: INK_SOFT }}>
                  Replying to <span className="font-medium" style={{ color: INK }}>{replyingTo.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="min-h-[32px] min-w-[32px] flex items-center justify-center"
                  aria-label="Cancel reply"
                >
                  <X size={14} style={{ color: INK_SUBTLE }} />
                </button>
              </div>
            )}

            {/* Quick-reaction strip — Comments tab, empty input, no reply context */}
            {!replyingTo && draft.length === 0 && (
              <div className="flex items-center justify-center gap-2 mb-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
                {(['agree', 'interesting', 'want_to_play'] as ReactionType[]).map(type => {
                  const config = REACTION_CONFIG[type];
                  const isActive = myReaction === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleReaction(type)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-full border transition-colors active:scale-[0.97]',
                        isActive ? 'border-amber-300' : 'border-slate-200 active:bg-slate-100'
                      )}
                      style={{
                        background: isActive ? 'rgba(247,147,30,0.12)' : '#ffffff',
                        minHeight: 36,
                      }}
                      aria-pressed={isActive}
                    >
                      <span className="text-base" aria-hidden>{config.emoji}</span>
                      <span
                        style={{
                          fontSize: 12, fontWeight: 600,
                          color: isActive ? '#C97211' : INK_SOFT,
                        }}
                      >
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-2">
              <SquircleAvatar
                size={32}
                src={activeActor?.avatarUrl}
                alt={activeActor?.name || 'You'}
                fallback={activeActor?.name?.charAt(0) || '?'}
                hideRing
              />
              <div className="flex-1 min-w-0 relative">
                {/* Mention dropdown */}
                {mentionResults.length > 0 && (
                  <div
                    style={{
                      position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6,
                      borderRadius: 10, background: '#ffffff',
                      border: `1px solid ${BORDER}`,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      overflow: 'hidden', zIndex: 50,
                    }}
                  >
                    {mentionResults.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectMention(u.username)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[rgba(15,23,42,0.04)] bg-transparent border-0 cursor-pointer"
                      >
                        <SquircleAvatar
                          size={28}
                          src={u.avatar}
                          alt={u.display_name || u.username}
                          fallback={u.display_name?.charAt(0)?.toUpperCase() || '?'}
                          hideRing
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate" style={{ color: INK }}>
                            {u.display_name}
                          </span>
                          <span className="text-xs truncate" style={{ color: INK_SUBTLE }}>
                            @{u.username}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex', alignItems: 'flex-end', gap: 4,
                    borderRadius: 22, padding: '4px 6px 4px 14px',
                    background: '#ffffff', border: `0.5px solid ${BORDER}`,
                    minHeight: 42,
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                    }}
                    placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : 'Add a comment...'}
                    rows={1}
                    maxLength={500}
                    className="flex-1 min-w-0 bg-transparent outline-none resize-none placeholder:text-[color:#94A3B8]"
                    style={{
                      fontSize: 14, color: INK,
                      minHeight: 20, maxHeight: 120,
                      lineHeight: 1.4, padding: '8px 0',
                      fontFamily: 'inherit',
                    }}
                  />
                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const cursor = inputRef.current?.selectionStart ?? draft.length;
                        const next = draft.slice(0, cursor) + '😀' + draft.slice(cursor);
                        setDraft(next);
                        requestAnimationFrame(() => inputRef.current?.focus());
                      }}
                      style={{
                        width: 30, height: 30,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 0, cursor: 'pointer',
                        color: INK_SUBTLE, padding: 0,
                      }}
                      aria-label="Insert emoji"
                    >
                      <Smile size={18} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!draft.trim()}
                aria-label="Send comment"
                style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: draft.trim() ? AMBER : 'rgba(15,23,42,0.1)',
                  color: draft.trim() ? '#ffffff' : INK_SUBTLE,
                  border: 'none',
                  cursor: draft.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: draft.trim() ? '0 2px 6px rgba(247,147,30,0.35)' : 'none',
                  transition: 'background 150ms, box-shadow 150ms',
                }}
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Read-only notice when compose hidden */}
        {activeTab === 'comments' && !canInteract && (
          <div
            className="shrink-0 px-5 text-center"
            style={{
              paddingTop: 12,
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              borderTop: `0.5px solid ${BORDER}`,
              background: BG_SURFACE,
              fontSize: 12,
              color: INK_SUBTLE,
            }}
          >
            {privacySetting === 'off'
              ? 'Comments are turned off'
              : isOwnProfile
              ? "You can't react to your own picks"
              : 'Sign in to comment'}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
