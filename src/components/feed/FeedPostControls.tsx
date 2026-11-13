/** Canonical feed action and comment doors. Defaults preserve ordinary posts;
 * editorial slots opt into their own insets, not independent engagement UI. */
import React from 'react';
import { MessageCircle, Share } from 'lucide-react';
import Pressable from '@/components/ui/Pressable';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FeedActorPicker } from './FeedActorPicker';
import { ReactionGlyph, reactionGlyph, AMBER } from '@/lib/reactionKind';
import { T100, T60 } from './feedTokens';
import { INK_FAINT } from '@/features/tourhub/_shared/tokens';
import { formatCountKilo } from '@/i18n/format';
import type { ActiveActor } from '@/types/actor';

const LikeGlyph = reactionGlyph('like');
export const FooterButton: React.FC<{
  icon: React.ComponentType<any>; label?: string; onClick: () => void;
  active?: boolean; activeColor?: string; glyph?: React.ReactNode;
  haptic?: 'none' | 'selection' | 'success' | 'warning'; ariaLabel?: string;
}> = ({ icon: Icon, label, onClick, active, activeColor, glyph, haptic = 'none', ariaLabel }) => (
  <Pressable as="button" variant="icon" aria-label={ariaLabel} haptic={haptic}
    onPress={(e) => { (e as React.MouseEvent).stopPropagation?.(); onClick(); }}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', padding: 0, color: active ? activeColor ?? T100 : T60, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}
    innerStyle={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    {glyph ?? <Icon size={21} strokeWidth={1.75} color={active ? activeColor ?? T100 : T60} fill={active ? activeColor ?? 'none' : 'none'} />}
    {label && <span>{label}</span>}
  </Pressable>
);
export function FeedPostActions({ actor, onActorChange, showActor = false, liked, likeCount, commentCount, onLike, onComment, onShare, padding, gap = 22 }: {
  actor: ActiveActor | null; onActorChange: (actor: ActiveActor) => void; showActor?: boolean;
  liked: boolean; likeCount: number; commentCount: number; onLike: () => void; onComment: () => void; onShare: () => void;
  padding: string; gap?: number;
}) {
  return <div style={{ display: 'flex', alignItems: 'center', gap, padding }}>
    {showActor && <FeedActorPicker value={actor} onChange={onActorChange} />}
    <div style={{ marginLeft: 'auto' }} />
    <FooterButton icon={LikeGlyph} label={likeCount > 0 ? formatCountKilo(likeCount) : undefined} active={liked} onClick={onLike} activeColor={AMBER} glyph={<ReactionGlyph reacted={liked} size={21} />} haptic={!liked ? 'selection' : 'none'} />
    <FooterButton icon={MessageCircle} label={commentCount > 0 ? formatCountKilo(commentCount) : undefined} onClick={onComment} />
    <FooterButton icon={Share} onClick={onShare} ariaLabel="Send" />
  </div>;
}
export function FeedAddComment({ currentUserId, actor, multipleActors, onActorChange, onComment, padding = '10px 16px 16px' }: {
  currentUserId?: string; actor: ActiveActor | null; multipleActors: boolean; onActorChange: (actor: ActiveActor) => void; onComment: () => void; padding?: string;
}) {
  if (!currentUserId) return null;
  const label = <span style={{ fontSize: 13.5, color: INK_FAINT }}>Add a comment…</span>;
  if (multipleActors) return <div data-feed-section="add-comment" style={{ display: 'flex', alignItems: 'center', gap: 10, padding, width: '100%' }}>
    <FeedActorPicker size={26} value={actor} onChange={onActorChange} />
    <button type="button" onClick={onComment} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>{label}</button>
  </div>;
  return <button type="button" data-feed-section="add-comment" onClick={onComment}
    style={{ display: 'flex', alignItems: 'center', gap: 10, padding, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
    <SquircleAvatar src={actor?.avatarUrl ?? null} alt={actor?.name ?? ''} userId={actor?.id ?? currentUserId} size={26} hairlineRing />{label}
  </button>;
}