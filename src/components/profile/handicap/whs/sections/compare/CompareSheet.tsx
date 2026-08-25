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
import { useCompareRecent } from './useCompareRecent';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { formatRelativeAgo } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';
import ComparePersonRow, { type ComparePerson } from './ComparePersonRow';
import CompareStatRow from './CompareStatRow';
import CompareScoreboard from './CompareScoreboard';
import CompareFormStrip from './CompareFormStrip';
import { deriveCompareRanges } from './compareRanges';
import { whoLeads, type H2HStatFormat } from './h2hStats';
import { useCompareStats } from './useCompareStats';

import type { CompareSource } from './events';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';

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
   * IDENTITY + ORDER. The recent list is built by useCompareRecent, THE ONE
   * definition shared with the Circle entry panel so the two surfaces cannot
   * disagree about who "recent" is. Names and photos come from user_profiles,
   * never from the leaderboard's England Golf friend_name.
   */
  const recent = useCompareRecent(viewerUserId, RECENT_LIMIT, open);


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

  /**
   * BRIEF_COMPARE_SHEET_DUEL fix 7: the career block splits into labelled
   * groups. Same rows, same order within each group - only the headings are
   * new, and they are what stops BEST GROSS reading as one figure stated twice.
   */
  const CAREER_GROUPS: { id: string; label: string; keys: string[] }[] = [
    { id: 'volume', label: t('handicap.compare.group.volume'), keys: ['rounds', 'top100'] },
    {
      id: 'scoring',
      label: t('handicap.compare.group.scoring'),
      keys: ['birdies', 'eagles', 'subPar', 'sub80'],
    },
    { id: 'rare', label: t('handicap.compare.group.rare'), keys: ['albatrosses', 'aces'] },
    {
      id: 'best',
      label: t('handicap.compare.group.best'),
      keys: ['bestGross', 'bestStableford'],
    },
  ];

  const renderCareerGroups = (rows: typeof careerRows): React.ReactNode =>
    CAREER_GROUPS.map((g) => {
      const mine = g.keys
        .map((k) => rows.find((r) => r.key === k))
        .filter(Boolean) as typeof careerRows;
      if (mine.length === 0) return null;
      return (
        <div key={g.id} style={{ padding: '4px 0' }}>
          <div style={{ ...LABEL_STYLE, fontSize: 11, fontWeight: 700, color: CHART.DIM, padding: '8px 0 2px' }}>
            {g.label}
          </div>
          {renderCareerRows(mine)}
        </div>
      );
    });



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

  /**
   * THE BAR'S SCALE, derived - never a constant chosen by feel. See
   * compareRanges.ts for what is and is not derivable here.
   */
  const ranges = React.useMemo(
    () => deriveCompareRanges(shared?.shared_round_results),
    [shared],
  );

  /**
   * THE CATEGORY TALLY beside the "Head to head" kicker, derived from the rows
   * already on screen - no query.
   *
   * TIES COUNT FOR NEITHER SIDE AND ARE INCLUDED IN {total}. Do not quietly
   * change that: "You lead 2 of 6" must reconcile with six visible rows.
   */
  const h2hTally = React.useMemo(() => {
    if (!h2h) return null;
    const pairs: { format: H2HStatFormat; me: number | null; them: number | null }[] = [
      { format: 'count', me: h2h.grossWins, them: h2h.grossLosses },
      { format: 'count', me: h2h.wins, them: h2h.losses },
      { format: 'low_better', me: h2h.meAvgGross, them: h2h.themAvgGross },
      { format: 'high_better', me: h2h.meAvgSt, them: h2h.themAvgSt },
      { format: 'low_better', me: h2h.meBestGross, them: h2h.themBestGross },
      { format: 'high_better', me: h2h.meBestMargin, them: h2h.themBestMargin },
    ];
    const mine = pairs.filter((p) => whoLeads(p.format, p.me, p.them).winner === 'me').length;
    return { mine, total: pairs.length };
  }, [h2h]);



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
        fontWeight: 700,
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
   * standingLine() IS GONE. BRIEF_COMPARE_SHEET_DUEL fix 1: the sentence is
   * replaced by CompareScoreboard, which states the same GROSS record - leader
   * figures unchanged, ties still rendered when non-zero - as a fixture result.
   */



  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      ariaLabelledBy="handicap-compare-title"
      variant="dark"
      surfaceColor={CHART.CANVAS}
      maxHeight="85dvh"
      style={{
        height: 'auto',
        maxHeight: '85dvh',
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
                fontWeight: 700,
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
              {/* FIELD CANON — ground is CHART.CANVAS, so the canvas set. */}
              <div
                className={FIELD_PAINT_CLASS}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px' }}
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
            {/* THE SCOREBOARD replaces the standing sentence in shared mode.
                Season mode keeps a plain heads row - there is no fixture to
                report. */}
            {isSharedMode && h2h ? (
              <>
                <CompareScoreboard
                  meAvatar={avatar(
                    selfEntry?.friend_name ?? '',
                    pickAvatarSrc(
                      selfEntry?.friend_thumbnail_url ?? null,
                      selfEntry?.friend_profile_photo_url ?? null,
                    ),
                    viewerUserId,
                    true,
                  )}
                  themAvatar={avatar(target.name, target.avatarUrl, target.userId, false)}
                  themFirstName={(target.name ?? '').split(' ')[0] || ''}
                  wins={h2h.grossWins}
                  losses={h2h.grossLosses}
                  ties={h2h.grossTies}
                />
                <CompareFormStrip rounds={shared?.shared_round_results ?? []} />
              </>
            ) : (
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
                    <div style={LABEL_STYLE}>{t('handicap.compare.thisSeason')}</div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 13,
                        fontWeight: 700,
                        color: CHART.INK,
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {target.name ? t('handicap.compare.youAnd', { name: target.name }) : ''}
                    </div>
                  </div>
                </div>
                {avatar(target.name, target.avatarUrl, target.userId, false)}
              </div>
            )}

            <div style={{ padding: '0 16px 16px' }}>
              {/* THE KICKER AND THE CATEGORY TALLY. */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <div style={{ ...LABEL_STYLE, fontSize: 11, fontWeight: 700, letterSpacing: '0.19em', color: CHART.MUTE }}>
                  {isSharedMode
                    ? t('handicap.compare.headToHead')
                    : t('handicap.compare.thisSeason')}
                </div>
                {isSharedMode && h2hTally && (
                  <div
                    style={{
                      ...LABEL_STYLE,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.16em',
                      color: CHART.AMBER,
                    }}
                  >
                    {t('handicap.compare.youLeadOf', {
                      n: h2hTally.mine,
                      total: h2hTally.total,
                    })}
                  </div>
                )}
              </div>

              {/* THE SAMPLE LINE SITS ABOVE THE FIGURES so the scope is read
                  before the numbers - that is what stops BEST GROSS reading as
                  one figure stated twice against the career block below. */}
              <div style={{ ...LABEL_STYLE, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: CHART.DIM, marginBottom: 10, lineHeight: 1.5 }}>
                {isSharedMode
                  ? t('handicap.compare.sharedFooter', { count: sharedCount })
                  : t('handicap.compare.neverFooter')}
              </div>

              {/* THE COLUMNS ARE NAMED ONCE. Amber is the member, here and
                  nowhere else on the sheet. */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '58px 1fr 58px',
                  gap: 8,
                  marginBottom: 4,
                  ...LABEL_STYLE,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                }}
              >
                <span style={{ color: CHART.AMBER }}>{t('handicap.compare.you')}</span>
                <span />
                <span style={{ color: CHART.DIM, textAlign: 'right' }}>
                  {(target.name ?? '').split(' ')[0] || ''}
                </span>
              </div>

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
                      range={ranges.wins}
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.stablefordWins')}
                      meValue={h2h.wins}
                      themValue={h2h.losses}
                      format="count"
                      range={ranges.wins}
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.avgGross')}
                      meValue={h2h.meAvgGross}
                      themValue={h2h.themAvgGross}
                      format="low_better"
                      decimals={1}
                      range={ranges.gross}
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.avgStableford')}
                      meValue={h2h.meAvgSt}
                      themValue={h2h.themAvgSt}
                      format="high_better"
                      decimals={1}
                      range={ranges.stableford}
                    />
                    <CompareStatRow
                      label={t('handicap.compare.stat.bestGross')}
                      meValue={h2h.meBestGross}
                      themValue={h2h.themBestGross}
                      format="low_better"
                      range={ranges.gross}
                    />
                    {/* Best margin is computed from STABLEFORD POINTS, so with
                        gross leading the panel the label must carry the unit. */}
                    <CompareStatRow
                      label={t('handicap.compare.stat.bestMarginPts')}
                      meValue={h2h.meBestMargin}
                      themValue={h2h.themBestMargin}
                      format="high_better"
                      range={ranges.stableford}
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
                  would be taken for a head-to-head figure, which it is not.
                  Grouped, so BEST EVER is plainly a different scope. */}
              {isSharedMode && careerAvailable && careerRows.length > 0 && (
                <>
                  <div style={{ ...LABEL_STYLE, fontSize: 11, fontWeight: 700, letterSpacing: '0.19em', marginTop: 18, color: CHART.MUTE }}>
                    {t('handicap.compare.career')}
                  </div>
                  <div style={{ ...LABEL_STYLE, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', marginTop: 6, color: CHART.DIM, lineHeight: 1.5 }}>
                    {t('handicap.compare.careerFooter')}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      background: CHART.PANEL,
                      border: `1px solid ${CHART.BORDER}`,
                      borderRadius: 16,
                      padding: '4px 14px 4px',
                    }}
                  >
                    {renderCareerGroups(careerRows)}
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
