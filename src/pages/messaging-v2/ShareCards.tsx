/**
 * MS3 §4–§5 — the round and course cards inside a thread.
 *
 * ROUND CARD: 250 wide, #17171B, 1px rgba(255,255,255,0.12), radius 18 with
 *   the tail corner 6 on the sender's side, padding 12 14. Label "Round"
 *   9.5px/800 0.12em uppercase dim; shortCourseName 15px/600 4px below; gross
 *   26px/700 -0.03em with "{to_par} · {d MMM}" 13px mute beside it, 6px below;
 *   the hole strip 8px below in AC1's colours (activityHoleColor). Tap opens
 *   RoundDetailSheet for that whs_score_id.
 * COURSE CARD: 250 wide, same border and radius, photo 96px high (the course's
 *   existing thumbnail, else #1E1E23), then padding 10 14 12: shortCourseName
 *   15px/600, line 12.5px mute "{region}" plus " · Top 100 #{rank}" when it
 *   has a published rank. Tap → /courses/{course_id}.
 * No card data (read failed, round deleted, not the sender's, missing
 * course): the caller renders the body text in a normal bubble instead.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { activityHoleColor } from '@/features/activity-v2/components/ActivityRoundContent';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { useCourseShareCard } from '@/hooks/messaging/useCourseShareCard';
import type { RoundShareCard } from '@/hooks/messaging/useRoundShareCards';

const INK = '#F5F7F8';
const MUTE = 'rgba(248,250,252,0.62)';
const DIM = 'rgba(248,250,252,0.42)';
const CARD_BG = '#17171B';
const CARD_EDGE = 'rgba(255,255,255,0.12)';
const TILE = '#1E1E23';

/** Tail corner on the sender's side: outgoing flattens bottom-right. */
const cardRadius = (isOutgoing: boolean) =>
  isOutgoing ? '18px 18px 6px 18px' : '18px 18px 18px 6px';

function dayMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export const RoundShareCardView: React.FC<{
  card: RoundShareCard;
  isOutgoing: boolean;
  senderUserId: string | null;
}> = ({ card, isOutgoing, senderUserId }) => {
  const { t } = useTranslation('messaging');
  const [open, setOpen] = useState(false);
  const toPar = toParParts(card.to_par, 0)?.text ?? '';
  return (
    <>
      <button
        type="button"
        data-testid="round-share-card"
        onClick={() => setOpen(true)}
        className="active:opacity-80"
        style={{
          width: 250,
          background: CARD_BG,
          border: `1px solid ${CARD_EDGE}`,
          borderRadius: cardRadius(isOutgoing),
          padding: '12px 14px',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: DIM,
          }}
        >
          {t('share.roundLabel', { defaultValue: 'Round' })}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 15,
            fontWeight: 600,
            color: INK,
            marginTop: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {shortCourseName(card.course_name)}
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              color: INK,
            }}
          >
            {card.gross}
          </span>
          <span style={{ fontSize: 13, color: MUTE }}>
            {toPar} · {dayMonth(card.play_date)}
          </span>
        </span>
        {card.hole_to_par.length > 0 ? (
          <span
            data-testid="round-share-strip"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 8 }}
          >
            {card.hole_to_par.map((v, i) => (
              <i
                key={i}
                data-hole-value={v ?? 'missing'}
                style={{
                  width: 11,
                  height: 4,
                  borderRadius: 2,
                  flex: 'none',
                  background: activityHoleColor(v ?? null),
                }}
              />
            ))}
          </span>
        ) : null}
      </button>
      {open ? (
        <RoundDetailSheet
          open={open}
          onClose={() => setOpen(false)}
          scoreId={card.whs_score_id}
          profileUserId={senderUserId}
        />
      ) : null}
    </>
  );
};

export const CourseShareCardView: React.FC<{
  courseId: string;
  isOutgoing: boolean;
  /** Rendered instead while the course read is unsettled or comes back empty. */
  fallback: React.ReactNode;
}> = ({ courseId, isOutgoing, fallback }) => {
  const navigate = useNavigate();
  const { course, isLoading, isError, rank } = useCourseShareCard(courseId);
  if (isLoading || isError || !course) return <>{fallback}</>;
  const line = `${course.region ?? ''}${rank != null ? ` · Top 100 #${rank}` : ''}`.trim();
  return (
    <button
      type="button"
      data-testid="course-share-card"
      onClick={() => navigate(`/courses/${course.id}`)}
      className="active:opacity-80"
      style={{
        width: 250,
        background: CARD_BG,
        border: `1px solid ${CARD_EDGE}`,
        borderRadius: cardRadius(isOutgoing),
        overflow: 'hidden',
        padding: 0,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          display: 'block',
          height: 96,
          background: course.thumbnail_image
            ? `center/cover no-repeat url(${JSON.stringify(course.thumbnail_image)})`
            : TILE,
        }}
      />
      <span style={{ display: 'block', padding: '10px 14px 12px' }}>
        <span
          style={{
            display: 'block',
            fontSize: 15,
            fontWeight: 600,
            color: INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {shortCourseName(course.name)}
        </span>
        {line ? (
          <span style={{ display: 'block', fontSize: 12.5, color: MUTE, marginTop: 2 }}>
            {line}
          </span>
        ) : null}
      </span>
    </button>
  );
};
