import React from 'react';
import { ChevronRight, Flag } from 'lucide-react';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import type { WhsLastRound } from '@/lib/whs/types';

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

const Col: React.FC<{
  label: string;
  value: React.ReactNode;
  color: string;
  first?: boolean;
}> = ({ label, value, color, first }) => (
  <div
    style={{
      flex: 1,
      borderLeft: first ? 'none' : '1px solid var(--hcp-line)',
      paddingLeft: first ? 0 : 14,
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--hcp-t-40)',
        marginBottom: 3,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 22,
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
);

const Thumb: React.FC<{ src: string | null }> = ({ src }) => {
  const [failed, setFailed] = React.useState(false);
  const ok = !!src && !failed;
  if (!ok) {
    return (
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #1a3c2a 0%, #0f172a 100%)',
          border: '1px solid var(--hcp-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Flag size={20} color="#FFFFFF" strokeWidth={2.2} style={{ opacity: 0.5 }} />
      </div>
    );
  }
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        flexShrink: 0,
        overflow: 'hidden',
        border: '1px solid var(--hcp-line)',
        position: 'relative',
      }}
    >
      <img
        src={src!}
        alt=""
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
};

const LastRoundHeroCard: React.FC<Props> = ({
  round,
  onClick,
}) => {
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

  const diffDisplay = diff == null ? '—' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`;
  const diffColor =
    diff == null
      ? 'var(--hcp-t-100)'
      : diff > 0
        ? 'var(--hcp-bad)'
        : 'var(--hcp-good-2)';

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
        padding: 18,
        cursor: 'pointer',
        fontFamily: FONT,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
        <Thumb src={round.course_thumbnail_image ?? null} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: 'var(--hcp-t-100)',
              letterSpacing: '-0.01em',
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
                fontSize: 12,
                color: 'var(--hcp-t-40)',
                fontWeight: 600,
                marginTop: 3,
                letterSpacing: '0.04em',
              }}
            >
              {par != null && <>PAR {par}</>}
              {par != null && slope != null && <> · </>}
              {slope != null && <>SL {slope}</>}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        <Col label="Score Diff" value={diffDisplay} color={diffColor} first />
        <Col
          label="Gross"
          value={gross != null ? String(gross) : '—'}
          color="var(--hcp-t-100)"
        />
        <Col
          label="Stableford"
          value={stableford != null ? String(stableford) : '—'}
          color="var(--hcp-t-100)"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }}>
        {handicapDelta != null ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: handicapDelta > 0 ? 'var(--hcp-bad)' : 'var(--hcp-good-2)',
            }}
          >
            {handicapDelta > 0 ? '↑' : '↓'} {Math.abs(handicapDelta).toFixed(1)} to your index
          </div>
        ) : <span />}
        <ChevronRight size={20} color="var(--hcp-t-60)" strokeWidth={2.4} style={{ flexShrink: 0 }} />
      </div>
    </button>
  );
};

export default LastRoundHeroCard;
