import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, MapPin } from 'lucide-react';
import { useCourseSearch } from '@/hooks/gam/useCourseSearch';
import { useDebounce } from '@/hooks/use-debounce';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { CourseEyebrow } from '../_shared/CourseEyebrow';
import { GAM } from '../../../gam/tokens';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  /** Optional id to exclude from results (the current course). */
  currentCourseId?: string;
}

/**
 * Compact in-tab search for hopping to another course's Champions tab.
 * Always rendered (synced + non-synced). Non-synced users additionally
 * see a small inline "Connect your handicap" cue beneath.
 */
export const ChampionsCourseSearch: React.FC<Props> = ({ currentCourseId }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const { data: results, isLoading } = useCourseSearch(debounced);
  const { user } = useSupabaseSession();
  const { data: connection, isLoading: connLoading } = useWhsConnection(user?.id);

  const showResults = debounced.trim().length >= 2;
  const filtered = (results ?? []).filter((r) => r.id !== currentCourseId);
  const showConnectCue = Boolean(user) && !connLoading && !connection;

  return (
    <div style={{ padding: '14px 16px 4px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--hcp-bg-1, rgba(255,255,255,0.04))',
          border: '1px solid var(--hcp-line, rgba(15,23,42,0.08))',
          borderRadius: 12,
          padding: '10px 14px',
        }}
      >
        <Search size={16} color="#94A3B8" strokeWidth={2.2} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search another course's champions…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: FONT,
            fontSize: 14,
            color: 'var(--hcp-t-100, ' + GAM.INK + ')',
          }}
        />
      </div>

      {showConnectCue && (
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
            color: GAM.DEEP_AMBER,
            letterSpacing: '-0.005em',
          }}
        >
          Connect your handicap to see where you'd rank
          <ChevronRight size={11} strokeWidth={2.4} />
        </button>
      )}

      {showResults && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {isLoading && (
            <div
              style={{
                padding: 12,
                fontFamily: FONT,
                fontSize: 12,
                color: 'var(--hcp-t-50, #94a3b8)',
              }}
            >
              Searching…
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div
              style={{
                padding: 12,
                fontFamily: FONT,
                fontSize: 12,
                color: 'var(--hcp-t-50, #94a3b8)',
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
                background: 'var(--hcp-bg-1, #fff)',
                border: '1px solid var(--hcp-line, rgba(15,23,42,0.08))',
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
                  background: 'linear-gradient(135deg, var(--hcp-bg-3, #e2e8f0), var(--hcp-bg-2, #f1f5f9))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--hcp-t-60, #64748b)',
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
                    color: 'var(--hcp-t-100, ' + GAM.INK + ')',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.name}
                </div>
              </div>
              <ChevronRight size={16} color="var(--hcp-t-60, #94a3b8)" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChampionsCourseSearch;
