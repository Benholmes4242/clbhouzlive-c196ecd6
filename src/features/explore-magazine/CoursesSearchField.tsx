import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';

/**
 * THE MERGED COURSES SEARCH FIELD (BRIEF_COURSES_MERGED §6).
 *
 * CANONICAL DARK FIELD TREATMENT, the same one the search overlay wears: rest
 * background 6% / border 10%, focus 10% / 28%, text 96%, placeholder 38%, height
 * 44, rounded-sq-sm. A text input is a text input wherever it sits.
 *
 * RESULTS REPLACE THE PAGE, NOT THE CONTROLS: this field, the scope row and the
 * chips above it all stay mounted, which is the member's way back.
 */
export function CoursesSearchField({
  value,
  onChange,
  /* ADDITIVE, DEFAULTS UNCHANGED: the merged Explore Courses view keeps the
     original padding, placeholder and non-focusing behaviour. The Courses hub
     and Top 100 inline search pass their own so one field serves all three
     rather than a fourth look-alike being written. */
  padding = '0 12px 10px',
  placeholder,
  autoFocus = false,
}: {
  value: string;
  onChange: (next: string) => void;
  padding?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation('courses');
  return (
    <div style={{ padding }}>
      <div
        className="flex items-center gap-2 px-3 rounded-sq-sm"
        style={{
          height: 44,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: A.MUTE }} />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('amateur.courses.searchPlaceholder', 'Search courses, regions and reviews')}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[rgba(255,255,255,0.38)]"
          style={{ color: 'rgba(255,255,255,0.96)', fontFamily: SANS, minWidth: 0 }}
          autoComplete="off"
          spellCheck="false"
          aria-label={t('amateur.courses.searchPlaceholder', 'Search courses, regions and reviews')}
        />
        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={t('amateur.courses.searchClear', 'Clear search')}
            className="shrink-0 flex items-center justify-center"
            style={{ width: 24, height: 24, borderRadius: 999, border: 0, background: 'rgba(255,255,255,0.14)' }}
          >
            <X className="w-3 h-3" style={{ color: A.INK }} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default CoursesSearchField;
