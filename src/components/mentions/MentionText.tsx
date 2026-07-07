/**
 * MentionText — the ONE renderer for the canonical mention markup.
 *
 * - Bold-weight the mention (no colour change — bold is the signal).
 * - Tapping a mention navigates to the profile route (user or business).
 * - stopPropagation so tapping a mention inside a feed card does NOT
 *   open the underlying post.
 * - Zero DB queries at render time — every id + display name is inline.
 * - Malformed markup falls through as plain text (regex just doesn't match).
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parseMentionSegments } from '@/lib/mentions/format';
import { unlockBodyScroll } from '@/lib/bodyScrollLock';
import { cn } from '@/lib/utils';

interface Props {
  text: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  /** Override the default click behaviour (e.g. dismiss a sheet first). */
  onMentionTap?: (m: { entityType: 'user' | 'business'; entityId: string; display: string }) => void;
  /** When true, mention segments render as plain bold text (no tap handler). */
  disableNavigation?: boolean;
  /** Optional element override (defaults to <span>). */
  as?: 'span' | 'div' | 'p';
}

export const MentionText: React.FC<Props> = ({
  text,
  className,
  style,
  onMentionTap,
  disableNavigation,
  as: Tag = 'span',
}) => {
  const navigate = useNavigate();
  const segments = React.useMemo(() => parseMentionSegments(text ?? ''), [text]);

  if (!segments.length) return null;

  return (
    <Tag className={className} style={style}>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return <span key={i}>{seg.text}</span>;
        }
        const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
          e.stopPropagation();
          if (disableNavigation) return;
          // Proactively release any active body-scroll lock BEFORE navigating.
          // Hosts like CommentsSheet lock on mount and unlock in an unmount
          // cleanup that runs only after the sheet's exit animation — after
          // ScrollRestoration has already scrolled the profile to top. The
          // deferred unlock then calls window.scrollTo(0, sourceScrollY),
          // dropping the profile at the source page's offset. Unlocking now
          // restores source scroll first; ScrollRestoration then wins.
          // Reference-counted: subsequent no-op unlock on sheet unmount.
          unlockBodyScroll();
          if (onMentionTap) {
            onMentionTap({
              entityType: seg.entityType!,
              entityId: seg.entityId!,
              display: seg.text,
            });
            return;
          }
          if (seg.entityType === 'user') {
            navigate(`/profile/${seg.entityId}`);
          } else {
            navigate(`/business/${seg.entityId}`);
          }
        };
        return (
          <span
            key={i}
            role="link"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(e as unknown as React.MouseEvent);
              }
            }}
            className={cn(
              'font-bold cursor-pointer active:opacity-60 transition-opacity',
              'inline',
            )}
            data-mention-type={seg.entityType}
            data-mention-id={seg.entityId}
          >
            {seg.text}
          </span>
        );
      })}
    </Tag>
  );
};

export default MentionText;
