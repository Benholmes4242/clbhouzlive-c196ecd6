/**
 * StoryRowEngagement (BRIEF_STORY_ENGAGEMENT §S4).
 *
 * READ-ONLY SOCIAL PROOF ON A LIST ROW, never a control. Tapping anywhere on a
 * story row opens the story: a tappable heart nested inside a full-row button
 * invites mis-taps, and this app already made that call deliberately when the
 * Around the World reaction heart was kept off the card photo.
 *
 * THE WHOLE RULE: the glyph ALWAYS renders, the count renders ONLY above zero.
 * A list of eight rows each reading "0 . 0" reads as a dead publication, which
 * is the opposite of the intent — while the bare glyph still says the story is
 * open for discussion.
 *
 * A GUEST sees likes and no comment count (§S3): the count would describe
 * something they cannot see.
 */
import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';

import type { StoryEngagement } from './useStoryEngagement';

/** On-dark amber: filled = you, exactly as it means app-wide. */
const AMBER_ON_DARK = '#FFB25E';
const WHITE_72 = 'rgba(255,255,255,0.72)';

interface Props {
  engagement: StoryEngagement | null | undefined;
  /** 'ink' = row in a panel; 'glass' = over photography. */
  tone?: 'ink' | 'glass';
  /** Faint row ink when tone is 'ink'; the row owns its own ramp. */
  inkColor?: string;
  size?: number;
}

export function StoryRowEngagement({
  engagement,
  tone = 'ink',
  inkColor = 'rgba(248,250,252,0.42)',
  size = 14,
}: Props) {
  const { user } = useSupabaseSession();
  const color = tone === 'glass' ? WHITE_72 : inkColor;

  const likeCount = engagement?.likeCount ?? 0;
  const commentCount = engagement?.commentCount ?? 0;
  const liked = engagement?.viewerLiked ?? false;

  const figure = (n: number, tint: string) =>
    n > 0 ? (
      <span
        className="tabular-nums"
        style={{ fontSize: 11.5, fontWeight: 700, color: tint, lineHeight: 1 }}
      >
        {n}
      </span>
    ) : null;

  return (
    <span
      aria-hidden
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: likeCount > 0 ? 4 : 0 }}>
        <Heart
          size={size}
          strokeWidth={2}
          color={liked ? AMBER_ON_DARK : color}
          fill={liked ? AMBER_ON_DARK : 'none'}
        />
        {figure(likeCount, liked ? AMBER_ON_DARK : color)}
      </span>
      {user && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: commentCount > 0 ? 4 : 0 }}>
          <MessageCircle size={size} strokeWidth={2} color={color} fill="none" />
          {figure(commentCount, color)}
        </span>
      )}
    </span>
  );
}

export default StoryRowEngagement;
