/**
 * CompareSheet - "How you compare".
 *
 * ONE sheet replaces the rivalry mechanic. Two states:
 *
 *   LIST   - a search field, then the six players the member played with most
 *            recently. Search widens to ANYONE the member can find, which is
 *            the point: the old mechanic only worked against a fixed set of
 *            slots.
 *   DETAIL - the heads row, then paired stat rows.
 *
 * DETAIL has TWO MODES and the mode is decided by ONE fact - whether the two
 * have ever played the same course on the same day:
 *
 *   SHARED (>=1 shared round) - head-to-head figures, footnoted with the
 *            sample. This is what the rivalry page carried.
 *   SEASON  (0 shared rounds) - season figures side by side, footnoted to say
 *            so. NOT an empty state: comparing two members who have never met
 *            is the common case once search is open to everyone.
 *
 * Amber means the leader of a row. Polarity lives in the stat's `format`, so
 * gross and index (low better) and stableford (high better) are handled by
 * CompareStatRow without any call site flipping a colour.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowLeft, Search } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFriendLeaderboard, useSharedRounds, useSharedRoundCounts, useWhsConnection } from '@/lib/whs/hooks';
import { useEntityPickerSearch } from '@/features/search-v2/hooks/useEntityPickerSearch';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { useCompareIdentities } from './useCompareIdentities';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { formatRelativeAgo } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';
import ComparePersonRow, { type ComparePerson } from './ComparePersonRow';
import CompareStatRow from './CompareStatRow';
import { useCompareStats } from './useCompareStats';
import type { CompareSource } from './events';

const RECENT_LIMIT = 6;

interface Props {
  open: boolean;
  onClose: () => void;
  /** The viewing member. All figures on the left-hand side are theirs. */
  viewerUserId: string;
  /** Pre-selected player, from a deep link or the friend-view control. */
  initialTargetUserId?: string | null;
  from: CompareSource;
}

export const CompareSheet: React.FC<Props> = ({
  open,
  onClose,
  viewerUserId,
  initialTargetUserId = null,
  from,
}) => {
  const { t } = useTranslation('common');
  const [target, setTarget] = React.useState<ComparePerson | null>(null);
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 250);

  const { data: connection } = useWhsConnection(viewerUserId);
  const { data: leaderboard } = useFriendLeaderboard(viewerUserId);

  const selfEntry = React.useMemo(
    () => (leaderboard ?? []).find((e) => e.is_self) ?? null,
    [leaderboard],
  );

  /**
   * IDENTITY. Every displayed name and photo for a clbhouz member comes from
   * user_profiles through useCompareIdentities - never from the leaderboard's
   * friend_name / friend_thumbnail_url, which are England Golf fields and
   * surname-first. One batched read covers the whole visible list.
   */
  const recentRows = React.useMemo(
    () =>
      (leaderboard ?? [])
        .filter((e) => !e.is_self && !!e.friend_user_id && e.is_clbhouz_user)
        .sort((a, b) =>
          (b.last_round_played_at ?? '').localeCompare(a.last_round_played_at ?? ''),
        )
        .slice(0, RECENT_LIMIT),
    [leaderboard],
  );

  const { data: identities } = useCompareIdentities(
    recentRows.map((e) => e.friend_user_id as string),
    open,
  );

  /** The six most recently played with, self excluded, clbhouz members only. */
  const recent = React.useMemo<ComparePerson[]>(() => {
    const rows = (leaderboard ?? [])
      .filter((e) => !e.is_self && !!e.friend_user_id && e.is_clbhouz_user)
      .sort((a, b) =>
        (b.last_round_played_at ?? '').localeCompare(a.last_round_played_at ?? ''),
      )
      .slice(0, RECENT_LIMIT);
    return rows.map((e) => {
      const id = identities?.[e.friend_user_id as string];
      return {
      userId: e.friend_user_id as string,
      // A resolved clbhouz member is named by their profile. These rows are all
      // clbhouz members (is_clbhouz_user + friend_user_id), so an unresolved one
      // holds a shell rather than falling back to the England Golf name.
      name: id?.name ?? null,
      avatarUrl: id?.avatarUrl ?? e.friend_profile_photo_url ?? null,
      index: e.friend_handicap_index,
      contextLine:
        [
          e.last_round_played_at
            ? formatRelativeAgo(e.last_round_played_at, { yesterday: true })
            : '',
          e.last_round_course_name ?? '',
        ]
          .filter(Boolean)
          .join(' . ') || null,
      };
    });
  }, [leaderboard, identities]);

  const searching = debouncedQuery.trim().length > 0;
  const { people } = useEntityPickerSearch({
    query: debouncedQuery,
    enabled: open && searching && !target,
    limit: 12,
  });

  const searchResults = React.useMemo<ComparePerson[]>(
    () =>
      (people ?? [])
        .filter((p) => p.id !== viewerUserId)
        .map((p) => ({
          userId: p.id,
          name: p.display_name,
          avatarUrl: p.avatar_url,
          index: null,
          contextLine: null,
        })),
    [people, viewerUserId],
  );

  /**
   * ONE batched RPC for whichever list is on screen - six recent rows or the
   * search results - instead of a query per row. Cached per id-set, so
   * toggling back to the recent list or re-typing a query costs nothing.
   */
  const visibleIds = React.useMemo(
    () => (searching ? searchResults : recent).map((p) => p.userId),
    [searching, searchResults, recent],
  );
  const { data: sharedCounts } = useSharedRoundCounts(
    viewerUserId,
    visibleIds,
    open && !target,
  );

  /**
   * Deep link / friend-view pre-selection, through THE SAME resolver.
   *
   * `recent` is only six rows, so most deep links miss it; the id is then read
   * from user_profiles directly. WHILE IT IS IN FLIGHT THE TARGET CARRIES NO
   * NAME - not the sheet's title, not "Player", nothing. A fabricated identity
   * over a stranger's genuine record is a mis-attribution, and the old code
   * named people after this sheet's own heading.
   *
   * ON A FAILED OR EMPTY LOOKUP the sheet falls back to its ENTRY STATE so the
   * member picks someone real.
   */
  const { data: deepIdentities, isFetched: deepFetched } = useCompareIdentities(
    initialTargetUserId ? [initialTargetUserId] : [],
    open && !!initialTargetUserId,
  );

  React.useEffect(() => {
    if (!open || !initialTargetUserId) return;
    const hit = recent.find((p) => p.userId === initialTargetUserId);
    if (hit?.name) {
      setTarget(hit);
      return;
    }
    const resolved = deepIdentities?.[initialTargetUserId];
    if (resolved) {
      setTarget({
        userId: resolved.userId,
        name: resolved.name,
        avatarUrl: resolved.avatarUrl,
        index: hit?.index ?? null,
        contextLine: hit?.contextLine ?? null,
      });
      return;
    }
    if (deepFetched) {
      setTarget(null); // Unidentifiable - show the entry state, not a comparison.
      return;
    }
    setTarget({
      userId: initialTargetUserId,
      name: null,
      avatarUrl: null,
      index: null,
      contextLine: null,
    });
  }, [open, initialTargetUserId, recent, deepIdentities, deepFetched]);

  React.useEffect(() => {
    if (!open) return;
    analyticsEvents.track('handicap_compare_opened', {
      from,
      pre_selected: !!initialTargetUserId,
    });
  }, [open, from, initialTargetUserId]);

  React.useEffect(() => {
    if (!searching) return;
    analyticsEvents.track('handicap_compare_searched', {
      query_length: debouncedQuery.trim().length,
      results: searchResults.length,
    });
  }, [searching, debouncedQuery, searchResults.length]);

  const { data: shared } = useSharedRounds(viewerUserId, target?.userId ?? null);
  const { data: season } = useCompareStats(
    viewerUserId,
    connection?.id,
    target?.userId,
    target?.name ?? undefined,
  );

  const sharedCount = shared?.shared_rounds_count ?? 0;
  const isSharedMode = !!target && sharedCount > 0;

  /**
   * CAREER BLOCK GATE.
   *
   * useCompareStats flattens a MISSING aggregate to emptyPlayer() - every
   * career figure zero or null - which is indistinguishable at this level from
   * a genuine member who has posted nothing yet. Rendering a block of zeros
   * against a real opponent's figures would say "they have never made a
   * birdie", which is untrue of someone whose rounds simply are not synced.
   *
   * So the gate is the PRESENCE OF THE CONNECTION, not the values: no
   * whs_connections row for the target means no aggregate was ever fetched, and
   * the whole panel is withheld. A connected member with a real zero still
   * sees their block.
   */
  const { data: targetConnection } = useWhsConnection(target?.userId);
  const careerAvailable = !!season && !!connection?.id && !!targetConnection?.id;

  /**
   * The career rows. Two populations cannot share one list, so in SHARED mode
   * these live in their own panel with their own footnote; the head-to-head
   * rows above them come from the shared rounds only.
   *
   * `conditional` rows render only when at least one side is above zero - most
   * pairs carry three or four dead "0 - 0" rows otherwise, which buries the
   * rows that say something. Birdies and eagles are never conditional: a real
   * zero there is information.
   */
  const careerRows = React.useMemo(() => {
    if (!season) return [];
    const { me, them } = season;
    const defs: {
      key: string;
      label: string;
      me: number | null;
      them: number | null;
      format: 'neutral' | 'high_better' | 'low_better';
      conditional?: boolean;
      /** Already on screen in season mode's first panel. */
      inSeasonPanel?: boolean;
    }[] = [
      {
        key: 'rounds',
        label: t('handicap.compare.stat.rounds'),
        me: me.rounds_played,
        them: them.rounds_played,
        format: 'neutral',
        inSeasonPanel: true,
      },
      {
        key: 'birdies',
        label: t('handicap.compare.stat.birdies'),
        me: me.birdies,
        them: them.birdies,
        format: 'high_better',
      },
      {
        key: 'eagles',
        label: t('handicap.compare.stat.eagles'),
        me: me.eagles,
        them: them.eagles,
        format: 'high_better',
      },
      {
        key: 'albatrosses',
        label: t('handicap.compare.stat.albatrosses'),
        me: me.albatrosses,
        them: them.albatrosses,
        format: 'high_better',
        conditional: true,
      },
      {
        key: 'aces',
        label: t('handicap.compare.stat.aces'),
        me: me.aces,
        them: them.aces,
        format: 'high_better',
        conditional: true,
      },
      {
        key: 'subPar',
        label: t('handicap.compare.stat.roundsUnderPar'),
        me: me.sub_par_rounds,
        them: them.sub_par_rounds,
        format: 'high_better',
        conditional: true,
      },
      {
        key: 'sub80',
        label: t('handicap.compare.stat.roundsUnder80'),
        me: me.sub80_rounds,
        them: them.sub80_rounds,
        format: 'high_better',
        conditional: true,
      },
      {
        key: 'bestGross',
        label: t('handicap.compare.stat.bestGross'),
        me: me.lowest_gross,
        them: them.lowest_gross,
        format: 'low_better',
        inSeasonPanel: true,
      },
      {
        key: 'bestStableford',
        label: t('handicap.compare.stat.bestStableford'),
        me: me.best_stableford,
        them: them.best_stableford,
        format: 'high_better',
      },
      {
        key: 'top100',
        label: t('handicap.compare.stat.top100Played'),
        me: me.top100_played,
        them: them.top100_played,
        format: 'high_better',
      },
    ];
    return defs.filter((d) => {
      // Null on BOTH sides is nothing to compare. Null on one side renders,
      // with the sheet's existing hyphen - never a substituted zero.
      if (d.me == null && d.them == null) return false;
      if (d.conditional && (d.me ?? 0) <= 0 && (d.them ?? 0) <= 0) return false;
      return true;
    });
  }, [season, t]);

  /**
   * Season mode's first panel ALREADY carries rounds played and best gross,
   * and both are career figures (total_rounds_count / best_gross), not season
   * ones - so it absorbs the remaining career rows rather than gaining a
   * second panel that would repeat two values on one screen.
   */
  const seasonCareerRows = React.useMemo(
    () => careerRows.filter((d) => !d.inSeasonPanel),
    [careerRows],
  );

  const renderCareerRows = (
    rows: typeof careerRows,
  ): React.ReactNode =>
    rows.map((d) => (
      <CompareStatRow
        key={d.key}
        label={d.label}
        meValue={d.me}
        themValue={d.them}
        format={d.format}
      />
    ));


  /** Derived head-to-head figures, from the shared-round results only. */
  const h2h = React.useMemo(() => {
    const rounds = shared?.shared_round_results ?? [];
    if (rounds.length === 0) return null;
    const mean = (xs: number[]) =>
      xs.length === 0
        ? null
        : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
    const meSt = rounds.map((r) => r.user_stableford).filter((n) => n != null);
    const themSt = rounds.map((r) => r.rival_stableford).filter((n) => n != null);
    const meGross = rounds.map((r) => r.user_gross).filter((n) => n != null);
    const themGross = rounds.map((r) => r.rival_gross).filter((n) => n != null);
    const margins = rounds.map((r) => r.user_stableford - r.rival_stableford);
    return {
      // GROSS LEADS. fetchSharedRounds already computes gross_record and it was
      // fetched and discarded; gross is the figure members argue about.
      grossWins: shared?.gross_record.wins ?? 0,
      grossLosses: shared?.gross_record.losses ?? 0,
      grossTies: shared?.gross_record.ties ?? 0,
      wins: shared?.stableford_record.wins ?? 0,
      losses: shared?.stableford_record.losses ?? 0,
      meAvgSt: mean(meSt as number[]),
      themAvgSt: mean(themSt as number[]),
      meAvgGross: mean(meGross as number[]),
      themAvgGross: mean(themGross as number[]),
      meBestGross: meGross.length ? Math.min(...(meGross as number[])) : null,
      themBestGross: themGross.length ? Math.min(...(themGross as number[])) : null,
      meBestMargin: margins.length ? Math.max(...margins) : null,
      themBestMargin: margins.length ? Math.max(...margins.map((m) => -m)) : null,
    };
  }, [shared]);

  const handleSelect = (person: ComparePerson, sharedRounds: number) => {
    analyticsEvents.track('handicap_compare_player_picked', {
      target_user_id: person.userId,
      shared_rounds: sharedRounds,
      mode: sharedRounds > 0 ? 'shared' : 'season',
      from_search: searching,
    });
    setTarget(person);
  };

  const backToList = () => {
    setTarget(null);
    setQuery('');
  };

  const handleClose = () => {
    setTarget(null);
    setQuery('');
    onClose();
  };

  const avatar = (
    name: string | null,
    src: string | null,
    seed: string,
    frameAmber: boolean,
  ) => (
    <div
      style={{
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: '34%',
        overflow: 'hidden',
        background: src ? CHART.PANEL_2 : getAvatarFallbackColor(seed),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: CHART.INK,
        fontSize: 15,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : name ? (
        // Initials NEVER come from a UI string, and an unresolved name renders
        // no letters at all rather than inventing them.
        <span>{getInitialsFromName(name) || '?'}</span>
      ) : null}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '34%',
          border: `1px solid ${frameAmber ? CHART.AMBER : CHART.FAINT}`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );

  /**
   * The standing line, from the GROSS record.
   *
   * LEADER-FIRST: the record was always built viewer-first, so an opponent lead
   * read "Danny leads by 2-4" - the leader's own figure second, as though they
   * were losing. The record is now built from the leader's perspective.
   *
   * TIES RENDER WHEN THERE ARE ANY, and are omitted entirely when there are
   * none - never a trailing "-0". Without them a record of 2-4 did not
   * reconcile with the "7 rounds played" stated two rows below. An all-ties
   * record is the LEVEL branch.
   */
  const standingLine = (): string => {
    if (!h2h) return t('handicap.compare.noShared');
    const { grossWins: wins, grossLosses: losses, grossTies: ties } = h2h;
    const hasTies = ties > 0;
    if (wins > losses) {
      const n = `${wins}-${losses}`;
      return hasTies
        ? t('handicap.compare.youLeadByWithTies', { n, ties })
        : t('handicap.compare.youLeadBy', { n });
    }
    if (losses > wins) {
      // Leader's figure first.
      const n = `${losses}-${wins}`;
      const name = target?.name ?? '';
      return hasTies
        ? t('handicap.compare.theyLeadByWithTies', { name, n, ties })
        : t('handicap.compare.theyLeadBy', { name, n });
    }
    const n = `${wins}-${losses}`;
    return hasTies
      ? t('handicap.compare.levelAtWithTies', { n, ties })
      : t('handicap.compare.levelAt', { n });
  };

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      ariaLabelledBy="handicap-compare-title"
      variant="dark"
      surfaceColor={CHART.CANVAS}
      maxHeight="75dvh"
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: CHART_FONT,
        background: CHART.CANVAS,
      }}
    >
      {/* Pinned header */}
      <div
        style={{
          flexShrink: 0,
          padding: '6px 16px 12px',
          borderBottom: `1px solid ${CHART.BORDER}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
          {target && (
            <button
              type="button"
              onClick={backToList}
              aria-label={t('handicap.compare.back')}
              style={{
                border: 'none',
                background: 'transparent',
                color: CHART.MUTE,
                cursor: 'pointer',
                padding: 4,
                marginLeft: -4,
                lineHeight: 0,
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={18} strokeWidth={2.2} />
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ ...LABEL_STYLE, color: CHART.MUTE }}>
              {t('handicap.compare.kicker')}
            </div>
            <div
              id="handicap-compare-title"
              style={{
                marginTop: 3,
                fontSize: 17,
                fontWeight: 800,
                color: CHART.INK,
                letterSpacing: '-0.01em',
              }}
            >
              {!target ? (
                t('handicap.compare.title')
              ) : target.name ? (
                t('handicap.compare.youAnd', { name: target.name })
              ) : (
                // Identity in flight: a shell, never a placeholder name.
                <span
                  aria-hidden
                  style={{
                    display: 'inline-block',
                    width: 148,
                    height: 14,
                    borderRadius: 4,
                    background: CHART.PANEL_2,
                    verticalAlign: 'middle',
                  }}
                />
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label={t('handicap.compare.close')}
          style={{
            border: 'none',
            background: 'transparent',
            color: CHART.MUTE,
            cursor: 'pointer',
            padding: 6,
            margin: -6,
            lineHeight: 0,
            flexShrink: 0,
          }}
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Scroller */}
      {/* `no-scrollbar` is the app's existing utility (src/index.css) used by the
          other analytical sheets; it hides the bar without touching keyboard or
          assistive scrolling. */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        {!target && (
          <>
            {/* Search */}
            <div style={{ padding: '14px 16px 12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: CHART.PANEL,
                  border: `1px solid ${CHART.BORDER}`,
                  borderRadius: 12,
                  padding: '9px 12px',
                }}
              >
                <Search size={15} strokeWidth={2.2} color={CHART.DIM} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('handicap.compare.searchPlaceholder')}
                  aria-label={t('handicap.compare.searchPlaceholder')}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: CHART.INK,
                    fontFamily: CHART_FONT,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                />
              </div>
              <div style={{ ...LABEL_STYLE, marginTop: 10, color: CHART.MUTE }}>
                {searching
                  ? t('handicap.compare.results')
                  : t('handicap.compare.recent')}
              </div>
            </div>

            {(searching ? searchResults : recent).map((p) => (
              <ComparePersonRow
                key={p.userId}
                person={p}
                sharedCount={sharedCounts?.[p.userId] ?? 0}
                onSelect={handleSelect}
              />
            ))}

            {searching && searchResults.length === 0 && (
              <div
                style={{
                  padding: '18px 16px',
                  borderTop: `1px solid ${CHART.BORDER}`,
                  fontSize: 13,
                  color: CHART.MUTE,
                }}
              >
                {t('handicap.compare.noMatch')}
              </div>
            )}

            {!searching && recent.length === 0 && (
              <div
                style={{
                  padding: '18px 16px',
                  borderTop: `1px solid ${CHART.BORDER}`,
                  fontSize: 13,
                  color: CHART.MUTE,
                }}
              >
                {t('handicap.compare.prompt')}
              </div>
            )}
          </>
        )}

        {target && (
          <>
            {/* Heads row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '16px 16px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                {avatar(
                  selfEntry?.friend_name ?? '',
                  pickAvatarSrc(
                    selfEntry?.friend_thumbnail_url ?? null,
                    selfEntry?.friend_profile_photo_url ?? null,
                  ),
                  viewerUserId,
                  true,
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={LABEL_STYLE}>
                    {isSharedMode
                      ? t('handicap.compare.headToHead')
                      : t('handicap.compare.thisSeason')}
                  </div>
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 13,
                      fontWeight: 800,
                      color: CHART.INK,
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {target.name || h2h == null || h2h.grossLosses <= h2h.grossWins
                      ? standingLine()
                      : ''}
                  </div>
                </div>
              </div>
              {avatar(target.name, target.avatarUrl, target.userId, false)}
            </div>

            <div style={{ padding: '0 16px 16px' }}>
              <div
                style={{
                  background: CHART.PANEL,
                  border: `1px solid ${CHART.BORDER}`,
                  borderRadius: 16,
                  // Rows carry 11px of their own vertical padding, so 4px here
                  // puts the first and last row 15px from each panel edge.
                  padding: '4px 14px 4px',
                }}
              >
                {isSharedMode && h2h ? (
                  <>
                    {/* GROSS LEADS. Stableford stays, but is no longer the
                        headline. */}
                    <CompareStatRow
                      label={t('handicap.compare.stat.grossWins')}
                      meValue={h2h.grossWins}
                      themValue={h2h.grossLosses}
                      format="count"
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.stablefordWins')}
                      meValue={h2h.wins}
                      themValue={h2h.losses}
                      format="count"
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.avgGross')}
                      meValue={h2h.meAvgGross}
                      themValue={h2h.themAvgGross}
                      format="low_better"
                      decimals={1}
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.avgStableford')}
                      meValue={h2h.meAvgSt}
                      themValue={h2h.themAvgSt}
                      format="high_better"
                      decimals={1}
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.bestGross')}
                      meValue={h2h.meBestGross}
                      themValue={h2h.themBestGross}
                      format="low_better"
                    />
                    {/* Best margin is computed from STABLEFORD POINTS, so with
                        gross leading the panel the label must carry the unit. */}
                    <CompareStatRow
                      label={t('handicap.compare.stat.bestMarginPts')}
                      meValue={h2h.meBestMargin}
                      themValue={h2h.themBestMargin}
                      format="high_better"
                    />
                  </>
                ) : (
                  <>
                    <CompareStatRow
                      label={t('handicap.compare.stat.index')}
                      meValue={season?.me.handicap_index ?? null}
                      themValue={season?.them.handicap_index ?? null}
                      format="low_better"
                      decimals={1}
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.scoringAverage')}
                      meValue={season?.me.last5_avg_vs_par ?? null}
                      themValue={season?.them.last5_avg_vs_par ?? null}
                      format="low_better"
                      decimals={1}
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.bestGross')}
                      meValue={season?.me.lowest_gross ?? null}
                      themValue={season?.them.lowest_gross ?? null}
                      format="low_better"
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.rounds')}
                      meValue={season?.me.rounds_played ?? null}
                      themValue={season?.them.rounds_played ?? null}
                      format="neutral"
                    />
                    {/* The remaining career figures, already fetched. This
                        panel's rounds and best gross are career figures too, so
                        the extra rows belong here rather than in a second
                        panel that would repeat them. */}
                    {careerAvailable && renderCareerRows(seasonCareerRows)}
                  </>

                )}
              </div>

              {/* The footnote states the sample, always. */}
              <div style={{ ...LABEL_STYLE, marginTop: 10, lineHeight: 1.5 }}>
                {isSharedMode
                  ? t('handicap.compare.sharedFooter', { count: sharedCount })
                  : t('handicap.compare.neverFooter')}
              </div>
              {!isSharedMode && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: CHART.MUTE,
                    lineHeight: 1.45,
                  }}
                >
                  {t('handicap.compare.seasonOnly')}
                </div>
              )}

              {/* CAREER - a SECOND panel, because it is a SECOND population:
                  every round each member has posted, not the shared ones. Read
                  as one list with the head-to-head rows above, "birdies 31-47"
                  would be taken for a head-to-head figure, which it is not. */}
              {isSharedMode && careerAvailable && careerRows.length > 0 && (
                <>
                  <div style={{ ...LABEL_STYLE, marginTop: 18, color: CHART.MUTE }}>
                    {t('handicap.compare.career')}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      background: CHART.PANEL,
                      border: `1px solid ${CHART.BORDER}`,
                      borderRadius: 16,
                      // Rows carry 11px of their own vertical padding, so 4px here
                  // puts the first and last row 15px from each panel edge.
                  padding: '4px 14px 4px',
                    }}
                  >
                    {renderCareerRows(careerRows)}
                  </div>
                  <div style={{ ...LABEL_STYLE, marginTop: 10, lineHeight: 1.5 }}>
                    {t('handicap.compare.careerFooter')}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
};

export default CompareSheet;
