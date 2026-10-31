/**
 * ProfileHero — BRIEF_PROFILE_TOP_REBUILD.
 *
 * The personal profile top: the 176px ProfileCoverBand, then ON CANVAS the
 * bio + meta row, the index block, the index chart, the form strip and the
 * counter strip. HeroShell is NOT used here any more — it stays as the
 * business profile's hero, untouched.
 *
 * Every figure reuses a hook the page (or another tab) already mounts:
 * useProfileRounds is shared with the Rounds tab via React Query; the
 * viewer's chip state is warm from the chrome header.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useWhsConnection, useHandicapTrend, useHandicapHistory } from '@/lib/whs/hooks';
import { useHandicapTrend12mo } from '@/hooks/useHandicapTrend12mo';
import { useHandicapChipState } from '@/lib/whs/useHandicapChipState';
import { useHandicapPercentile } from '@/lib/whs/usePercentile';
import { countsTowardIndex } from '@/lib/whs/counting';
import { numberWord } from '@/lib/text/numbers';
import { formBars, formBarLowered, type FormScoreLike } from '@/features/profile-sheet-v2/sheetState';
import { isFullEighteen, useProfileRounds } from '@/components/profile/rounds/useProfileRounds';
import { useProfileAchievementFigures } from '@/hooks/gam/useProfileAchievementFigures';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { HeroPill } from './HeroShell';
import { ProfileCoverBand } from './ProfileCoverBand';
import { HeroHandicapDisplay } from './HeroHandicapDisplay';
import { HeroConnectExample } from './HeroConnectExample';
import { LinkedHandicapNotice } from './LinkedHandicapNotice';

const GREEN = INDEX_DELTA.dark.improved;
const RED = INDEX_DELTA.dark.drifted;
const MS_PER_DAY = 86_400_000;
/** The event contract — not the layout. Every member stays even where a view omits the cell. */
export type HeroStat = 'index' | 'rounds' | 'courses' | 'rated' | 'badges' | 'friends' | 'followers';

interface Props {
  userId: string;
  viewerUserId?: string | null;
  displayName: string;
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
  /** PLAIN ROUND TOTAL — see useMemberRoundTotal. Owner-only by construction. */
  roundsCount: number | null;
  ratedCount: number | null;
  roundsCountState?: 'ok' | 'loading' | 'error';
  ratedCountState?: 'ok' | 'loading' | 'error';
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

const CounterCell: React.FC<{ label: string; value: number | null; state?: 'ok' | 'loading' | 'error'; onTap: () => void }> = ({ label, value, state = 'ok', onTap }) => (
  <button
    type="button"
    onClick={onTap}
    disabled={state === 'error'}
    style={{ minWidth: 0, padding: 0, border: 0, background: 'transparent', textAlign: 'center', cursor: state === 'error' ? 'default' : 'pointer', fontFamily: SANS }}
  >
    <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: A.INK, ...FIGS }}>
      {state === 'error' ? '\u00A0' : value == null ? '\u2014' : formatNumber(value)}
    </div>
    <div style={{ marginTop: 4, ...MICRO, color: A.DIM }}>{label}</div>
  </button>
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
  ownerFirstName,
  ownerGender,
  avatarUrl,
  region,
  isSelf,
  hideConnectPrompt = false,
  indexValue,
  roundsCount,
  ratedCount,
  roundsCountState = 'ok',
  ratedCountState = 'ok',
  friendsCount,
  followersCount,
  mutualCount,
  socialCountState = 'ok',
  coverUrl,
  action,
  coachLine,
  onAvatarTap,
  onStatTap,
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
  const figures = useProfileAchievementFigures(userId);

  // Fallback chain unchanged: own cover → #1 Top 10 course image → flat canvas.
  const topCourse = React.useMemo(
    () => [...(topTen ?? [])].sort((a, b) => a.position - b.position)[0] ?? null,
    [topTen],
  );
  const cover = coverUrl || topCourse?.thumbnail_image || null;

  // Ninety-day rule: points inside 90 days, else the whole history.
  const { series, oldestMs, windowHeld } = React.useMemo(() => {
    if (!history || history.length < 2) return { series: [] as number[], oldestMs: null as number | null, windowHeld: false };
    const cutoff = Date.now() - 90 * MS_PER_DAY;
    const recent = history.filter((p) => new Date(p.observed_at).getTime() >= cutoff);
    const held = recent.length >= 2;
    const use = (held ? recent : history).filter((p) => Number.isFinite(Number(p.handicap_index)));
    return {
      series: use.map((p) => Number(p.handicap_index)),
      oldestMs: use.length ? new Date(use[0].observed_at).getTime() : null,
      windowHeld: held,
    };
  }, [history]);

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

  // 90-day window — unchanged thresholds (see BRIEF history in git).
  const SHORT_FLOOR = 0.2;
  const SHORT_TARGET_DAYS = 90;
  const SHORT_MIN_HISTORY_DAYS = 75;

  const shortDelta = React.useMemo<number | null>(() => {
    const current = indexValue ?? trend?.current ?? null;
    if (current == null || !history || history.length === 0) return null;
    const now = Date.now();
    const earliest = new Date(history[0].observed_at).getTime();
    if (now - earliest < SHORT_MIN_HISTORY_DAYS * MS_PER_DAY) return null;
    const target = now - SHORT_TARGET_DAYS * MS_PER_DAY;
    let closest = history[0];
    let best = Math.abs(new Date(closest.observed_at).getTime() - target);
    for (const pt of history) {
      const diff = Math.abs(new Date(pt.observed_at).getTime() - target);
      if (diff < best) {
        closest = pt;
        best = diff;
      }
    }
    const past = Number(closest.handicap_index);
    if (!Number.isFinite(past)) return null;
    return Math.round((current - past) * 10) / 10;
  }, [history, indexValue, trend]);

  const shortDirection: 'down' | 'up' | 'flat' =
    shortDelta == null ? 'flat' : shortDelta < -SHORT_FLOOR ? 'down' : shortDelta > SHORT_FLOOR ? 'up' : 'flat';

  const delta = trend12.delta;
  const improved = trend12.direction === 'down';
  const drifted = trend12.direction === 'up';

  const deltaLines: Array<{ key: string; delta: number; direction: 'down' | 'up' | 'flat'; window: string }> = [];
  if (shortDelta != null) deltaLines.push({ key: 'short', delta: shortDelta, direction: shortDirection, window: t('hero.window90d', '90 days') });
  if (delta != null) deltaLines.push({ key: 'long', delta, direction: improved ? 'down' : drifted ? 'up' : 'flat', window: t('hero.window12mo', '12 months') });

  // ── window naming (axis + verdict share one honest figure) ──
  const months = oldestMs != null ? Math.min(windowMonths(oldestMs), 12 * 100) : null;
  const windowDays = oldestMs != null ? Math.round((Date.now() - oldestMs) / MS_PER_DAY) : null;
  const windowPhrase = months != null ? t('hero.windowMonths', { count: months, defaultValue: months === 1 ? '1 month' : `${months} months` }) : '';
  const axisWindow = windowHeld ? t('hero.window90d', '90 days') : windowPhrase;
  const allMonths = allHistory ? windowMonths(allHistory.oldestMs) : null;
  const allPhrase = allMonths != null ? t('hero.windowMonths', { count: allMonths, defaultValue: allMonths === 1 ? '1 month' : `${allMonths} months` }) : '';
  // Chart colour = the 90-day direction (shortDirection), so it never disagrees with the 90 DAYS figure.
  const chartColor = shortDelta == null || shortDirection === 'flat' ? A.INK : shortDirection === 'down' ? GREEN : RED;
  const chartFillTop = chartColor === A.INK ? 0.16 : 0.28;

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

  // ── form strip ──
  const rows = roundsQ.isSuccess ? roundsQ.data ?? [] : [];
  // isFullEighteen FIRST: formBars only tests !is_nine_hole, and a NULL from a
  // missing whs join would slip through it.
  const fullRows = rows.filter(isFullEighteen);
  const byId = new Map(fullRows.map((r) => [r.whs_score_id, r]));
  const bars = formBars(
    fullRows.map((r): FormScoreLike => ({
      id: r.whs_score_id,
      play_date: r.play_date,
      handicap_differential: r.handicap_differential,
      handicap_index_at_time: r.handicap_index_at_time,
      is_nine_hole: !!r.is_nine_hole,
    })),
    shownIndex,
  ); // oldest first, as the sheet renders them
  const barRows = bars.map((b) => byId.get(b.id));
  const countingN = barRows.filter((r) => r && countsTowardIndex(r)).length;
  // Counting state is unknown when no tile carries is_counter at all.
  const countingKnown = barRows.some((r) => r?.is_counter != null);
  const loweredN = bars.filter(formBarLowered).length;
  const tilesN = bars.length;
  const tilesWord = numberWord(tilesN, false);
  // COURSES = distinct courses in POSTED ROUNDS (get_profile_rounds, gated by
  // can_view_handicap). It will NOT necessarily equal the Your Courses
  // analytics list (gam_user_courses: mapped, non-penalty) — do not "fix"
  // the two into agreement.
  const coursesCount = rows.length > 0 ? new Set(rows.map((r) => r.course_id).filter((c): c is string => !!c)).size : null;
  const badgesCount = figures.isFetched && figures.data ? figures.data.badges : null;

  const showIndexBlocks = chip.settled && chip.connected;
  const showConnectCard = chip.settled && !chip.linked && isSelf && !hideConnectPrompt;
  const showLinkedNotice = chip.settled && chip.linked && !chip.connected && isSelf;

  const counters: Array<{ key: HeroStat; label: string; value: number | null; state?: 'ok' | 'loading' | 'error' }> = [];
  if (isSelf) counters.push({ key: 'rounds', label: t('hero.rounds', 'Rounds'), value: roundsCount, state: roundsCountState });
  if (coursesCount != null) counters.push({ key: 'courses', label: t('hero.courses', 'Courses'), value: coursesCount });
  counters.push({ key: 'rated', label: t('hero.rated', 'Reviewed'), value: ratedCount, state: ratedCountState });
  if (badgesCount != null) counters.push({ key: 'badges', label: t('hero.badges', 'Badges'), value: badgesCount });

  const socialFig = (n: number | null | undefined) => (socialCountState === 'ok' && n != null ? formatNumber(n) : null);
  const friendsFig = socialFig(friendsCount);
  const followersFig = socialFig(followersCount);
  const metaItem: React.CSSProperties = { padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase' };
  const hasMeta = !!website || friendsFig != null || followersFig != null || bioOverflows || bioExpanded;

  return (
    <>
      <ProfileCoverBand
        coverUrl={cover}
        onAvatarTap={onAvatarTap}
        displayName={displayName}
        subline={subline || null}
        afterSubline={coachLine}
        onAddHomeClub={isSelf ? onEdit : undefined}
        addHomeClubLabel={t('hero.addHomeClub', 'Add your home club')}
        action={action}
        avatar={<SquircleAvatar size={56} src={avatarUrl ?? undefined} alt={displayName} userId={userId} hideRing className="w-full h-full" />}
      />

      <div style={{ padding: '0 16px', background: A.CANVAS, fontFamily: SANS }}>
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

        {(showIndexBlocks || showConnectCard || showLinkedNotice) && <div style={{ height: 1, background: A.SOFT, marginTop: 14 }} />}

        {showIndexBlocks && (
          <HeroHandicapDisplay
            t={t} shownIndex={shownIndex} deltaLines={deltaLines} slot={slot}
            verdict={verdict} series={series} chartColor={chartColor}
            chartFillTop={chartFillTop} axisWindow={axisWindow} windowDays={windowDays}
            bars={bars} byId={byId} countingKnown={countingKnown} countingN={countingN}
            loweredN={loweredN} tilesWord={tilesWord} isSelf={isSelf}
            ownerFirstName={ownerFirstName} onStatTap={onStatTap} tap={tap} navigate={navigate}
          />
        )}

        {showConnectCard && <HeroConnectExample t={t} onConnect={onConnect} />}
        {showLinkedNotice && <LinkedHandicapNotice provider={chip.connection?.provider} />}

        {counters.length > 0 && (
          <div
            style={{
              // 16 in both states: the panel ends on its action, and this row's
              // own border is the panel's bottom rule (16 below, per CP1 spec).
              marginTop: 16,
              paddingTop: 13,
              borderTop: `1px solid ${A.SOFT}`,
              display: 'grid',
              gridTemplateColumns: `repeat(${counters.length}, 1fr)`,
            }}
          >
            {counters.map((c) => (
              <CounterCell key={c.key} label={c.label} value={c.value} state={c.state} onTap={tap(c.key)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export { HeroPill };

export default ProfileHero;
