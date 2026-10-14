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
import { formBars, formBarLowered, fmtSigned, type FormScoreLike } from '@/features/profile-sheet-v2/sheetState';
import { isFullEighteen, useProfileRounds } from '@/components/profile/rounds/useProfileRounds';
import { useProfileAchievementFigures } from '@/hooks/gam/useProfileAchievementFigures';
import { useProfileClubs } from '@/components/profile/hooks/useProfileClubs';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { IndexMovementTriangle } from '@/components/explore-tab-new/friendRoundParts';
import { HeroPill, W_40 } from './HeroShell';
import { ProfileCoverBand } from './ProfileCoverBand';

const GREEN = INDEX_DELTA.dark.improved;
const RED = INDEX_DELTA.dark.drifted;
const MS_PER_DAY = 86_400_000;
const AXIS_INK = 'rgba(248,250,252,0.30)';
const LOW_LINE = 'rgba(255,255,255,0.14)';
const MARKER_HALO = '0 0 0 3px rgba(10,10,12,0.9)';
const TILE_GROUND = 'rgba(255,255,255,0.02)';
const ON_AMBER = '#0A0A0C';

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

const KICK: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM };
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

const IndexChart: React.FC<{ points: number[]; color: string; fillTop: number; axisLeft: string; axisRight: string; lowLabel: string; onTap: () => void }> = ({ points, color, fillTop, axisLeft, axisRight, lowLabel, onTap }) => {
  const gid = React.useId().replace(/:/g, '');
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min;
  const yOf = (v: number) => (span === 0 ? 8 : 8 + ((max - v) / span) * 42);
  const n = points.length;
  const d = points.map((p, i) => `${((i / (n - 1)) * 361).toFixed(1)},${yOf(p).toFixed(1)}`).join(' ');
  const lowY = yOf(min);
  const lastY = yOf(points[n - 1]);
  return (
    <button type="button" onClick={onTap} style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: SANS }}>
      <div style={{ marginTop: 12, height: 64, position: 'relative' }}>
        <svg width="100%" height={64} viewBox="0 0 361 64" preserveAspectRatio="none" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`hcpfill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={fillTop} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={`0,64 ${d} 361,64`} fill={`url(#hcpfill-${gid})`} stroke="none" />
          <line x1={0} y1={lowY} x2={361} y2={lowY} stroke={LOW_LINE} strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <polyline points={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <span style={{ position: 'absolute', left: 0, top: lowY, transform: 'translateY(-50%)', ...MICRO, color: A.DIM, background: A.CANVAS, paddingRight: 6, ...FIGS }}>
          {lowLabel}
        </span>
        <span aria-hidden style={{ position: 'absolute', right: -3, top: lastY, marginTop: -3.5, width: 7, height: 7, borderRadius: 999, background: color, boxShadow: MARKER_HALO }} />
      </div>
      <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between', ...MICRO, color: AXIS_INK }}>
        <span>{axisLeft}</span><span>{axisRight}</span>
      </div>
    </button>
  );
};

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

export const ProfileHero: React.FC<Props> = ({
  userId,
  viewerUserId,
  displayName,
  ownerFirstName,
  ownerGender,
  avatarUrl,
  region,
  isSelf,
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
  const showConnectCard = chip.settled && !chip.connected && isSelf;

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
              ...(bioExpanded ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }),
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

        {(showIndexBlocks || showConnectCard) && <div style={{ height: 1, background: A.SOFT, marginTop: 14 }} />}

        {showIndexBlocks && (
          <div style={{ marginTop: 14 }}>
            {shownIndex != null && (
              <>
                <div style={KICK}>{t('hero.handicapIndex', 'Handicap index')}</div>
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                  <button type="button" onClick={tap('index')} style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 46, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.92, color: A.INK, ...FIGS }}>
                    {formatIndex(shownIndex)}
                  </button>
                  {deltaLines.length > 0 && (
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingBottom: 5 }}>
                      {deltaLines.map((l) => {
                        const up = l.direction === 'up';
                        const down = l.direction === 'down';
                        const c = down ? GREEN : up ? RED : W_40;
                        return (
                          <span key={l.key} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, fontSize: 12, fontWeight: 700, ...FIGS }}>
                            <span style={{ color: c, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {(down || up) && <IndexMovementTriangle direction={down ? 'down' : 'up'} color={c} size={7} />}
                              {down || up ? Math.abs(l.delta).toFixed(1) : t('hero.trendLevel', 'Level')}
                            </span>
                            <span style={{ ...MICRO, color: W_40 }}>{l.window}</span>
                          </span>
                        );
                      })}
                    </span>
                  )}
                  {slot && (
                    <span style={{ marginLeft: 'auto', textAlign: 'right', paddingBottom: 4 }}>
                      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: slot.color, ...FIGS }}>{slot.value}</div>
                      <div style={{ marginTop: 3, ...MICRO, color: A.DIM }}>{slot.label}</div>
                    </span>
                  )}
                </div>
                {verdict && (
                  <div style={{ marginTop: 9, fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, color: A.BODY }}>{verdict}</div>
                )}
              </>
            )}

            {series.length >= 2 && (
              <IndexChart
                points={series}
                color={chartColor}
                fillTop={chartFillTop}
                lowLabel={t('hero.low', { value: formatIndex(Math.min(...series)), defaultValue: `Low ${formatIndex(Math.min(...series))}` })}
                axisLeft={t('hero.windowAgo', { window: axisWindow, defaultValue: `${axisWindow} ago` })}
                axisRight={t('hero.today', 'Today')}
                onTap={() => {
                  analyticsEvents.track('profile_index_chart_tap', { window_days: windowDays });
                  onStatTap('index');
                }}
              />
            )}

            {bars.length > 0 && (
              <>
                <div style={{ marginTop: 18 }}>
                  <span style={KICK}>{t('hero.formLastFive', 'Form \u00B7 last five')}</span>
                </div>
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {bars.map((bar, i) => {
                    const r = byId.get(bar.id);
                    const fig = fmtSigned(bar.value);
                    const hasSign = fig.startsWith('+') || fig.startsWith('\u2212');
                    return (
                      <button
                        key={bar.id}
                        type="button"
                        onClick={() => {
                          analyticsEvents.track('profile_form_tile_tap', { whs_score_id: bar.id, position: i + 1 });
                          navigate(`/round/${bar.id}`);
                        }}
                        style={{
                          minWidth: 0,
                          border: `1px solid ${A.SOFT}`,
                          background: TILE_GROUND,
                          borderRadius: 11,
                          padding: '8px 5px 7px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontFamily: SANS,
                        }}
                      >
                        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: A.INK, ...FIGS }}>
                          {r?.gross_score ?? '\u00A0'}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, textAlign: 'center', color: formBarLowered(bar) ? GREEN : A.DIM, ...FIGS }}>
                          {/* The sign hangs outside the centring so the digits sit under the gross. */}
                          <span style={{ position: 'relative', display: 'inline-block' }}>
                            {hasSign && <span style={{ position: 'absolute', right: '100%', marginRight: 0.5 }}>{fig[0]}</span>}
                            {hasSign ? fig.slice(1) : fig}
                          </span>
                        </div>
                        <div style={{ marginTop: 5, fontSize: 7, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: AXIS_INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r?.course_name ?? '\u00A0'}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/*
                  "Counting" and "lowered your index" are DIFFERENT FACTS and they come
                  apart: a round can enter the best eight without displacing a worse
                  score (counting, did not lower), and a round that lowered the index
                  months ago can since have been pushed out (lowered, not counting). On
                  a five-round window they correlate strongly, which is exactly why one
                  mark claiming both looks right until the day it is wrong. The tiles
                  draw the one fact a colour can carry honestly — green for lowered —
                  and the sentence states the one it cannot. Do not add a counting
                  marker to these tiles.
                */}
                {(countingKnown || loweredN > 0) && (
                  <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 600, lineHeight: 1.45, color: A.MUTE }}>
                    {countingKnown && (
                      <>
                        {countingN === 0 ? (
                          <><b style={{ color: A.INK, fontWeight: 700 }}>{t('hero.countingNone', 'None')}</b>{t('hero.countingNoneRest', { n: tilesWord, defaultValue: ` of these ${tilesWord} are counting towards your index.` })}</>
                        ) : (
                          <><b style={{ color: A.INK, fontWeight: 700 }}>{numberWord(countingN)}</b>{countingN === 1
                            ? t('hero.countingOneRest', { n: tilesWord, defaultValue: ` of these ${tilesWord} is counting towards your index.` })
                            : t('hero.countingManyRest', { n: tilesWord, defaultValue: ` of these ${tilesWord} are counting towards your index.` })}</>
                        )}
                      </>
                    )}
                    {countingKnown && loweredN > 0 && ' '}
                    {loweredN > 0 && (loweredN === 1
                      ? <>{t('hero.loweredOnePre', 'The ')}<span style={{ color: GREEN }}>{t('hero.loweredOneGreen', 'green')}</span>{t('hero.loweredOnePost', ' round lowered it.')}</>
                      : <><span style={{ color: GREEN }}>{t('hero.loweredManyGreen', 'Green')}</span>{t('hero.loweredManyPost', ' rounds lowered it.')}</>)}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {showConnectCard && (
          <div style={{ marginTop: 14, border: `1px solid ${A.BORDER}`, borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK }}>
              {t('hero.connectTitle', 'Connect your handicap')}
            </div>
            <div style={{ marginTop: 5, fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, color: A.BODY }}>
              {t('hero.connectBody', 'Your index, your trend, and every round you have posted \u2014 pulled straight from England Golf. It takes about a minute.')}
            </div>
            <button
              type="button"
              onClick={onConnect}
              style={{ marginTop: 12, width: '100%', height: 40, borderRadius: 999, border: 0, background: A.AMBER, color: ON_AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              {t('hero.connectCta', 'Connect')}
            </button>
          </div>
        )}

        {counters.length > 0 && (
          <div
            style={{
              marginTop: showConnectCard ? 22 : 16,
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
