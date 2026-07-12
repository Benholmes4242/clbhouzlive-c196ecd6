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
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.01em',
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
              marginTop: 3,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.82)',
              fontVariantNumeric: 'tabular-nums',
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
  const dim: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--hcp-t-60)',
    fontVariantNumeric: 'tabular-nums',
  };
  const strong: React.CSSProperties = {
    color: 'var(--hcp-t-100)',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  };
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
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {up ? '\u2191' : '\u2193'} {Math.abs(handicapDelta).toFixed(1)}{' '}
        <span
          style={{
            color: 'var(--hcp-t-60)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
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

      {/* Floating glass tray — overlaps the photo seam by 22px, holds the
          stats and consequence rows separated by a single internal hairline. */}
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
          {/* stats row */}
          <div style={{ display: 'flex', padding: '12px 14px', alignItems: 'flex-end' }}>
            {(
              [
                ['Score diff', diffDisplay, diffColor, 1.2, 22],
                ['Gross', gross != null ? String(gross) : '\u2014', 'var(--hcp-t-100)', 1, 17],
                [
                  'Stableford',
                  stableford != null ? String(stableford) : '\u2014',
                  'var(--hcp-t-100)',
                  1,
                  17,
                ],
              ] as const
            ).map(([label, value, color, flex, valueSize], i) => (
              <div
                key={label}
                style={{
                  flex,
                  borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  paddingLeft: i === 0 ? 0 : 14,
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
                    fontSize: valueSize,
                    fontWeight: 800,
                    color,
                    letterSpacing: '-0.01em',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* internal hairline */}
          <div
            style={{
              height: 1,
              background: 'var(--hcp-line, rgba(255,255,255,0.08))',
              margin: '0 14px',
            }}
          />

          {/* consequence row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 14px',
              minHeight: 44,
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
