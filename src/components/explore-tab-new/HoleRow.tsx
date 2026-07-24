import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';

/**
 * HoleRow — Eagles tab row (Phase 3.2).
 *
 * Leads with the hole number in an amber-ringed badge, keeps the player as
 * the primary line, and moves the avatar to the right at 26px. Standalone so
 * StatRow and its fourteen consumers are untouched.
 */

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const SUBLINE = '#64748B';
const HAIRLINE = '#E2E8F0';
const AMBER_RING = '#F7931E';
const AMBER_FILL = 'rgba(247,147,30,0.10)';
const AMBER_INK = '#9A5B00';

interface Props {
  holeNo: number | string;
  name: string;
  subline?: string;
  avatarUrl?: string | null;
  avatarUserId?: string | null;
  isLast?: boolean;
  onPress?: () => void;
}

export function HoleRow({
  holeNo,
  name,
  subline,
  avatarUrl,
  avatarUserId,
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
      <div
        className="tabular-nums"
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: 999,
          border: `2px solid ${AMBER_RING}`,
          background: AMBER_FILL,
          color: AMBER_INK,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '-0.02em',
        }}
      >
        {holeNo}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: INK,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
        {subline ? (
          <div
            style={{
              marginTop: 2,
              fontSize: 12.5,
              fontWeight: 500,
              color: SUBLINE,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subline}
          </div>
        ) : null}
      </div>

      <div style={{ flexShrink: 0 }}>
        <SquircleAvatar
          size={26}
          srcCandidates={avatarUrl ? [avatarUrl] : []}
          alt={name}
          fallback={getInitialsFromName(name)}
          userId={avatarUserId ?? undefined}
          hairlineRing
        />
      </div>
    </button>
  );
}

export default HoleRow;
