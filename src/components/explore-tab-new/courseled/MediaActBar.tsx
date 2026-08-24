import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CHIP_GAP, DISCOVER_QUIET } from './tokens';
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
 * THE SEARCH IS AN INLINE FILTER OVER MEDIA ALREADY ON THE PAGE
 * (MICRO_BRIEF_DISCOVER_MEDIA_SEARCH_INLINE §0 — §4.3 OVERTURNED IN PART).
 *
 * There is now a second search INPUT, and the part of §4.3 that mattered still
 * holds: there is NO second query hook, NO second result vocabulary and NO
 * second network path. This field filters only the photo, clip and video pools
 * already in memory — the same items the sections beneath it are rendering. It
 * cannot return a person, a course, a club or a post, so it cannot compete with
 * the global overlay's vocabulary.
 *
 * THE GLOBAL SEARCH IS UNTOUCHED AND STILL ONE TAP AWAY on the chrome island,
 * which owns SearchOverlayV2 and keeps people, courses, clubs and posts. This
 * bar no longer dispatches `clbhouz:open-search`: a control that pointed
 * elsewhere while sitting under the media chips was the one thing on the page
 * that did NOT govern what was below it. It does now, which is why this obeys
 * the rule above rather than breaking it.
 *
 * THE BAR IS A CONTROL, NOT A DATA OWNER. The matching lives in
 * ExploreTabContent where the pools live; this component holds no query state
 * of its own beyond the field.
 */

export type MediaChipId = 'all' | 'photos' | 'clips' | 'videos';

export const MEDIA_CHIPS: MediaChipId[] = ['all', 'photos', 'clips', 'videos'];

export function MediaActBar({
  chip,
  onChipChange,
  query,
  onQueryChange,
}: {
  chip: MediaChipId;
  onChipChange: (next: MediaChipId) => void;
  query: string;
  onQueryChange: (next: string) => void;
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
  const hasQuery = query.length > 0;

  return (
    <div>
      <PillFilterRow
        value={chip}
        options={options}
        onChange={onChipChange}
        ariaLabel={t('discover.media.chipsAria', 'Media type')}
      />

      {/* THE CANONICAL DARK FIELD, ON THE APP-WIDE FIELD SHAPE AND SIZE.
          Both channels step on focus (fill 6% → 10%, border 10% → 28%) and the
          border stays dimmer than the text.

          RADIUS 14 (sq-sm) and HEIGHT 44, not WELL_RADIUS
          (BRIEF_FIELD_SHAPE_AND_SIZE_CANON §0.1). The previous rule here was
          that Discover derives card 8 / well 7 / thumb 6 / chips 4 from one
          constant, so a compact control taking a full-field radius breaks that
          derivation. OVERTURNED: a text input is a text input wherever it sits,
          and a member moving between Discover, auth and the search overlay
          should meet ONE control, not three variants of one. Consistency across
          the app beats internal consistency within one page's scale. The pills,
          chips and filter wells above are NOT text inputs and keep their
          derived radii. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          width: '100%',
          height: 44,
          padding: '0 12px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          marginTop: CHIP_GAP,
          transition: 'background 140ms ease, border-color 140ms ease',
        }}
        onFocusCapture={(e) => {
          const el = e.currentTarget;
          el.style.background = 'rgba(255,255,255,0.10)';
          el.style.borderColor = 'rgba(255,255,255,0.28)';
        }}
        onBlurCapture={(e) => {
          const el = e.currentTarget;
          el.style.background = 'rgba(255,255,255,0.06)';
          el.style.borderColor = 'rgba(255,255,255,0.10)';
        }}
      >
        <Search
          size={15}
          color={hasQuery ? 'rgba(255,255,255,0.62)' : DISCOVER_QUIET}
          strokeWidth={2.4}
          aria-hidden
          style={{ flex: 'none' }}
        />
        {/* type="text", NOT type="search": a search input draws the UA's own
            clear button, which would sit beside ours. */}
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            // Nothing to submit — filtering is live, so Enter just dismisses
            // the keyboard.
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          placeholder={t('discover.media.searchPlaceholder', 'Search photos, clips and videos')}
          aria-label={t('discover.media.searchPlaceholder', 'Search photos, clips and videos')}
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.96)',
            fontSize: 13,
            fontWeight: 600,
          }}
        />
        {/* WITHOUT A CLEAR CONTROL a member who filters and scrolls has no
            visible way back and the sections below look broken. */}
        {hasQuery && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label={t('discover.media.searchClear', 'Clear search')}
            style={{
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <X size={15} color="rgba(255,255,255,0.62)" strokeWidth={2.4} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

export default MediaActBar;

