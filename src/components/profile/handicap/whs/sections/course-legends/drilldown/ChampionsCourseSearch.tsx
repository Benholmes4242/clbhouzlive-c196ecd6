import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, MapPin } from 'lucide-react';
import { useCourseSearch } from '@/hooks/gam/useCourseSearch';
import { useDebounce } from '@/hooks/use-debounce';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { CourseEyebrow } from '../_shared/CourseEyebrow';
import { GAM } from '../../../gam/tokens';
import {
  FIELD_HEIGHT,
  FIELD_RADIUS,
  FIELD_REST_BG,
  FIELD_REST_BORDER,
  FIELD_FOCUS_BG,
  FIELD_FOCUS_BORDER,
  FIELD_INK,
  FIELD_PLACEHOLDER,
} from '@/lib/tokens/field';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * CANONICAL FIELD TREATMENT. Rest 6% fill / 10% border, focus 10% / 28%,
 * radius 14, height 44 - the same control as every other search field on the
 * dark baseline. The height lives on the box and the padding is horizontal
 * ONLY: the collapsed button and the expanded field previously carried
 * different vertical padding ('11px 13px' vs '10px 14px'), so the control
 * changed height on tap. One fixed height removes that jump.
 */

interface Props {
  /** Optional id to exclude from results (the current course). */
  currentCourseId?: string;
}

/**
 * Compact in-tab search for hopping to another course's Champions tab.
 * Collapsed by default; taps expand into the search input.
 */
export const ChampionsCourseSearch: React.FC<Props> = ({ currentCourseId }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const { data: results, isLoading } = useCourseSearch(debounced);
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: connection, isFetched } = useWhsConnection(user?.id);

  const showResults = debounced.trim().length >= 2;
  const filtered = (results ?? []).filter((r) => r.id !== currentCourseId);
  /* UNRESOLVED IS NOT ABSENT: useWhsConnection is disabled until userId exists,
     and a disabled React Query v5 query is pending with fetchStatus 'idle', so
     isLoading is FALSE before it has ever run. Gate on settled instead. */
  const settled = !sessionLoading && isFetched;
  const showConnectCue = Boolean(user) && settled && !connection;

  return (
    <div style={{ padding: '14px 16px 4px' }}>
      {/* ::placeholder is unreachable from an inline style, so the one rule the
          field needs is scoped to this input by class. */}
      <style>{`.champions-course-search-input::placeholder{color:${FIELD_PLACEHOLDER};}`}</style>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: FIELD_REST_BG,
            border: `1px solid ${FIELD_REST_BORDER}`,
            borderRadius: FIELD_RADIUS,
            height: FIELD_HEIGHT,
            padding: '0 13px',
            cursor: 'pointer',
            fontFamily: FONT,
            textAlign: 'left',
          }}
        >
          <Search size={15} color="var(--hcp-t-40)" strokeWidth={2.2} />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--hcp-t-50)' }}>
            Search another course's champions
          </span>
          <ChevronRight size={15} color="var(--hcp-t-40)" />
        </button>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: focused ? FIELD_FOCUS_BG : FIELD_REST_BG,
            border: `1px solid ${focused ? FIELD_FOCUS_BORDER : FIELD_REST_BORDER}`,
            borderRadius: FIELD_RADIUS,
            height: FIELD_HEIGHT,
            padding: '0 13px',
            transition: 'background 140ms ease, border-color 140ms ease',
          }}
        >
          <Search size={16} color="var(--hcp-t-40)" strokeWidth={2.2} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search another course's champions…"
            autoFocus
            className="champions-course-search-input"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: FONT,
              fontSize: 14,
              color: FIELD_INK,
              minWidth: 0,
            }}
          />
          <button
            type="button"
            onClick={() => { setQuery(''); setOpen(false); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--hcp-gold-text)',
              padding: 0,
              flexShrink: 0,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {open && showConnectCue && (
        <button
          type="button"
          onClick={() => navigate('/handicap')}
          style={{
            marginTop: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            padding: '2px 4px',
            cursor: 'pointer',
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.005em',
          }}
        >
          Connect your handicap to see where you'd rank
          <ChevronRight size={11} strokeWidth={2.4} />
        </button>
      )}

      {open && showResults && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: 'min(360px, 45dvh)',
            overflowY: 'auto',
          }}
        >
          {isLoading && (
            <div
              style={{
                padding: 12,
                fontFamily: FONT,
                fontSize: 12,
                color: 'var(--hcp-t-50)',
              }}
            >
              Searching…
            </div>
          )}
          {/* eslint-disable-next-line settled/no-not-loading-empty-check -- this branch renders only under showResults (term >= 2 chars), so the search query is enabled. */}
          {!isLoading && filtered.length === 0 && (
            <div
              style={{
                padding: 12,
                fontFamily: FONT,
                fontSize: 12,
                color: 'var(--hcp-t-50)',
              }}
            >
              No matches for "{debounced.trim()}".
            </div>
          )}
          {filtered.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => navigate(`/courses/${c.id}?tab=legends`)}
              style={{
                background: 'var(--hcp-bg-1)',
                border: '1px solid var(--hcp-line)',
                borderRadius: 12,
                padding: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontFamily: FONT,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '34%',
                  background: 'linear-gradient(135deg, var(--hcp-bg-3), var(--hcp-bg-2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--hcp-t-60)',
                }}
              >
                <MapPin size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <CourseEyebrow type={c.course_type} region={c.region} country={c.country} />
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: 'var(--hcp-t-100)',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.name}
                </div>
              </div>
              <ChevronRight size={16} color="var(--hcp-t-60)" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChampionsCourseSearch;
