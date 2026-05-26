import React from 'react';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import type { WhsLastRound } from '@/lib/whs/types';

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const FALLBACK_GRADIENT =
  'linear-gradient(140deg, #2d3a2d 0%, #4a5d4a 25%, #6b7a5a 50%, #8a9670 72%, #c4a574 88%, #d4956b 100%)';

interface Verdict {
  tint: 'good' | 'bad' | 'neutral' | 'none';
  label: React.ReactNode;
}

/**
 * Map handicap_delta into a verdict for the bottom prose line.
 */
function verdictFromDelta(
  handicapDelta: number | null,
  viewMode: 'owner' | 'friend',
  ownerFirstName: string | null,
): Verdict {
  const possessive =
    viewMode === 'friend'
      ? ownerFirstName ? `${ownerFirstName}'s` : 'their'
      : 'your';
  const possessiveCap =
    viewMode === 'friend'
      ? ownerFirstName ? `${ownerFirstName}'s` : 'Their'
      : 'Your';
  if (handicapDelta == null) {
    return { tint: 'none', label: <>{possessiveCap} first round on record</> };
  }
  if (handicapDelta < 0) {
    return {
      tint: 'good',
      label: (
        <>
          <span style={{ color: 'var(--hcp-good-2)', fontWeight: 800 }}>
            ↓ {Math.abs(handicapDelta).toFixed(1)}
          </span>{' '}
          off {possessive} index
        </>
      ),
    };
  }
  if (handicapDelta > 0) {
    return {
      tint: 'bad',
      label: (
        <>
          <span style={{ color: 'var(--hcp-bad-2)', fontWeight: 800 }}>
            ↑ +{handicapDelta.toFixed(1)}
          </span>{' '}
          to {possessive} index
        </>
      ),
    };
  }
  return { tint: 'neutral', label: <>No change to {possessive} index</> };
}

/**
 * Compact "label + value" stat for the bottom-right of the hero card.
 */
const SecondaryStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 36 }}>
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--hcp-t-60)',
        textAlign: 'center',
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--hcp-t-100)',
        fontFeatureSettings: '"tnum" 1',
        textAlign: 'center',
      }}
    >
      {value}
    </span>
  </div>
);

interface Props {
  round: WhsLastRound;
  /** Human-readable time-ago string e.g. "2w ago" or "yesterday". */
  timeAgo: string;
  /** Callback when the card is tapped (opens RoundDetailSheet). */
  onClick: () => void;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const LastRoundHeroCard: React.FC<Props> = ({ round, timeAgo, onClick, viewMode = 'owner', ownerFirstName = null }) => {
  const courseName = round.course?.name ?? 'Unknown course';
  // Fetch hole-by-hole detail to compute par (mirrors CinemaFriendCard's approach).
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

  const isWorse = diff != null && diff > 0;
  const isBetter = diff != null && diff < 0;

  const verdict = verdictFromDelta(round.handicap_delta, viewMode, ownerFirstName);

  const diffDisplay = diff == null ? '—' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`;
  const diffColor = isWorse
    ? 'var(--hcp-bad-2)'
    : isBetter
      ? 'var(--hcp-good-2)'
      : 'var(--hcp-t-100)';

  const verdictTintGradient = isWorse
    ? 'linear-gradient(180deg, transparent 0%, rgba(220, 38, 38, 0.22) 70%, rgba(220, 38, 38, 0.34) 100%)'
    : isBetter
      ? 'linear-gradient(180deg, transparent 0%, rgba(34, 197, 94, 0.22) 70%, rgba(34, 197, 94, 0.32) 100%)'
      : 'none';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        position: 'relative',
        height: 280,
        margin: '0 16px',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#0F172A',
        border: '1px solid var(--hcp-line-2)',
        cursor: 'pointer',
        fontFamily: FONT,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Photo / fallback */}
      {round.course_thumbnail_image ? (
        <img
          src={round.course_thumbnail_image}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: FALLBACK_GRADIENT }} />
      )}

      {/* Editorial scrim — top fade (matches Suited HeroCard) */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(180deg, rgba(5,8,16,0.55) 0%, rgba(5,8,16,0) 100%)',
        }}
      />
      {/* Editorial scrim — bottom fade (matches Suited HeroCard) */}
      <div
        aria-hidden
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: 'linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.92) 90%)',
        }}
      />

      {/* Verdict tint sweep across the bottom */}
      {(isWorse || isBetter) && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '60%',
            background: verdictTintGradient,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Top eyebrow row */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '5px 10px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#fff',
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {timeAgo}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '5px 10px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#fff',
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          Scorecard ›
        </span>
      </div>

      {/* Bottom content */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#fff',
            textShadow: '0 1px 3px rgba(0,0,0,0.55)',
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {courseName}
        </div>

        {(par != null || slope != null) && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--hcp-t-60)',
            }}
          >
            {par != null && <>PAR {par}</>}
            {par != null && slope != null && <> · </>}
            {slope != null && <>SL {slope}</>}
          </div>
        )}

        {/* Hairline divider */}
        <div
          style={{
            height: 1,
            background: 'rgba(255,255,255,0.12)',
            marginTop: 4,
            marginBottom: 4,
          }}
        />

        {/* Score Diff hero + secondary stats row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--hcp-t-60)',
              }}
            >
              Score Diff
            </span>
            <span
              style={{
                fontSize: 48,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: diffColor,
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {diffDisplay}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            {gross != null && <SecondaryStat label="Gross" value={String(gross)} />}
            {stableford != null && (
              <SecondaryStat label="Stbl" value={String(stableford)} />
            )}
          </div>
        </div>

        {/* Verdict line */}
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--hcp-t-80)',
            letterSpacing: '-0.005em',
          }}
        >
          {verdict.label}
        </div>
      </div>
    </div>
  );
};

export default LastRoundHeroCard;
