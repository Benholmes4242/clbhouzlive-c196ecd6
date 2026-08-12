import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import type { WhsLastRound } from '@/lib/whs/types';
import {
  COURSE_GRADIENT,
  COURSE_SCRIMS,
} from '@/features/tourhub/components/overview-v3/HybridHero.constants';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Dark LABEL: 7.5/700/0.16em at T40. */
const LABEL_STYLE: React.CSSProperties = {
  fontSize: 7.5,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--hcp-t-40)',
};

interface Props {
  round: WhsLastRound;
  /** Human-readable time-ago string e.g. "2w ago" or "yesterday". */
  timeAgo: string;
  /** Callback when the card is tapped (opens RoundDetailSheet). */
  onClick: () => void;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const MEDIA_HEIGHT = 132;

/** Two-stop scrim ramp so the course name reads on any photo. */
const NAME_SCRIM =
  'linear-gradient(180deg, rgba(15,18,25,0.02) 0%, rgba(15,18,25,0.20) 46%, rgba(15,18,25,0.62) 74%, rgba(15,18,25,0.86) 100%)';

const MediaBand: React.FC<{ src: string | null; course: string; meta: string | null }> = ({
  src,
  course,
  meta,
}) => {
  const [failed, setFailed] = React.useState(false);
  const showPhoto = !!src && !failed;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: MEDIA_HEIGHT,
        overflow: 'hidden',
        background: 'var(--hcp-bg-2)',
      }}
    >
      {showPhoto ? (
        <img
          src={src!}
          alt=""
          onError={() => setFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <>
          {/* Tours Overview hero fallback — single source of truth */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: COURSE_GRADIENT,
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: COURSE_SCRIMS,
            }}
          />
        </>
      )}

      {/* Name legibility scrim */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: NAME_SCRIM,
          pointerEvents: 'none',
        }}
      />

      {/* Masked blur bed — sits above the scrim, below the text. Gracefully
          degrades where backdrop-filter is unavailable (scrim alone carries
          legibility). */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 58,
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
          maskImage: 'linear-gradient(180deg, transparent 0%, black 55%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 55%)',
          pointerEvents: 'none',
        }}
      />

      {/* Course name + meta */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 30,
          color: '#fff',
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {course}
        </div>
        {meta && (
          <div
            style={{
              marginTop: 4,
              ...LABEL_STYLE,
              color: 'rgba(255,255,255,0.82)',
              fontVariantNumeric: 'tabular-nums lining',
            }}
          >
            {meta}
          </div>
        )}
      </div>
    </div>
  );
};

const LastRoundHeroCard: React.FC<Props> = ({ round, onClick }) => {
  const { t } = useTranslation(['common']);
  const courseName = round.course?.name ?? 'Unknown course';
  const { data: detail } = useFriendRoundDetail(round.id);

  const par = React.useMemo(() => {
    if (!detail?.holes?.length) return null;
    const played = detail.holes.filter((h) => h.played && h.par != null);
    if (!played.length) return null;
    return played.reduce((sum, h) => sum + (h.par ?? 0), 0);
  }, [detail]);

  const slope = round.slope_rating ?? null;
  const gross = round.adjusted_gross;
  const stableford = round.stableford_points;
  const diff = round.handicap_differential;
  const handicapDelta = round.handicap_delta ?? null;
  // handicap_index_at_time is the PRE-round index; the post-round
  // index is pre + delta (delta is snapshot-based post minus pre).
  const indexBefore = round.handicap_index_at_time ?? null;
  const indexAfter =
    indexBefore != null && handicapDelta != null
      ? Number((indexBefore + handicapDelta).toFixed(1))
      : indexBefore; // no delta: show the index we have

  const metaParts: string[] = [];
  if (par != null) metaParts.push(`PAR ${par}`);
  if (slope != null) metaParts.push(`SL ${slope}`);
  const meta = metaParts.length ? metaParts.join(' \u00b7 ') : null;

  // "Played to" — the same quantity the Next round card expresses as "beat n".
  // Absent renders NOTHING (no dash); the label still names the slot.
  const playedTo = diff == null ? null : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`;

  // Three-way, so exactly 0.0 can never fall into the good branch. The figure
  // is INK today (colour lives on the index move), but the neutral case must
  // exist so a later colour decision cannot reintroduce the fault.
  const diffColor =
    diff == null || diff === 0
      ? 'var(--hcp-t-100)'
      : diff > 0
        ? 'var(--hcp-t-100)'
        : 'var(--hcp-t-100)';

  // ---- consequence line ----
  // Built from handicap_delta ALWAYS. is_counter is a REASON appended to it,
  // never a substitute: a non-counting round still drops the oldest of the 20,
  // so the index can move while the new round did not count.
  const moved = handicapDelta != null && Math.abs(handicapDelta) >= 0.05;
  const rose = (handicapDelta ?? 0) > 0;

  const indexStatement: React.ReactNode =
    indexAfter == null ? null : moved && indexBefore != null ? (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
        <span style={LABEL_STYLE}>{t('common:handicap.lastRound.index')}</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--hcp-t-60)',
            fontVariantNumeric: 'tabular-nums lining',
          }}
        >
          {indexBefore.toFixed(1)}
        </span>
        <span aria-hidden style={{ ...LABEL_STYLE, letterSpacing: 0 }}>
          &rarr;
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: rose ? 'var(--hcp-bad)' : 'var(--hcp-good-2)',
            fontVariantNumeric: 'tabular-nums lining',
          }}
        >
          {indexAfter.toFixed(1)}
        </span>
      </span>
    ) : (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
        <span style={LABEL_STYLE}>{t('common:handicap.lastRound.indexHeldAt')}</span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            fontVariantNumeric: 'tabular-nums lining',
          }}
        >
          {indexAfter.toFixed(1)}
        </span>
      </span>
    );

  const consequence =
    indexStatement == null ? (
      <span />
    ) : (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        {indexStatement}
        {!round.is_counter && (
          <span style={{ ...LABEL_STYLE, color: 'var(--hcp-t-40)' }}>
            {'\u00b7'} {t('common:handicap.lastRound.notBest8')}
          </span>
        )}
      </span>
    );

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: 'calc(100% - 32px)',
        margin: '0 16px',
        textAlign: 'left',
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: FONT,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <MediaBand src={round.course_thumbnail_image ?? null} course={courseName} meta={meta} />

      {/* Floating glass tray — overlaps the photo seam by 22px, holds the
          stats and consequence rows separated by whitespace only. */}
      <div style={{ padding: '0 10px 10px', marginTop: -22 }}>
        <div
          style={{
            position: 'relative',
            borderRadius: 13,
            background: 'rgba(32,36,46,0.94)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            overflow: 'hidden',
          }}
        >
          {/* stats row — equal columns, one figure size, no internal rules.
              An absent value renders NO figure; the fixed 22px slot keeps the
              cells aligned. */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
              padding: '12px 14px',
            }}
          >
            {(
              [
                [t('common:handicap.lastRound.playedTo'), playedTo, diffColor],
                [
                  t('common:handicap.lastRound.gross'),
                  gross != null ? String(gross) : null,
                  'var(--hcp-t-100)',
                ],
                [
                  t('common:handicap.lastRound.stableford'),
                  stableford != null ? String(stableford) : null,
                  'var(--hcp-t-100)',
                ],
              ] as const
            ).map(([label, value, color]) => (
              <div key={label} style={{ minWidth: 0 }}>
                <div style={{ ...LABEL_STYLE, marginBottom: 5 }}>{label}</div>
                <div
                  style={{
                    height: 22,
                    display: 'flex',
                    alignItems: 'flex-end',
                    fontSize: 21,
                    fontWeight: 700,
                    color,
                    letterSpacing: '-0.04em',
                    fontVariantNumeric: 'tabular-nums lining',
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* consequence row — separated on whitespace, no rule in the tray */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 14px 12px',
              marginTop: 16,
            }}
          >

            {consequence}
            <ChevronRight
              size={18}
              color="rgba(242,244,247,0.38)"
              strokeWidth={2.4}
              style={{ flexShrink: 0, marginLeft: 8 }}
            />
          </div>
        </div>
      </div>
    </button>
  );
};

export default LastRoundHeroCard;
