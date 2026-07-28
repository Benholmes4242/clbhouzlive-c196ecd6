/**
 * PostRoundCard — the scorecard block for a Clubhouse post with a round
 * attached (C3). Renders ABOVE media, inside the dark feed card.
 *
 * Data comes from the batched `usePostRounds` map at page level — this
 * component NEVER fetches. Feat chips use the SHARED RoundFeatChips so the
 * feed can never drift from Discover.
 *
 * Analytics:
 *  - feed_round_card_shown  { has_holes, feat_count } — once per post, on
 *    first intersection.
 *  - feed_round_card_tapped { whs_score_id } — on tap through to the round.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { RoundFeatChips } from '@/components/explore-tab-new/RoundFeatChips';
import { deriveRoundFeats } from '@/lib/gam/roundFeats';
import type { PostRound } from '@/hooks/feed/usePostRounds';

const T100 = '#F8FAFC';
const T60 = 'rgba(248,250,252,0.65)';
const T40 = 'rgba(248,250,252,0.45)';
const LINE = 'rgba(248,250,252,0.10)';
const UNDER = '#34D399';
const OVER = '#F87171';
const AMBER = '#F7931E';

const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

const kickerStyle: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 800,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: T40,
  lineHeight: 1,
};

function fmtToPar(n: number | null): string {
  if (n == null) return '—';
  return n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`;
}

function toParColor(n: number | null): string {
  if (n == null || n === 0) return T60;
  return n < 0 ? UNDER : OVER;
}

/** Hole-by-hole shape strip. Colour reads relative to par. */
const HoleStrip: React.FC<{ holes: NonNullable<PostRound['holeShape']> }> = ({ holes }) => {
  const rel = holes.map((h) =>
    h.gross != null && h.par != null ? h.gross - h.par : null,
  );
  const max = Math.max(2, ...rel.map((r) => (r == null ? 0 : Math.abs(r))));
  return (
    <div
      aria-hidden
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
        height: 34,
        marginTop: 10,
      }}
    >
      {rel.map((r, i) => {
        const mag = r == null ? 0 : Math.abs(r);
        const h = r == null ? 3 : Math.max(3, Math.round((mag / max) * 30));
        const bg =
          r == null
            ? 'rgba(248,250,252,0.14)'
            : r < 0
              ? UNDER
              : r === 0
                ? 'rgba(248,250,252,0.32)'
                : OVER;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 0,
              height: h,
              borderRadius: 1.5,
              background: bg,
              opacity: r == null ? 1 : r === 0 ? 1 : 0.5 + Math.min(0.5, mag * 0.25),
            }}
          />
        );
      })}
    </div>
  );
};

interface Props {
  round: PostRound;
  onTap?: () => void;
}

export const PostRoundCard: React.FC<Props> = ({ round, onTap }) => {
  const { t } = useTranslation('common');
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

  const feats = useMemo(
    () =>
      deriveRoundFeats({
        birdies: round.birdies,
        eagles: round.eagles,
        albatrosses: round.albatrosses,
        holes_in_one: round.holesInOne,
        beat_par: round.beatPar,
        clean_card: round.cleanCard,
      }),
    [round],
  );

  const hasHoles = !!round.holeShape && round.holeShape.length > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el || firedRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || firedRef.current) return;
        firedRef.current = true;
        io.disconnect();
        analyticsEvents.track('feed_round_card_shown', {
          has_holes: hasHoles,
          feat_count: feats.length,
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasHoles, feats.length]);

  const gross = round.grossScore;
  const toPar =
    gross != null && round.coursePar != null ? gross - round.coursePar : null;

  // Under/over summary from the shape (silent when there is no hole detail).
  const summary = useMemo(() => {
    if (!round.holeShape) return null;
    let under = 0;
    let over = 0;
    for (const h of round.holeShape) {
      if (h.gross == null || h.par == null) continue;
      if (h.gross < h.par) under += 1;
      else if (h.gross > h.par) over += 1;
    }
    return { under, over };
  }, [round.holeShape]);

  const delta = round.deltaIndex;

  return (
    <div
      ref={ref}
      role={onTap ? 'button' : undefined}
      tabIndex={onTap ? 0 : undefined}
      onClick={
        onTap
          ? (e) => {
              e.stopPropagation();
              analyticsEvents.track('feed_round_card_tapped', {
                whs_score_id: round.whsScoreId,
              });
              onTap();
            }
          : undefined
      }
      style={{
        padding: '12px 14px 14px',
        borderTop: `0.5px solid ${LINE}`,
        borderBottom: `0.5px solid ${LINE}`,
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      <div style={kickerStyle}>{t('feed.roundCard.kicker')}</div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginTop: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontVariantNumeric: 'tabular-nums',
            fontSize: 44,
            lineHeight: 1,
            fontWeight: 700,
            color: T100,
            letterSpacing: '-0.02em',
          }}
        >
          {gross ?? '—'}
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontVariantNumeric: 'tabular-nums',
            fontSize: 18,
            fontWeight: 700,
            color: toParColor(toPar),
            lineHeight: 1,
          }}
        >
          {fmtToPar(toPar)}
        </span>
        {delta != null && delta !== 0 && (
          <span
            style={{
              fontFamily: MONO,
              fontVariantNumeric: 'tabular-nums',
              fontSize: 11,
              fontWeight: 700,
              color: delta < 0 ? AMBER : T60,
              lineHeight: 1,
            }}
          >
            {t('feed.roundCard.index')} {delta > 0 ? '+' : '−'}
            {Math.abs(delta).toFixed(1)}
          </span>
        )}
      </div>

      {feats.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
          <RoundFeatChips feats={feats} />
        </div>
      )}

      {hasHoles && <HoleStrip holes={round.holeShape as NonNullable<PostRound['holeShape']>} />}

      {summary && (summary.under > 0 || summary.over > 0) && (
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 8,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: T40,
          }}
        >
          <span style={{ color: UNDER }}>
            {summary.under} {t('feed.roundCard.under')}
          </span>
          <span style={{ color: OVER }}>
            {summary.over} {t('feed.roundCard.over')}
          </span>
        </div>
      )}
    </div>
  );
};

export default PostRoundCard;
