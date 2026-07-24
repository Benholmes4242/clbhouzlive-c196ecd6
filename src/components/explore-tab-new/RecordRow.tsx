import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';

/**
 * RecordRow — The Record Book row (Phase 3.1).
 *
 * Inverts the StatRow hierarchy: the SCORE leads on the left, the course is
 * the primary line and the player drops to the subline with a small inline
 * avatar. Deliberately NOT a StatRow variant so the fourteen StatRow
 * consumers stay byte-identical.
 */

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const MUTED = 'rgba(15,23,42,0.45)';
const SUBLINE = '#64748B';
const HAIRLINE = '#E2E8F0';

interface Props {
  toPar: string;
  gross?: string;
  underPar?: boolean;
  statColor?: string;
  courseName: string;
  playerName: string;
  avatarUrl?: string | null;
  avatarUserId?: string | null;
  timestamp?: string | null;
  isLast?: boolean;
  onPress?: () => void;
}

export function RecordRow({
  toPar,
  gross,
  statColor,
  courseName,
  playerName,
  avatarUrl,
  avatarUserId,
  timestamp,
  isLast = false,
  onPress,
}: Props) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full text-left active:opacity-80 transition-opacity"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        minHeight: 56,
        padding: '8px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${HAIRLINE}`,
        cursor: onPress ? 'pointer' : 'default',
        fontFamily: FONT,
      }}
    >
      {/* Score-first column */}
      <div style={{ width: 46, flexShrink: 0, textAlign: 'center' }}>
        <div
          className="tabular-nums"
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: statColor ?? INK,
          }}
        >
          {toPar}
        </div>
        {gross ? (
          <div
            className="tabular-nums"
            style={{
              marginTop: 4,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: MUTED,
              lineHeight: 1,
            }}
          >
            {gross}
          </div>
        ) : null}
      </div>

      {/* Hairline divider */}
      <div style={{ width: 1, alignSelf: 'stretch', background: HAIRLINE, flexShrink: 0 }} />

      {/* Course-first identity */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: INK,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {courseName}
        </div>
        <div
          style={{
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
          }}
        >
          <SquircleAvatar
            size={15}
            srcCandidates={avatarUrl ? [avatarUrl] : []}
            alt={playerName}
            fallback={getInitialsFromName(playerName)}
            userId={avatarUserId ?? undefined}
            hairlineRing
          />

          <div
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: SUBLINE,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {playerName}
            {timestamp ? ` ${'\u00B7'} ${timestamp}` : ''}
          </div>
        </div>
      </div>
    </button>
  );
}

export default RecordRow;
