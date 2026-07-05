import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import type { WhsLastRound } from '@/lib/whs/types';
import {
  COURSE_GRADIENT,
  COURSE_SCRIMS,
} from '@/features/tourhub/components/overview-v3/HybridHero.constants';

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  round: WhsLastRound;
  /** Human-readable time-ago string e.g. "2w ago" or "yesterday". */
  timeAgo: string;
  /** Callback when the card is tapped (opens RoundDetailSheet). */
  onClick: () => void;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const MEDIA_HEIGHT = 118;

/** Bottom scrim so the course name reads on any photo. */
const NAME_SCRIM =
  'linear-gradient(180deg, rgba(11,15,20,0) 30%, rgba(11,15,20,0.78) 100%)';

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

      {/* Course name + meta */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          color: '#fff',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
          }}
        >
          {course}
        </div>
        {meta && (
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.82)',
              textShadow: '0 1px 2px rgba(0,0,0,0.35)',
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

  const diffDisplay = diff == null ? '\u2014' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`;
  const diffColor =
    diff == null ? 'var(--hcp-t-100)' : diff > 0 ? 'var(--hcp-bad)' : 'var(--hcp-good-2)';

  // ---- consequence line ----
  // Order matters: non-counting first, then no-previous-index, then move/hold.
  const dim: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--hcp-t-60)' };
  const strong: React.CSSProperties = { color: 'var(--hcp-t-100)', fontWeight: 800 };
  let consequence: React.ReactNode;
  if (!round.is_counter) {
    consequence = <span style={dim}>No effect on your index</span>;
  } else if (handicapDelta == null || indexAfter == null) {
    consequence =
      indexAfter != null ? (
        <span style={dim}>
          index <span style={strong}>{indexAfter.toFixed(1)}</span>
        </span>
      ) : (
        <span />
      );
  } else if (Math.abs(handicapDelta) < 0.05) {
    consequence = (
      <span style={dim}>
        index holds at <span style={strong}>{indexAfter.toFixed(1)}</span>
      </span>
    );
  } else {
    const up = handicapDelta > 0;
    consequence = (
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: up ? 'var(--hcp-bad)' : 'var(--hcp-good-2)',
        }}
      >
        {up ? '\u2191' : '\u2193'} {Math.abs(handicapDelta).toFixed(1)}{' '}
        <span style={{ color: 'var(--hcp-t-60)', fontWeight: 700 }}>
          {'\u00b7'} index {up ? 'climbs' : 'drops'} to{' '}
          <span style={strong}>{indexAfter.toFixed(1)}</span>
        </span>
      </span>
    );
  }

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

      {/* stat strip at the seam */}
      <div
        style={{
          display: 'flex',
          background: 'var(--hcp-bg-2)',
          borderTop: '1px solid var(--hcp-line)',
          borderBottom: '1px solid var(--hcp-line)',
        }}
      >
        {(
          [
            ['Score diff', diffDisplay, diffColor],
            ['Gross', gross != null ? String(gross) : '\u2014', 'var(--hcp-t-100)'],
            [
              'Stableford',
              stableford != null ? String(stableford) : '\u2014',
              'var(--hcp-t-100)',
            ],
          ] as const
        ).map(([label, value, color], i) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderLeft: i === 0 ? 'none' : '1px solid var(--hcp-line)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--hcp-t-40)',
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 800,
                color,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* consequence line */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
        }}
      >
        {consequence}
        <ChevronRight
          size={18}
          color="var(--hcp-t-60)"
          strokeWidth={2.4}
          style={{ flexShrink: 0, marginLeft: 8 }}
        />
      </div>
    </button>
  );
};

export default LastRoundHeroCard;
