import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { A, CHIP_GAP, DISCOVER_QUIET, WELL_RADIUS } from './tokens';
import { PillFilterRow } from './PillFilterRow';

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
 * THE MEDIA CHIPS MATCH THE SCOPE PILLS (MICRO_BRIEF_MEDIA_CHIPS_SCOPE §3).
 *
 * BRIEF_DISCOVER_ONE_PAGE §4.5 is withdrawn. Both rows use PillFilterRow so they
 * are pixel-identical and cannot drift. Their different positions — and this
 * row's search control beneath it — communicate their separate scopes.
 *
 * A FILTER GOVERNS WHAT IS BELOW IT AND NOTHING ELSE. The scope pills govern
 * act one's data. The media chips govern the media sections beneath them. NO
 * CONTROL ON THIS PAGE MAY EVER REACH BACKWARDS PAST ITSELF.
 *
 * =====================================================================
 * THE SEARCH DEFERS TO THE GLOBAL SEARCH, IT DOES NOT COMPETE WITH IT (§4.3).
 *
 * The chrome island's glyph already opens SearchOverlayV2, which searches
 * members and courses plus clubs, tour players, videos and posts with recents and
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

  const options = MEDIA_CHIPS.map((id) => ({ value: id, label: label(id) }));

  return (
    <div>
      <PillFilterRow
        value={chip}
        options={options}
        onChange={onChipChange}
        ariaLabel={t('discover.media.chipsAria', 'Media type')}
      />

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
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'left',
          cursor: 'pointer',
          marginTop: CHIP_GAP,
        }}
      >
        <Search size={15} color={DISCOVER_QUIET} strokeWidth={2.4} aria-hidden />
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t('discover.media.searchPlaceholder', 'Search people, courses, clubs and posts')}
        </span>
      </button>
    </div>
  );
}

export default MediaActBar;
