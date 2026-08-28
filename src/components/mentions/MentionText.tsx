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

  /**
   * Paragraph normalisation (see BRIEF_MENTIONTEXT_PARAGRAPHS):
   * - CRLF/CR folded to LF so \r\n authored text behaves identically.
   * - 3+ consecutive newlines collapse to exactly two (one paragraph break).
   * - Leading/trailing whitespace trimmed so stray returns at the end of a
   *   post cannot open a gap above the action rail.
   * Interior whitespace is deliberately untouched — it is the thing being fixed.
   */
  const normalised = React.useMemo(() => {
    const raw = text ?? '';
    return raw
      .replace(/\r\n?/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }, [text]);

  const segments = React.useMemo(() => parseMentionSegments(normalised), [normalised]);

  if (!segments.length) return null;

  return (
    // pre-wrap (not pre) preserves the member's newlines while still wrapping
    // long lines at the container width. Caller style wins on collision.
    <Tag className={className} style={{ whiteSpace: 'pre-wrap', ...style }}>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return <span key={i}>{seg.text}</span>;
        }
        const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
          e.stopPropagation();
          if (disableNavigation) return;
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
