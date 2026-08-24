import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { A, CHIP_GAP, DISCOVER_FACT, DISCOVER_QUIET, SANS, WELL_RADIUS } from './tokens';

/**
 * THE MEDIA ACT'S HEAD, AND THE PAGE'S ONE CHAPTER BREAK
 * (BRIEF_DISCOVER_ONE_PAGE §4).
 *
 * IT REPLACES THE SEAM LABEL. "ALL TIME · FROM EVERYONE" was a decorative
 * divider that had to be explained, which is a divider that failed. A FUNCTIONAL
 * divider reads as intentional without a caption: everything above this bar is
 * scoped by the round pills and bounded to the week, everything below it is the
 * whole library, and the bar itself is the thing that says so by being a control
 * the first act does not share.
 *
 * WHY THE TYPE CHIPS CAN SIT ON THIS PAGE AT ALL (§4.2): they are visually
 * attached to the bar that heads their act, so their scope is unambiguous. Two
 * pill rows on one page were only ambiguous while nothing marked where the first
 * row's authority ended.
 *
 * =====================================================================
 * THE CHIPS ARE NOT THE SCOPE PILLS, AND MUST NOT BECOME THEM (§4.5).
 *
 *   scope pills   FILLED BOXES — 1px border, panel or ink ground, 8px radius,
 *                 12.5/700. A pill is a solid object you switch between.
 *   media chips   TEXT ONLY — no ground, no border, no radius; the active one is
 *                 white and carries a 2px rule beneath it, the rest are quiet.
 *
 * That is the app-wide tab/filter-row treatment, and the difference is
 * structural rather than a recolour: one control family is filled, the other is
 * a run of words with a rule under the live one. If anyone later gives these a
 * ground, the two rows become indistinguishable and this whole arrangement
 * stops working.
 *
 * =====================================================================
 * THE SEARCH DEFERS TO THE GLOBAL SEARCH, IT DOES NOT COMPETE WITH IT (§4.3).
 *
 * The chrome island's glyph already opens SearchOverlayV2, which searches
 * members AND courses (plus clubs, tour players, videos, posts) with recents and
 * scope chips. So this bar is a TAP TARGET FOR THAT OVERLAY — it dispatches the
 * same `clbhouz:open-search` event the island listens for. NO SECOND SEARCH
 * INPUT, no second query hook, no second result vocabulary. PlayerSearchSheet
 * was NOT reused: it is members-only, on the light handicap tokens, and reusing
 * it would have meant extending it to courses — which is rebuilding the overlay
 * that already exists.
 */

export type MediaChipId = 'all' | 'photos' | 'clips' | 'videos';

export const MEDIA_CHIPS: MediaChipId[] = ['all', 'photos', 'clips', 'videos'];

export function openGlobalSearch() {
  window.dispatchEvent(new Event('clbhouz:open-search'));
}

export function MediaActBar({
  chip,
  onChipChange,
}: {
  chip: MediaChipId;
  onChipChange: (next: MediaChipId) => void;
}) {
  const { t } = useTranslation('courses');

  const label = (id: MediaChipId) => {
    switch (id) {
      case 'photos':
        return t('community.chips.photos', 'Photos');
      case 'clips':
        return t('community.chips.clips', 'Clips');
      case 'videos':
        return t('community.chips.videos', 'Videos');
      case 'all':
      default:
        return t('community.chips.everything', 'Everything');
    }
  };

  return (
    <div style={{ fontFamily: SANS }}>
      <button
        type="button"
        onClick={openGlobalSearch}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          width: '100%',
          padding: '11px 12px',
          borderRadius: WELL_RADIUS,
          background: A.PANEL,
          border: `1px solid ${A.BORDER}`,
          color: DISCOVER_QUIET,
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <Search size={15} color={DISCOVER_QUIET} strokeWidth={2.4} aria-hidden />
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t('discover.media.searchPlaceholder', 'Search members and courses')}
        </span>
      </button>

      <div
        role="tablist"
        aria-label={t('discover.media.chipsAria', 'Media type')}
        className="scrollbar-hide"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          overflowX: 'auto',
          marginTop: 12,
          marginBottom: CHIP_GAP,
          minWidth: 0,
        }}
      >
        {MEDIA_CHIPS.map((id) => {
          const active = id === chip;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChipChange(id)}
              style={{
                flex: 'none',
                background: 'transparent',
                border: 'none',
                padding: '2px 0 5px',
                borderBottom: `2px solid ${active ? DISCOVER_FACT : 'transparent'}`,
                color: active ? DISCOVER_FACT : DISCOVER_QUIET,
                fontFamily: SANS,
                fontSize: 12.5,
                fontWeight: active ? 700 : 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {label(id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MediaActBar;
