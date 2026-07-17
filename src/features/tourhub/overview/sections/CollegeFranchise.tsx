/**
 * CollegeFranchise — Overview Open Duel (Brief H12, Option A).
 *
 * Cardless dispatch layout: eyebrow + editorial headline, duel row
 * (rank 1 vs rank 2 by season alumni earnings), tug bar split at the
 * earnings ratio, then top-5 open standings rows.
 *
 * GLOBAL section — one franchise game across golf. Does NOT read the
 * tour picker.
 *
 * Ported from CollegeRivalry.tsx:
 *   - useCollegeSeasonStats  (earnings-sorted standings source)
 *   - useCollegeMediaMap     (short/full name + logos)
 *   - useFranchiseCaptains   (top-2 captains)
 *   - useDailyEditorial      (surface='college_rivalry' + fallback chain)
 *   - COLLEGE_RIVALRY_FALLBACK (headline/eyebrow fallback)
 *   - getCollegeLogoUrl      (school logo resolver; no per-school color
 *                             source exists — logo image IS the identity)
 *   - Row navigation: /tourhub/college-golf/{normalized_name}
 *   - "All" link:     /tourhub?tab=college
 *
 * Movement column: OMITTED. The live CollegeRivalry section has no
 * movement source (useCollegeWeeklyMovers exists but is unused there);
 * per brief, no column when live has none.
 */

import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';
import { useFranchiseCaptains } from '../../hooks/useFranchiseCaptains';
import { useDailyEditorial } from '@/hooks/championship/useDailyEditorial';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { COLLEGE_RIVALRY_FALLBACK } from '../../utils/editorialFallbacks';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { getCollegeColor } from '../data/collegeColors';

function displayName(stats: CollegeSeasonStats, media: CollegeMedia | undefined): string {
  return media?.short_name || media?.college_name || stats.normalized_name;
}
function fullName(stats: CollegeSeasonStats, media: CollegeMedia | undefined): string {
  return media?.college_name || stats.normalized_name;
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}
function abbreviate(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? `${parts[0][0]}. ${parts.slice(1).join(' ')}` : name;
}

function SchoolSquircle({ size, logo, name }: { size: number; logo: string | null; name: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: `${Math.round(size * 0.34)}px`,
        background: '#FFFFFF',
        border: `0.5px solid ${V4.hairline}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {logo ? (
        <img
          src={logo}
          alt={name}
          style={{ width: '78%', height: '78%', objectFit: 'contain' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            (e.currentTarget.parentElement!.querySelector('.mono') as HTMLElement | null)?.style.setProperty('display', 'flex');
          }}
        />
      ) : null}
      <span
        className="mono"
        style={{
          display: logo ? 'none' : 'flex',
          position: 'absolute',
          fontSize: Math.round(size * 0.34),
          fontWeight: 800,
          color: V4.inkSoft,
          letterSpacing: '-0.02em',
        }}
      >
        {initials(name)}
      </span>
    </div>
  );
}

export function CollegeFranchise() {
  const navigate = useNavigate();
  const { data: collegeStats } = useCollegeSeasonStats();
  const { data: mediaMap } = useCollegeMediaMap();
  const editorial = useDailyEditorial({
    surface: 'college_rivalry',
    seasonId: null,
    timeFilter: 'all_time',
  });

  const sorted = useMemo(() => {
    if (!collegeStats) return [];
    return [...collegeStats].sort((a, b) => b.earnings_total - a.earnings_total);
  }, [collegeStats]);

  const leader = sorted[0];
  const chaser = sorted[1];
  const top5 = sorted.slice(0, 5);

  // Captain-for-each: query all top-5 colleges in a single IN() call
  // (useFranchiseCaptains groups client-side by college and takes the
  // first row per college, which is the highest earner because the RPC
  // orders earnings DESC).
  const captainNames = useMemo(
    () => top5.map((s) => s.normalized_name).filter((n): n is string => !!n),
    [top5],
  );
  const { data: captainMap } = useFranchiseCaptains(captainNames);

  if (!leader || !chaser) return null;

  const leaderMedia = mediaMap?.get(leader.normalized_name);
  const chaserMedia = mediaMap?.get(chaser.normalized_name);
  const leaderShort = displayName(leader, leaderMedia);
  const chaserShort = displayName(chaser, chaserMedia);
  const leaderFull = fullName(leader, leaderMedia);
  const chaserFull = fullName(chaser, chaserMedia);
  const leaderLogo = getCollegeLogoUrl(leaderFull);
  const chaserLogo = getCollegeLogoUrl(chaserFull);
  const leaderCap = captainMap?.get(leader.normalized_name);
  const chaserCap = captainMap?.get(chaser.normalized_name);

  const gap = leader.earnings_total - chaser.earnings_total;
  const isClosingRace = gap > 0 && gap < 5_000_000;
  const total = leader.earnings_total + chaser.earnings_total;
  const leaderPct = total > 0 ? (leader.earnings_total / total) * 100 : 50;
  const chaserPct = 100 - leaderPct;
  const leaderColor = getCollegeColor(leader.normalized_name);
  const chaserColor = getCollegeColor(chaser.normalized_name);

  // Headline chain: DB > data-driven > generic fallback
  const headline = (() => {
    if (editorial.data?.headline) {
      const line2 = (editorial.data as any).headlineTwo ?? null;
      return { line1: editorial.data.headline as string, line2 };
    }
    if (!isClosingRace) return { line1: `${leaderShort} runs away with it.`, line2: null as string | null };
    return { line1: `${leaderShort} leads. ${chaserShort} is closing.`, line2: null as string | null };
  })();

  const goCollege = (norm: string) => navigate(`/tourhub/college-golf/${norm}`);

  return (
    <SectionShell
      eyebrow="COLLEGE FRANCHISE"
      linkLabel="All franchises"
      onLinkClick={() => navigate('/tourhub?tab=college')}
    >
      {/* Editorial headline */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
          {headline.line1}
          {headline.line2 ? <> <span style={{ color: V4.inkMute }}>{headline.line2}</span></> : null}
        </div>
      </div>

      {/* THE DUEL */}
      <div
        style={{
          padding: '0 16px 12px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <DuelSide
          name={leaderShort}
          logo={leaderLogo}
          fullName={leaderFull}
          color={leaderColor}
          captain={leaderCap ? { name: abbreviate(leaderCap.fullName), photoCandidates: getPlayerHeadshotCandidates(leaderCap.fullName, leaderCap.tourCode), id: leaderCap.playerId } : null}
          align="left"
          onClick={() => goCollege(leader.normalized_name)}
          onCaptainClick={leaderCap ? () => navigate(`/tourhub/player/${leaderCap.playerId}`) : undefined}
        />
        <div style={{ fontSize: 10, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.16em' }}>VS</div>
        <DuelSide
          name={chaserShort}
          logo={chaserLogo}
          fullName={chaserFull}
          color={chaserColor}
          captain={chaserCap ? { name: abbreviate(chaserCap.fullName), photoCandidates: getPlayerHeadshotCandidates(chaserCap.fullName, chaserCap.tourCode), id: chaserCap.playerId } : null}
          align="right"
          onClick={() => goCollege(chaser.normalized_name)}
          onCaptainClick={chaserCap ? () => navigate(`/tourhub/player/${chaserCap.playerId}`) : undefined}
        />
      </div>

      {/* TUG BAR */}
      <div style={{ padding: '0 16px 4px' }}>
        <div
          style={{
            height: 7,
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            background: V4.hairline,
          }}
        >
          <div style={{ width: `${leaderPct}%`, background: leaderColor }} />
          <div style={{ width: `${chaserPct}%`, background: chaserColor, opacity: 0.85 }} />
        </div>
        <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'baseline' }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: leaderColor, fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(leader.earnings_total)}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.14em', textAlign: 'center' }}>
            SEASON ALUMNI EARNINGS
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: chaserColor, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
            {formatCurrency(chaser.earnings_total)}
          </span>
        </div>
      </div>

      {/* HAIRLINE */}
      <div style={{ height: 1, background: V4.hairline, margin: '16px 16px 6px' }} />

      {/* TOP-5 STANDINGS */}
      <div style={{ padding: '0 4px' }}>
        {top5.map((s, i) => {
          const media = mediaMap?.get(s.normalized_name);
          const name = displayName(s, media);
          const fname = fullName(s, media);
          const logo = getCollegeLogoUrl(fname);
          const cap = captainMap?.get(s.normalized_name);
          const capName = cap ? abbreviate(cap.fullName) : null;
          return (
            <button
              key={s.id}
              onClick={() => goCollege(s.normalized_name)}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '28px 26px 1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: '11px 12px',
                background: 'transparent',
                border: 'none',
                borderBottom: i < top5.length - 1 ? `0.5px solid ${V4.hairline}` : 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: V4.inkFaint, fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
                {i + 1}
              </span>
              <SchoolSquircle size={26} logo={logo} name={name} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: V4.ink, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: V4.inkFaint, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.player_count} on tour{capName ? ` · ${capName} captains` : ''}
                </div>

              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: V4.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                {formatCurrency(s.earnings_total)}
              </span>
            </button>
          );
        })}
      </div>
    </SectionShell>
  );
}

function DuelSide({
  name,
  logo,
  fullName,
  color,
  captain,
  align,
  onClick,
  onCaptainClick,
}: {
  name: string;
  logo: string | null;
  fullName: string;
  color: string;
  captain: { name: string; photoCandidates: string[]; id: string } | null;
  align: 'left' | 'right';
  onClick: () => void;
  onCaptainClick?: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onClick={onClick}
        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
      >
        <div style={{ position: 'relative' }}>
          <SchoolSquircle size={44} logo={logo} name={fullName} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: V4.ink,
              letterSpacing: '-0.01em',
              textAlign: 'center',
              maxWidth: 130,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
          <div style={{ height: 2.5, width: 22, background: color, borderRadius: 1 }} />
        </div>
      </button>
      {captain ? (
        <button
          onClick={onCaptainClick}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: onCaptainClick ? 'pointer' : 'default',
            maxWidth: 160,
          }}
        >
          <SquircleAvatar
            size={16}
            srcCandidates={captain.photoCandidates}
            alt={captain.name}
            userId={captain.id}
            hairlineRing
            ringColor={LIGHT_HAIRLINE}
          />
          <span style={{ fontSize: 10, fontWeight: 600, color: V4.inkMute, letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {captain.name}
          </span>
          <span style={{ fontSize: 7.5, fontWeight: 800, color: V4.inkFaint, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            · CAPTAIN
          </span>
        </button>
      ) : (
        <div style={{ height: 20 }} />
      )}
    </div>
  );
}

export default CollegeFranchise;
