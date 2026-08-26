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
import { formatCurrencyUsdCompact } from '@/i18n/format';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { COLLEGE_RIVALRY_FALLBACK } from '../../utils/editorialFallbacks';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { getCollegeColor } from '../data/collegeColors';
import { liftedBrandAlpha } from '../../_shared/heroGradient';
import { Skeleton } from '@/components/ui/skeleton';

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

function SchoolSquircle({ size, logo, name, radius }: { size: number; logo: string | null; name: string; radius?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: `${radius ?? Math.round(size * 0.34)}px`,
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
          fontWeight: 700,
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
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data: collegeStats, isLoading } = useCollegeSeasonStats();
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
  // The list starts at 3: ranks 1 and 2 are the duel. __rank is the display
  // rank so the rows read 3/4/5 rather than 1/2/3.
  const chasers = useMemo(
    () => sorted.slice(2, 5).map((s, i) => ({ ...s, __rank: i + 3 })),
    [sorted],
  );

  // Captain-for-each: query all top-5 colleges in a single IN() call
  // (useFranchiseCaptains groups client-side by college and takes the
  // first row per college, which is the highest earner because the RPC
  // orders earnings DESC).
  const captainNames = useMemo(
    // Only the duel names captains now, so only the duel is queried.
    () => sorted.slice(0, 2).map((s) => s.normalized_name).filter((n): n is string => !!n),
    [sorted],
  );
  const { data: captainMap } = useFranchiseCaptains(captainNames);

  if (isLoading && (!leader || !chaser)) {
    return (
      <SectionShell
        eyebrow={t('overview.collegeFranchise.eyebrow')}
        linkLabel={t('overview.collegeFranchise.linkLabel')}
        onLinkClick={() => navigate('/tourhub?tab=college')}
      >
        <div style={{ padding: '0 16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton className="h-5 w-4/5 rounded" />
          <Skeleton className="h-4 w-11/12 rounded" />
        </div>
        <div style={{ padding: '0 16px 12px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Skeleton className="h-11 w-11" style={{ borderRadius: 15 }} />
            <Skeleton className="h-3.5 w-20 rounded" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.16em' }}>{t('overview.collegeFranchise.vs')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Skeleton className="h-11 w-11" style={{ borderRadius: 15 }} />
            <Skeleton className="h-3.5 w-20 rounded" />
          </div>
        </div>
        <div style={{ padding: '0 16px 4px' }}>
          <Skeleton className="h-[7px] w-full rounded" />
        </div>
        <div style={{ height: 1, background: V4.hairline, margin: '16px 16px 6px' }} />
        <div style={{ padding: '0 4px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 26px 1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: '11px 12px',
                borderBottom: i < 2 ? `0.5px solid ${V4.hairline}` : 'none',
              }}
            >
              <Skeleton className="h-3.5 w-3 rounded" />
              <Skeleton className="h-[34px] w-[34px]" style={{ borderRadius: 10 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Skeleton className="h-3.5 w-2/5 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
              <Skeleton className="h-3.5 w-14 rounded" />
            </div>
          ))}
        </div>
      </SectionShell>
    );
  }
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
  const editorialLine1 = editorial.data?.headline as string | undefined;
  const editorialLine2 = editorialLine1 ? ((editorial.data as any).headlineTwo ?? null) : null;
  const useEditorial = Boolean(editorialLine1);

  const goCollege = (norm: string) => navigate(`/tourhub/college-golf/${norm}`);

  return (
    <SectionShell
      eyebrow={t('overview.collegeFranchise.eyebrow')}
      linkLabel={t('overview.collegeFranchise.linkLabel')}
      onLinkClick={() => navigate('/tourhub?tab=college')}
    >
      {/* Editorial headline (19/700) + supporting line. The supporting line is
          arithmetic on figures already on screen — nothing new is queried — and
          it is only drawn beneath the TEMPLATED headline. When a
          championship_editorial_daily row supplies the headline (which may be
          human-edited), its own headlineTwo is used instead, so a generated
          line never sits under a hand-written one. */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 19, fontWeight: 700, color: V4.ink, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          {useEditorial ? (
            editorialLine1
          ) : !isClosingRace ? (
            <Trans t={t} i18nKey="overview.collegeFranchise.headlineRunaway" values={{ leader: leaderShort }} components={[<span key="a" />]} />
          ) : (
            <Trans t={t} i18nKey="overview.collegeFranchise.headlineClosing" values={{ leader: leaderShort, chaser: chaserShort }} components={[<span key="a" />]} />
          )}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: V4.inkMute, lineHeight: 1.45, marginTop: 4 }}>
          {useEditorial ? (
            editorialLine2
          ) : (
            <Trans
              t={t}
              i18nKey={isClosingRace ? 'overview.collegeFranchise.supportingClose' : 'overview.collegeFranchise.supportingWide'}
              values={{
                gap: formatCurrencyUsdCompact(gap),
                chaser: chaserShort,
                leader: leaderShort,
                count: leader.player_count,
              }}
              components={[
                <span key="g" style={{ color: V4.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }} />,
                <span key="n" style={{ color: V4.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }} />,
              ]}
            />
          )}
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
        <div style={{ fontSize: 11, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.16em' }}>{t('overview.collegeFranchise.vs')}</div>
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
          <span style={{ fontSize: 11.5, fontWeight: 700, color: leaderColor, fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrencyUsdCompact(leader.earnings_total)}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.14em', textAlign: 'center' }}>
            {t('overview.collegeFranchise.tugLabel')}
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: chaserColor, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
            {formatCurrencyUsdCompact(chaser.earnings_total)}
          </span>
        </div>
      </div>

      {/* HAIRLINE */}
      <div style={{ height: 1, background: V4.hairline, margin: '16px 16px 6px' }} />

      {/* AND BEHIND THEM — ranks 3-5 only. Ranks 1 and 2 ARE the duel above;
          repeating them made the section say two things twice. The rows also do
          NOT repeat the captain — that is what the duel is for. */}
      <div style={{ padding: '0 16px 6px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.14em' }}>
          {t('overview.collegeFranchise.behindThem')}
        </span>
      </div>
      <div style={{ padding: '0 4px' }}>
        {chasers.map((s, i) => {
          const media = mediaMap?.get(s.normalized_name);
          const name = displayName(s, media);
          const fname = fullName(s, media);
          const logo = getCollegeLogoUrl(fname);
          // Glow width tracks earnings as a share of the LEADER's, so the three
          // haloes step down together.
          const w = leader.earnings_total > 0 ? (s.earnings_total / leader.earnings_total) * 100 : 0;
          const glow = liftedBrandAlpha(getCollegeColor(s.normalized_name), 0.34);
          return (
            <button
              key={s.id}
              onClick={() => goCollege(s.normalized_name)}
              style={{
                position: 'relative',
                width: '100%',
                // overflow:hidden or the 22px blur bleeds past the panel edge.
                overflow: 'hidden',
                display: 'block',
                padding: '11px 12px',
                background: 'transparent',
                border: 'none',
                borderBottom: i < chasers.length - 1 ? `0.5px solid ${V4.hairline}` : 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {/* THIS IS ATMOSPHERE, NOT MEASUREMENT. The blurred brand halo has
                  no readable terminus by design — the gap is carried by the exact
                  $-figure on the right. Do NOT "fix" this into a bar. */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  left: `${w * 0.42}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${w * 0.9}%`,
                  height: 46,
                  borderRadius: 999,
                  background: glow,
                  filter: 'blur(22px)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: '14px 34px 1fr auto',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: V4.inkFaint, fontVariantNumeric: 'tabular-nums' }}>
                  {s.__rank}
                </span>
                <SchoolSquircle size={34} logo={logo} name={name} radius={10} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: V4.ink, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: V4.inkFaint, marginTop: 1, whiteSpace: 'nowrap' }}>
                    {t('overview.collegeFranchise.rowMeta', { count: s.player_count })}
                  </div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: V4.inkMute, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {formatCurrencyUsdCompact(s.earnings_total)}
                </span>
              </div>
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
  const { t } = useTranslation('tourhub');
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
              fontWeight: 700,
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
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: V4.inkMute, letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {captain.name}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            {t('overview.collegeFranchise.captainSuffix')}
          </span>
        </button>
      ) : (
        <div style={{ height: 20 }} />
      )}
    </div>
  );
}

export default CollegeFranchise;
