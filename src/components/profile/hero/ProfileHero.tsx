/**
 * ProfileHero — BRIEF_PROFILE_TOP_REBUILD.
 *
 * The personal profile top: the content-sized ProfileCoverBand, then ON CANVAS the
 * bio + meta row, the index block, the index chart and the form rail.
 * HeroShell is NOT used here any more — it stays as the
 * business profile's hero, untouched.
 *
 * Every figure reuses a hook the page (or another tab) already mounts:
 * useProfileRounds is shared with the Rounds tab via React Query; the
 * viewer's chip state is warm from the chrome header.
 * WAGR profile lines share the Ranking tab's server-gated summary/history;
 * handicap visibility never gates ranking visibility, and examples stay inert.
 */
import React from 'react';
import type { ProMember } from '@/features/pro-verification/proMembersCache';
import { useAmateurMembers } from '@/features/amateur-ranking/useAmateurMembers';
import { useAmateurSummary, useAmateurHistory } from '@/features/amateur-ranking/useAmateurRanking';
import { rankingMovement } from '@/features/amateur-ranking/rankingTabRules';
import { proKindLabel } from '@/features/pro-verification/proRules';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useWhsConnection, useHandicapTrend, useHandicapHistory } from '@/lib/whs/hooks';
import { useHandicapTrend12mo } from '@/hooks/useHandicapTrend12mo';
import { useHandicapChipState } from '@/lib/whs/useHandicapChipState';
import { useHandicapPercentile } from '@/lib/whs/usePercentile';
import { indexWindow } from '@/lib/whs/indexWindow';
import { lastFiveRounds } from '@/lib/whs/lastFive';
import { numberWord } from '@/lib/text/numbers';
import { useProfileRounds } from '@/components/profile/rounds/useProfileRounds';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { useClubCoverPhoto } from '@/components/profile/hooks/useClubCoverPhoto';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { HeroPill } from './HeroShell';
import { ProfileCoverBand } from './ProfileCoverBand';
import type { HeroIndexPoint } from './indexLine';
import { HeroHandicapDisplay } from './HeroHandicapDisplay';
import { HeroConnectExample } from './HeroConnectExample';
import { LinkedHandicapNotice } from './LinkedHandicapNotice';
import { HeadToHeadEntryRow } from '@/components/profile/handicap/whs/sections/compare/HeadToHeadEntryRow';

const GREEN = INDEX_DELTA.dark.improved;
const RED = INDEX_DELTA.dark.drifted;
const MS_PER_DAY = 86_400_000;
// useProfileClubs returns the sentinel id 'text-fallback' for a typed-in club
// name with no linked club; only a real UUID may reach the club photo read.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The event contract — not the layout. Every member stays even where a view omits the cell. */
export type HeroStat = 'index' | 'rounds' | 'courses' | 'rated' | 'friends' | 'followers';

interface Props {
  userId: string;
  viewerUserId?: string | null;
  displayName: string;
  /** HB5: optional actual cover-name anchor, owned by the profile page. */
  nameRef?: React.Ref<HTMLHeadingElement>;
  /** Page-owned creator read; hero remains independently renderable. */
  isCreator?: boolean;
  proMember?: ProMember | null;
  /** First name for the visitor verdict sentence. */
  ownerFirstName?: string | null;
  /** user_profiles.gender — 'male' | 'female'; anything else reads "their". */
  ownerGender?: string | null;
  avatarUrl?: string | null;
  region?: string | null;
  isSelf: boolean;
  /** Member asked not to be prompted to connect a handicap (the page passes
   *  user_profiles.hide_handicap_chip). Hides only the connect card. */
  hideConnectPrompt?: boolean;
  /** Resolved index (resolveDisplayHandicap) as the page already resolves it. */
  indexValue: number | null;
  friendsCount?: number | null;
  followersCount?: number | null;
  /** Viewer-scoped mutual count when an existing source supplies it; omitted otherwise. */
  mutualCount?: number | null;
  socialCountState?: 'ok' | 'loading' | 'error';
  coverUrl?: string | null;
  action?: React.ReactNode;
  /** Page-owned coach read; absent preserves the standalone hero. */
  coachLine?: React.ReactNode;
  onAvatarTap?: () => void;
  onStatTap: (stat: HeroStat) => void;
  /** Form tile tap: the page opens (or toggles) its RoundDetailSheet; never navigates. */
  onOpenRound?: (scoreId: string) => void;
  /** Bio (null when absent or gated). Measurement state is owned by the page. */
  bio?: string | null;
  bioRef?: React.Ref<HTMLDivElement>;
  bioExpanded?: boolean;
  bioOverflows?: boolean;
  onToggleBio?: () => void;
  /** First website only renders in the meta row; the page keeps the rest. */
  website?: string | null;
  websiteDisplay?: string | null;
  /** Visitor relationship actions (Follow, Add friend, Message). Grid sizes to the controls that render. */
  actionsRow?: React.ReactNode;
  /** Own profile: edit route for "Add your home club". */
  onEdit?: () => void;
  /** Own profile, not connected: the WHS connect flow. */
  onConnect?: () => void;
  /** HH3: page-owned eligibility (another member's profile, signed-in non-guest viewer). */
  showCompareEntry?: boolean;
  onOpenRanking?: () => void;
}

function formatIndex(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}

const MICRO: React.CSSProperties = { fontSize: 7.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' };

/** Whole months the window honestly covers, from the oldest point actually held. */
function windowMonths(oldestMs: number): number {
  return Math.max(1, Math.round((Date.now() - oldestMs) / (MS_PER_DAY * 30.4375)));
}

const ExternalGlyph = () => (
  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
    <path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>
);

/** Grid columns follow the controls that actually render — never a placeholder. */
const ActionsRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const n = React.Children.toArray(
    React.isValidElement(children) && children.type === React.Fragment ? (children.props as { children: React.ReactNode }).children : children,
  ).filter(Boolean).length;
  if (n === 0) return null;
  return <div style={{ marginTop: 11, display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 7 }}>{children}</div>;
};

/** Collapsed bio height in lines. Eight covers every bio the editor allows
 *  (BIO_MAX 300) at phone widths, so a within-limit bio reads in full with no
 *  control. The page still MEASURES overflow (ProfilePageV2 scrollHeight vs
 *  clientHeight), so a longer legacy bio saved before the limit keeps More. */
export const BIO_COLLAPSED_LINES = 8;

export const ProfileHero: React.FC<Props> = ({
  userId,
  viewerUserId,
  displayName,
  nameRef,
  isCreator = false,
  proMember,
  ownerFirstName,
  ownerGender,
  avatarUrl,
  region,
  isSelf,
  hideConnectPrompt = false,
  indexValue,
  friendsCount,
  followersCount,
  mutualCount,
  socialCountState = 'ok',
  coverUrl,
  action,
  coachLine,
  onAvatarTap,
  onStatTap,
  onOpenRound,
  bio,
  bioRef,
  bioExpanded = false,
  bioOverflows = false,
  onToggleBio,
  website,
  websiteDisplay,
  onEdit,
  onConnect,
  actionsRow,
  showCompareEntry = false,
  onOpenRanking,
}) => {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const { data: connection } = useWhsConnection(userId);
  const { data: trend } = useHandicapTrend(connection?.id);
  const trend12 = useHandicapTrend12mo(connection?.id);
  const { data: history } = useHandicapHistory(connection?.id, 'all');
  const { homeClub } = useProfileClubs(userId, viewerUserId ?? undefined);
  const { topTen } = useUserTopTenCourses(userId);
  const chip = useHandicapChipState(userId);
  const viewerChip = useHandicapChipState(!isSelf && viewerUserId ? viewerUserId : undefined);
  const { data: percentile } = useHandicapPercentile(isSelf ? userId : undefined);
  const roundsQ = useProfileRounds(userId);
  const { members: amateurs } = useAmateurMembers([userId]);
  const amateurSummary = useAmateurSummary(userId, !proMember);
  const amateurHistory = useAmateurHistory(userId, !proMember && amateurSummary.isSuccess && !!amateurSummary.data);
  const amateurRank = !proMember && amateurSummary.isSuccess ? amateurSummary.data?.rank : null;
  const amateurMovement = amateurHistory.isSuccess ? rankingMovement(amateurHistory.data ?? [])?.thisWeek : null;
  const rankingLine = amateurRank == null ? null : (
    <button type="button" aria-label={`World amateur ranking ${amateurRank}. Open the Ranking tab`} onClick={onOpenRanking}
      style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'left', width: '100%', display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap', marginTop: 10, fontSize: 12.5, fontWeight: 700, color: A.INK, cursor: 'pointer' }}>
      <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: A.INK }}>#{amateurRank}</span>
      <span style={{ ...MICRO, color: A.DIM }}>World amateur ranking</span>
      {amateurMovement && <span>
        <span style={{ color: amateurMovement.direction === 'up' ? GREEN : amateurMovement.direction === 'down' ? RED : A.MUTE }}>
          {amateurMovement.direction === 'same' ? 'no change' : `${amateurMovement.direction === 'up' ? '▲' : '▼'} ${amateurMovement.amount}`}
        </span>{' '}<span style={{ color: A.MUTE, fontWeight: 600 }}>this week</span>
      </span>}
      <span aria-hidden="true" style={{ marginLeft: 'auto', color: A.DIM, fontSize: 15 }}>›</span>
    </button>
  );

  // Fallback chain: own cover → home club course photo → #1 Top 10 course
  // image → flat fallback. The club photo is read only while no own cover exists,
  // and a hidden home club never supplies one (useProfileClubs owns that).
  const topCourse = React.useMemo(
    () => [...(topTen ?? [])].sort((a, b) => a.position - b.position)[0] ?? null,
    [topTen],
  );
  // A typed-in club name with no linked club comes back from useProfileClubs
  // with the sentinel id 'text-fallback'; passing it to the club photo read
  // would hit golf_courses.club_id (a uuid column) with a non-uuid and error
  // on every view. Only a real UUID reaches the hook; legacy clubs fall
  // through to the Top 10 photo or the flat fallback.
  const clubId = !coverUrl && homeClub && UUID_RE.test(homeClub.id) ? homeClub.id : null;
  const clubCover = useClubCoverPhoto(clubId);
  // While the club read is in flight, do not fall through to the Top 10
  // photo — show the flat fallback for that moment, then the club photo once it
  // resolves. A null result continues to the Top 10 photo as before.
  const cover = coverUrl || clubCover.coverPhoto || (clubId && clubCover.isLoading ? null : topCourse?.thumbnail_image || null);

  // BRIEF_ONE_INDEX_CHART: the shared 90-day window (lead edge, observations, trail edge).
  const win90 = React.useMemo(() => indexWindow(history, 90), [history]);
  const series = React.useMemo<HeroIndexPoint[]>(
    () => win90.pts.map((p) => ({ value: p.v, observed_at: new Date(p.ts).toISOString() })),
    [win90],
  );

  // The "lowest index" sentence uses the WHOLE history held, independent of the chart.
  const allHistory = React.useMemo(() => {
    const pts = (history ?? []).filter((p) => Number.isFinite(Number(p.handicap_index)));
    if (pts.length < 2) return null;
    return { min: Math.min(...pts.map((p) => Number(p.handicap_index))), oldestMs: new Date(pts[0].observed_at).getTime() };
  }, [history]);

  const shownIndex = indexValue ?? trend?.current ?? null;
  const subline = [homeClub?.name, region].filter(Boolean).join(' \u00B7 ');

  const tap = (stat: HeroStat) => () => {
    analyticsEvents.track('profile_hero_stat_tap', { stat });
    onStatTap(stat);
  };

  // The 90 DAYS figure reads the SAME net as the chart line (indexWindow), so they cannot disagree.
  const shortDelta = win90.pts.length >= 2 ? Math.round(win90.net * 10) / 10 : null;
  const shortDirection = win90.direction;

  const delta = trend12.delta;
  const improved = trend12.direction === 'down';
  const drifted = trend12.direction === 'up';

  const deltaLines: Array<{ key: string; delta: number; direction: 'down' | 'up' | 'flat'; window: string }> = [];
  if (shortDelta != null) deltaLines.push({ key: 'short', delta: shortDelta, direction: shortDirection, window: t('hero.window90d', '90 days') });
  if (delta != null) deltaLines.push({ key: 'long', delta, direction: improved ? 'down' : drifted ? 'up' : 'flat', window: t('hero.window12mo', '12 months') });

  const allMonths = allHistory ? windowMonths(allHistory.oldestMs) : null;
  const allPhrase = allMonths != null ? t('hero.windowMonths', { count: allMonths, defaultValue: allMonths === 1 ? '1 month' : `${allMonths} months` }) : '';
  // ── right-hand slot ──
  let slot: { value: string; label: string; color: string } | null = null;
  if (isSelf) {
    if (percentile && percentile.available) {
      const cohort = percentile.cohort_fallback ? 'all' : percentile.cohort;
      slot = {
        value: t('hero.percentileTop', { value: percentile.percentile_top, defaultValue: `Top ${percentile.percentile_top}%` }),
        label:
          cohort === 'men'
            ? t('hero.cohortMen', 'Of men on clbhouz')
            : cohort === 'women'
              ? t('hero.cohortWomen', 'Of women on clbhouz')
              : t('hero.cohortAll', 'Of golfers on clbhouz'),
        color: A.AMBER,
      };
    }
  } else if (viewerChip.connected && viewerChip.trend?.current != null && shownIndex != null) {
    const between = Math.round((Number(viewerChip.trend.current) - shownIndex) * 10) / 10;
    slot = { value: `${between > 0 ? '+' : between < 0 ? '\u2212' : ''}${Math.abs(between).toFixed(1)}`, label: t('hero.againstYou', 'Against you'), color: A.INK };
  }

  // ── verdict ──
  let verdict: React.ReactNode = null;
  if (isSelf) {
    if (shownIndex != null && allHistory && Math.round(shownIndex * 10) === Math.round(allHistory.min * 10)) {
      verdict = (
        <>
          {t('hero.verdictLowestPre', 'Your ')}
          <b style={{ color: A.INK, fontWeight: 700 }}>{t('hero.verdictLowest', { window: allPhrase, defaultValue: `lowest index in ${allPhrase}` })}</b>
          {t('hero.verdictLowestPost', '.')}
        </>
      );
    }
  } else if (improved && delta != null) {
    const pos = ownerGender === 'male' ? 'his' : ownerGender === 'female' ? 'her' : 'their';
    const first = ownerFirstName || displayName;
    const amt = Math.abs(delta).toFixed(1);
    verdict = (
      <>
        {t('hero.verdictTakenPre', { name: first, defaultValue: `${first} has taken ` })}
        <b style={{ color: A.INK, fontWeight: 700 }}>{t(`hero.verdictTaken_${pos}`, { delta: amt, defaultValue: `${amt} off ${pos} index` })}</b>
        {t('hero.verdictTakenPost', ' this year.')}
      </>
    );
  }

  // ── form strip ── (one shared last-five helper; the charts mark the same five)
  const rows = roundsQ.isSuccess ? roundsQ.data ?? [] : [];
  const { bars, byId, countingN, countingKnown, countingIds } = lastFiveRounds(rows, shownIndex);
  const tilesN = bars.length;
  const tilesWord = numberWord(tilesN, false);
  const showIndexBlocks = !proMember && chip.settled && chip.connected;
  const showConnectCard = !proMember && chip.settled && !chip.linked && isSelf && !hideConnectPrompt;
  const showLinkedNotice = !proMember && chip.settled && chip.linked && !chip.connected && isSelf;

  const socialFig = (n: number | null | undefined) => (socialCountState === 'ok' && n != null ? formatNumber(n) : null);
  const friendsFig = socialFig(friendsCount);
  const followersFig = socialFig(followersCount);
  const metaItem: React.CSSProperties = { padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase' };
  const hasMeta = !!website || friendsFig != null || followersFig != null || bioOverflows || bioExpanded;

  return (
    <>
      <ProfileCoverBand
        coverUrl={cover}
        onAvatarTap={onAvatarTap}
        displayName={displayName}
        nameRef={nameRef}
        isCreator={isCreator}
        isPro={!!proMember}
        isAmateur={amateurs.has(userId)}
        badgeUserId={userId}
        subline={subline || null}
        afterSubline={coachLine}
        onAddHomeClub={isSelf ? onEdit : undefined}
        addHomeClubLabel={t('hero.addHomeClub', 'Add your home club')}
        onAddCover={isSelf && !coverUrl ? () => navigate('/edit-profile?src=cover') : undefined}
        addCoverLabel={t('hero.addCover', '+ Add a cover')}
        action={action}
        avatar={<SquircleAvatar size={56} src={avatarUrl ?? undefined} alt={displayName} userId={userId} hideRing className="w-full h-full" />}
      />

      <div style={{ padding: '0 16px', background: A.CANVAS, fontFamily: 'inherit' }}>
        {bio ? (
          <div
            ref={bioRef}
            className="whitespace-pre-wrap"
            style={{
              marginTop: 12,
              fontSize: 13,
              lineHeight: 1.5,
              color: A.BODY,
              overflowWrap: 'anywhere',
              ...(bioExpanded ? {} : { display: '-webkit-box', WebkitLineClamp: BIO_COLLAPSED_LINES, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }),
            }}
          >
            {bio}
          </div>
        ) : null}

        {hasMeta && (
          <div style={{ marginTop: bio ? 7 : 12, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            {website && (
              <button type="button" onClick={() => openExternalUrl(website)} style={{ ...metaItem, color: A.INK, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ExternalGlyph />
                {websiteDisplay ?? website}
              </button>
            )}
            {friendsFig != null && (
              <button type="button" onClick={tap('friends')} style={{ ...metaItem, color: A.DIM, ...FIGS }}>
                <b style={{ color: A.MUTE, fontWeight: 700 }}>{friendsFig}</b> {t('hero.friends', 'Friends')}
              </button>
            )}
            {followersFig != null && (
              <button type="button" onClick={tap('followers')} style={{ ...metaItem, color: A.DIM, ...FIGS }}>
                <b style={{ color: A.MUTE, fontWeight: 700 }}>{followersFig}</b> {t('hero.followers', 'Followers')}
              </button>
            )}
            {!isSelf && mutualCount != null && (
              <span style={{ ...metaItem, cursor: 'default', color: A.DIM, ...FIGS }}>
                <b style={{ color: A.MUTE, fontWeight: 700 }}>{formatNumber(mutualCount)}</b> {t('hero.mutual', 'Mutual')}
              </span>
            )}
            {(bioOverflows || bioExpanded) && (
              <button type="button" onClick={onToggleBio} style={{ ...metaItem, marginLeft: 'auto', color: A.INK }}>
                {bioExpanded ? t('hero.less', 'Less') : t('hero.more', 'More')}
              </button>
            )}
          </div>
        )}

        {actionsRow && <ActionsRow>{actionsRow}</ActionsRow>}

        {proMember && <div className="pro-hero-descriptor"><b>{proKindLabel(proMember.pro_kind)}</b><span>{proMember.pro_kind === 'tour_pro' ? proMember.pro_tour : proMember.pro_club}</span></div>}

        {(showIndexBlocks || showConnectCard || showLinkedNotice) && <div style={{ height: 1, background: A.SOFT, marginTop: 14 }} />}

        {showIndexBlocks && (
          <HeroHandicapDisplay
            t={t} shownIndex={shownIndex} deltaLines={deltaLines} slot={slot}
            verdict={verdict} series={series} windowDays={90}
            bars={bars} byId={byId} countingKnown={countingKnown} countingN={countingN}
            countingIds={countingIds} tilesWord={tilesWord} isSelf={isSelf}
            ownerFirstName={ownerFirstName} onStatTap={onStatTap} tap={tap} onOpenRound={onOpenRound}
            afterIndex={rankingLine}
            afterChart={showCompareEntry && !isSelf && viewerUserId ? (
              <HeadToHeadEntryRow
                viewerUserId={viewerUserId}
                memberUserId={userId}
                memberFirstName={ownerFirstName || displayName.split(' ')[0] || displayName}
                viewerIndex={viewerChip.connected ? viewerChip.trend?.current ?? null : null}
                memberIndex={shownIndex}
              />
            ) : undefined}
          />
        )}

        {(!showIndexBlocks || shownIndex == null) && rankingLine && <div style={{ marginTop: 14 }}>{React.cloneElement(rankingLine, { style: { ...rankingLine.props.style, marginTop: 0 } })}</div>}

        {showConnectCard && <HeroConnectExample t={t} onConnect={onConnect} />}
        {showLinkedNotice && <LinkedHandicapNotice provider={chip.connection?.provider} />}


      </div>
    </>
  );
};

export { HeroPill };

export default ProfileHero;
