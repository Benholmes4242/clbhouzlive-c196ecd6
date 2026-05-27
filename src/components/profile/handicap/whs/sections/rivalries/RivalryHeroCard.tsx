import React, { useMemo } from 'react';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { firstName } from '@/lib/whs/utils/initials';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import {
  useRivalryDimension,
  type RivalryDimension,
} from '@/lib/whs/utils/useRivalryDimension';
import type { RivalryTier } from '@/lib/whs/utils/rivalryTiering';
import { rivalKey } from '@/lib/whs/utils/rivalryTiering';
import {
  RIVALRY_STATE_TOKENS,
  rivalryStateFor,
} from './_shared/rivalryTokens';
import HeroPortrait from './_shared/HeroPortrait';
import {
  computeStreak,
  calculateTaleOfTheTape,
  yearsSince,
} from './_shared/streakUtils';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const MINUS = '\u2212';

const TIER_BADGE_LABEL: Record<RivalryTier, string> = {
  archrival: '★ ARCHRIVAL',
  rival: '★ RIVAL',
  recent: 'RECENT',
};

interface Props {
  rivalry: FriendRivalryHydrated;
  tier: RivalryTier;
  rank: number;
  total: number;
  /** hero = sole-on-screen 240px portrait. mixed = 180px when in mixed-tier rail. */
  portraitVariant?: 'hero' | 'mixed';
  /** Controlled dimension. When omitted, card owns its own per-rival preference. */
  dimension?: RivalryDimension;
  onTap?: () => void;
}

export const RivalryHeroCard: React.FC<Props> = ({
  rivalry,
  tier,
  rank,
  total,
  portraitVariant = 'hero',
  dimension: dimensionProp,
  onTap,
}) => {
  const key = rivalKey(rivalry);
  const [ownDim, setOwnDim] = useRivalryDimension(key);
  const dimension: RivalryDimension = dimensionProp ?? ownDim;
  const showDimToggle = dimensionProp === undefined;

  const rivalDisplayName = reformatFriendName(rivalry.rival_name ?? 'Unknown');
  const rivalFirst = firstName(rivalDisplayName).toUpperCase();
  const record =
    (dimension === 'gross' ? rivalry.gross_record : rivalry.stableford_record) ?? {
      wins: 0,
      losses: 0,
      ties: 0,
    };
  const results = rivalry.shared_round_results ?? [];
  const sharedRounds = rivalry.shared_rounds_count ?? 0;
  const state = rivalryStateFor(record.wins, record.losses, sharedRounds);
  const tokens = RIVALRY_STATE_TOKENS[state];

  const streak = useMemo(() => computeStreak(results, dimension), [results, dimension]);
  const tale = useMemo(
    () => calculateTaleOfTheTape(results, dimension),
    [results, dimension],
  );
  const sinceYears = yearsSince(tale.earliestPlayDate);

  const portraitH = portraitVariant === 'hero' ? 240 : 180;
  const scoreFontSize = portraitVariant === 'hero' ? 40 : 32;

  const tierLabel = TIER_BADGE_LABEL[tier];

  const tappable = typeof onTap === 'function';
  const handleCardClick = tappable
    ? (e: React.MouseEvent) => {
        // Allow inner controls to stopPropagation
        if (e.defaultPrevented) return;
        onTap!();
      }
    : undefined;

  const Tag: any = tappable ? 'button' : 'div';

  return (
    <Tag
      {...(tappable ? { type: 'button' as const } : {})}
      onClick={handleCardClick}
      style={{
        flex: '0 0 100%',
        width: '100%',
        scrollSnapAlign: 'center',
        position: 'relative',
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: 18,
        overflow: 'hidden',
        background: tokens.cardSweep,
        boxShadow: tokens.outerGlow ?? '0 6px 18px rgba(15,23,42,0.18)',
        fontFamily: FONT_GEIST,
        color: 'var(--hcp-t-100)',
        padding: 0,
        textAlign: 'left',
        cursor: tappable ? 'pointer' : 'default',
        transition: 'transform 140ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseDown={tappable ? (e: React.MouseEvent) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
      } : undefined}
      onMouseUp={tappable ? (e: React.MouseEvent) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      } : undefined}
      onMouseLeave={tappable ? (e: React.MouseEvent) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      } : undefined}
    >

      {/* Hero portrait */}
      <div style={{ position: 'relative' }}>
        <HeroPortrait
          headerPhotoUrl={rivalry.rival_header_photo_url}
          profilePhotoUrl={rivalry.rival_profile_photo_url}
          mobileCrop={{
            x: rivalry.rival_mobile_crop_x,
            y: rivalry.rival_mobile_crop_y,
            width: rivalry.rival_mobile_crop_width,
            height: rivalry.rival_mobile_crop_height,
          }}
          height={portraitH}
        />

        {/* Tier badge + rank pill overlay */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            right: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '5px 10px',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.16em',
              color: tokens.tierBadgeColor,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: `1px solid ${tokens.tierBadgeBorder}`,
              borderRadius: 999,
            }}
          >
            {tierLabel}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 9px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              borderRadius: 999,
              fontFeatureSettings: '"tnum" 1',
            }}
          >
            {rank} / {total}
          </span>
        </div>

        {/* Name overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 18,
            right: 18,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: '#FFFFFF',
              textShadow: '0 2px 12px rgba(0,0,0,0.6)',
            }}
          >
            {rivalDisplayName}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.75)',
              textShadow: '0 1px 6px rgba(0,0,0,0.6)',
            }}
          >
            Hcp {fmtHcp(rivalry.rival_handicap)} · {sharedRounds} shared rounds
            {sinceYears > 0 ? ` · since ${new Date().getFullYear() - sinceYears}` : ''}
          </div>
        </div>
      </div>

      {/* Body: score block + toggle + form pills */}
      <div style={{ padding: '20px 18px 8px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <ScoreCol
            label="YOU"
            value={record.wins}
            color={tokens.selfNumColor}
            fontSize={scoreFontSize}
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.22em',
              color: 'var(--hcp-t-60)',
            }}
          >
            VS
          </div>
          <ScoreCol
            label={rivalFirst}
            value={record.losses}
            color={tokens.rivalNumColor}
            fontSize={scoreFontSize}
            align="right"
          />
        </div>

        {showDimToggle && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <DimToggle value={dimension} onChange={setOwnDim} />
          </div>
        )}

        {/* Form pills row */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: 'var(--hcp-t-60)',
              }}
            >
              LAST 5 ROUNDS
            </span>
            {streak && streak.count >= 2 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: streak.who === 'you' ? '#FBBC2E' : '#EF4444',
                }}
              >
                {streak.count} {streak.who === 'you' ? 'WINS' : 'LOSSES'} IN A ROW
              </span>
            )}
          </div>
          <FormPills results={results} dimension={dimension} tokens={tokens} />
        </div>
      </div>

      {/* Tale-of-the-tape strip */}
      {sharedRounds > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 18px',
            background: 'rgba(0,0,0,0.30)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11,
            color: 'var(--hcp-t-60)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <span aria-hidden style={{ fontSize: 12 }}>📍</span>
          {tale.strongestCourse && (
            <>
              <span>
                Strongest at{' '}
                <strong style={{ color: '#FFFFFF' }}>
                  {tale.strongestCourse.name} ({tale.strongestCourse.wins}-
                  {tale.strongestCourse.losses})
                </strong>
              </span>
              <span style={{ opacity: 0.4 }}>·</span>
            </>
          )}
          {tale.lastMet && (
            <>
              <span>
                Last met <strong style={{ color: '#FFFFFF' }}>{tale.lastMet}</strong>
              </span>
              {tale.averageEdge != null && <span style={{ opacity: 0.4 }}>·</span>}
            </>
          )}
          {tale.averageEdge != null && (
            <span>
              Avg edge{' '}
              <strong
                style={{
                  color: tale.averageEdge < 0 ? tokens.edgeColor : '#EF4444',
                }}
              >
                {tale.averageEdge < 0 ? MINUS : '+'}
                {Math.abs(tale.averageEdge).toFixed(1)} strokes
              </strong>
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px 14px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.10em',
          color: 'var(--hcp-t-60)',
          textTransform: 'uppercase',
        }}
      >
        <span>
          {sharedRounds} rounds{sinceYears > 0 ? ` · ${sinceYears}y rivalry` : ''}
        </span>
        <span style={{ color: '#F7931E', fontWeight: 800 }}>FULL HISTORY ›</span>
      </div>
    </button>
  );
};

export default RivalryHeroCard;

// ─── Sub-components ──────────────────────────────────────────────────────

const ScoreCol: React.FC<{
  label: string;
  value: number;
  color: string;
  fontSize: number;
  align?: 'left' | 'right';
}> = ({ label, value, color, fontSize, align = 'left' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'right' ? 'flex-end' : 'flex-start',
      gap: 2,
    }}
  >
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.14em',
        color: 'var(--hcp-t-60)',
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize,
        fontWeight: 800,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--hcp-t-60)',
        marginTop: 2,
      }}
    >
      wins
    </span>
  </div>
);

const DimToggle: React.FC<{
  value: RivalryDimension;
  onChange: (d: RivalryDimension) => void;
}> = ({ value, onChange }) => {
  const opt = (label: string, v: RivalryDimension) => {
    const active = value === v;
    return (
      <button
        key={v}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(v);
        }}
        style={{
          padding: '5px 14px',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.14em',
          border: 'none',
          borderRadius: 999,
          background: active ? '#F7931E' : 'transparent',
          color: active ? '#0F172A' : 'rgba(255,255,255,0.55)',
          cursor: 'pointer',
          transition: 'all 120ms ease',
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 2,
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.30)',
      }}
    >
      {opt('STBL', 'stableford')}
      {opt('GROSS', 'gross')}
    </div>
  );
};

const FormPills: React.FC<{
  results: FriendRivalryHydrated['shared_round_results'];
  dimension: RivalryDimension;
  tokens: ReturnType<() => typeof RIVALRY_STATE_TOKENS[keyof typeof RIVALRY_STATE_TOKENS]>;
}> = ({ results, dimension, tokens }) => {
  const sorted = [...(results ?? [])]
    .sort((a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime())
    .slice(0, 5);
  const pad: (typeof sorted[number] | null)[] = [...sorted];
  while (pad.length < 5) pad.push(null);

  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {pad.map((r, i) => {
        const outcome = r
          ? dimension === 'gross'
            ? r.gross_outcome
            : r.stableford_outcome
          : null;
        let bg: string = tokens.pillEmptyBg;
        let color = 'rgba(255,255,255,0.30)';
        let letter = '';
        if (outcome === 'W') {
          bg = tokens.pillWinGradient;
          color = '#0F172A';
          letter = 'W';
        } else if (outcome === 'L') {
          bg = tokens.pillLossBg;
          color = '#FFFFFF';
          letter = 'L';
        } else if (outcome === 'T') {
          bg = tokens.pillTieBg;
          color = '#FFFFFF';
          letter = 'T';
        }
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 26,
              borderRadius: 6,
              background: bg,
              color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
};
