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
import { useSharedRounds, useSharedRoundCounts, useWhsConnection } from '@/lib/whs/hooks';
import { useEntityPickerSearch } from '@/features/search-v2/hooks/useEntityPickerSearch';
import { useCompareIdentities } from './useCompareIdentities';
import { useCompareRecent } from './useCompareRecent';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';
import ComparePersonRow, { type ComparePerson } from './ComparePersonRow';
import { useCompareStats } from './useCompareStats';
import HeadToHeadDetail from './HeadToHeadDetail';

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

  /** HH3: the heads row shows REAL photos for both sides, one batched read. */
  const { data: heads } = useCompareIdentities(
    target ? [viewerUserId, target.userId] : [],
    open && !!target,
  );
  const targetFirst = (target?.name ?? '').trim().split(/\s+/)[0] ?? '';

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

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      ariaLabelledBy="handicap-compare-title"
      maxHeight="85dvh"
      style={{
        height: 'auto',
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: CHART_FONT,
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
          <HeadToHeadDetail
            me={{ userId: viewerUserId, name: heads?.[viewerUserId]?.name ?? null, avatarUrl: heads?.[viewerUserId]?.avatarUrl ?? null }}
            them={{ userId: target.userId, name: target.name, avatarUrl: heads?.[target.userId]?.avatarUrl ?? target.avatarUrl }}
            firstName={targetFirst}
            season={season}
            shared={shared}
          />
        )}
      </div>
    </BottomSheet>
  );
};

export default CompareSheet;
