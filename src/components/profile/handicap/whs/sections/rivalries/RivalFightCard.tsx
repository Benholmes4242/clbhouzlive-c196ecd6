import React, { useMemo } from 'react';
import { Star, Crown } from 'lucide-react';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import { useRivalryDimension } from '@/lib/whs/utils/useRivalryDimension';
import { rivalKey } from '@/lib/whs/utils/rivalryTiering';
import { computeStreak } from './_shared/streakUtils';
import {
  pickHeadline,
  computeCrowns,
  emptyCrowns,
  type RivalCrowns,
} from './_shared/headlineEngine';


const FONT_GEIST =
  'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const GOLD  = '#FBBC2E';
const AMBER = '#F7931E';
const MUTED = 'var(--hcp-t-60)';

interface Props {
  rivalry: FriendRivalryHydrated;
  crowns?: RivalCrowns;
  rank: number;
  total: number;
  onTap?: () => void;
  youLabel?: string;
  youAvatar?: string | null;
}

export const RivalFightCard: React.FC<Props> = ({
  rivalry,
  crowns,
  rank,
  total,
  onTap,
  youLabel = 'YOU',
  youAvatar = null,
}) => {
  const key = rivalKey(rivalry);
  const [dimension, setDimension] = useRivalryDimension(key);
  const record =
    (dimension === 'gross' ? rivalry.gross_record : rivalry.stableford_record) ?? {
      wins: 0,
      losses: 0,
      ties: 0,
    };
  const results = rivalry.shared_round_results ?? [];
  const streakInfo = useMemo(() => computeStreak(results, dimension), [results, dimension]);
  const signedStreak =
    streakInfo == null ? 0 : streakInfo.who === 'you' ? streakInfo.count : -streakInfo.count;

  const safeCrowns: RivalCrowns = crowns ?? emptyCrowns(key ?? '');
  const crownInfos = useMemo(() => computeCrowns(safeCrowns), [safeCrowns]);

  const headline = useMemo(
    () => pickHeadline({
      crowns: safeCrowns,
      wins: record.wins,
      losses: record.losses,
      streak: signedStreak,
    }),
    [safeCrowns, record.wins, record.losses, signedStreak],
  );

  const rivalDisplayName = reformatFriendName(rivalry.rival_name ?? 'Unknown');

  // Hero photo fallback chain — venue isn't on the hydrated type yet, so we
  // fall back through the available portrait sources.
  const heroPhoto =
    (rivalry as any).most_played_venue_photo_url ??
    rivalry.rival_header_photo_url ??
    rivalry.rival_profile_photo_url ??
    rivalry.rival_thumbnail_url ??
    null;

  const isWinningOverall = record.wins > record.losses;
  const themLeads = record.losses > record.wins;
  const youColor = isWinningOverall ? GOLD : MUTED;
  const themColor = themLeads ? GOLD : MUTED;
  const accentColor = isWinningOverall ? GOLD : '#94A3B8';

  const tappable = typeof onTap === 'function';
  const Tag: any = tappable ? 'button' : 'div';

  // Bar fill % for a mirrored stat row (you side). Even → 50/50.
  const barYouPct = (c: typeof crownInfos[number]): number => {
    const y = c.you ?? 0;
    const t = c.them ?? 0;
    if (c.holder === 'even' || (y === 0 && t === 0)) return 50;
    // For 'lower is better' (gross), invert so the better (smaller) score fills more.
    if (c.compareKind === 'lower') {
      const total = y + t;
      return total === 0 ? 50 : Math.round((t / total) * 100); // smaller you → bigger fill
    }
    const total = y + t;
    return total === 0 ? 50 : Math.round((y / total) * 100);
  };

  const fmtCrownVal = (v: number | null) => (v == null ? '—' : String(v));

  return (
    <Tag
      {...(tappable ? { type: 'button' as const, onClick: onTap } : {})}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: 0,
        border: '1px solid var(--hcp-line)',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#FFFFFF',
        fontFamily: FONT_GEIST,
        cursor: tappable ? 'pointer' : 'default',
        color: 'var(--hcp-t-100)',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.08)',
      }}
    >
      {/* ===== HEADER BAND — dark, symmetrical you | score | them ===== */}
      <div
        style={{
          position: 'relative',
          padding: '14px 16px 16px',
          background: heroPhoto
            ? `linear-gradient(180deg, rgba(15,23,42,0.72), rgba(15,23,42,0.86)), url(${heroPhoto}) center/cover`
            : 'linear-gradient(135deg, #1a3c2a, #0f172a)',
          color: '#FFFFFF',
        }}
      >
        {/* Top row: RIVAL badge + rank */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px 4px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <Star size={10} strokeWidth={2.4} color="#FFFFFF" />
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.16em', color: '#FFFFFF' }}>RIVAL</span>
          </div>
          {total > 1 && (
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
              {rank} / {total}
            </span>
          )}
        </div>

        {/* KING-OF-X headline, centred */}
        <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: accentColor }}>
          {headline.title}
        </div>

        {/* you | big score | them */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          {/* YOU */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <SquircleAvatar size={46} hideRing src={youAvatar} alt={youLabel} fallback={youLabel.slice(0, 2)} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: youColor === GOLD ? GOLD : 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>{youLabel}</span>
          </div>

          {/* SCORE + toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 34, fontWeight: 800, color: youColor === GOLD ? GOLD : '#FFFFFF', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>{record.wins}</span>
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>–</span>
              <span style={{ fontSize: 34, fontWeight: 800, color: themColor === GOLD ? GOLD : 'rgba(255,255,255,0.78)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>{record.losses}</span>
            </div>
            {/* gross/stbl toggle */}
            <div
              role="group"
              aria-label="Scoring dimension"
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'inline-flex', padding: 2, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              {(['gross', 'stableford'] as const).map((opt) => {
                const active = dimension === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDimension(opt); }}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      background: active ? '#FFFFFF' : 'transparent',
                      color: active ? '#0F172A' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {opt === 'gross' ? 'Gross' : 'Stbl'}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)' }}>HEAD TO HEAD</span>
          </div>

          {/* THEM */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <SquircleAvatar
              size={46}
              hideRing
              src={pickAvatarSrc(rivalry.rival_thumbnail_url, rivalry.rival_profile_photo_url)}
              alt={rivalDisplayName}
              fallback={initials(rivalDisplayName)}
            />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: themColor === GOLD ? GOLD : 'rgba(255,255,255,0.85)', textTransform: 'uppercase', maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {firstName(rivalry.rival_name ?? 'Them')}
            </span>
          </div>
        </div>
      </div>

      {/* ===== MIRRORED STAT ROWS ===== */}
      <div>
        {crownInfos.map((c, i) => {
          const youPct = barYouPct(c);
          const youLeads = c.holder === 'you';
          const themLeadsStat = c.holder === 'them';
          return (
            <div
              key={c.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 16px',
                borderBottom: i < crownInfos.length - 1 ? '1px solid var(--hcp-line)' : 'none',
              }}
            >
              {/* you value */}
              <span style={{ width: 44, fontSize: 17, fontWeight: 800, color: youLeads ? AMBER : 'var(--hcp-t-100)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtCrownVal(c.you)}
              </span>
              {/* label + dominance bar */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--hcp-t-60)' }}>
                  {youLeads ? '♛ ' : ''}{c.label}
                </div>
                <div style={{ position: 'relative', height: 3, background: 'var(--hcp-bg-2)', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${youPct}%`, background: c.holder === 'even' ? 'var(--hcp-t-40)' : AMBER, borderRadius: 2 }} />
                </div>
              </div>
              {/* them value */}
              <span style={{ width: 44, textAlign: 'right', fontSize: 17, fontWeight: 800, color: themLeadsStat ? 'var(--hcp-t-100)' : 'var(--hcp-t-40)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtCrownVal(c.them)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ===== FOOTER — HCP · rounds ===== */}
      <div style={{ textAlign: 'center', padding: '10px 16px', fontSize: 11, color: 'var(--hcp-t-60)', background: 'var(--hcp-bg-2)', borderTop: '1px solid var(--hcp-line)' }}>
        HCP {fmtHcp(rivalry.rival_handicap)} · {rivalry.shared_rounds_count} shared rounds
      </div>
    </Tag>
  );
};

export default RivalFightCard;
