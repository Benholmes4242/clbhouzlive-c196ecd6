import React from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import type { CourseSearchResult } from '@/hooks/gam/useCourseSearch';
import { Skeleton, EmptyStub, RetryStub } from '../../../../gam/_shared/GamAtoms';
import SectionHeader from '@/components/ui/SectionHeader';
import { CourseEyebrow } from '../_shared/CourseEyebrow';
import type { CourseSelection } from '../types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  query: string;
  results: CourseSearchResult[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectCourse: (c: CourseSelection) => void;
}

/**
 * Search results render as compact rows (no holder prefetch — search can be
 * any course). Tap takes the user into the existing drilldown which fetches
 * lazily.
 */
const SearchRow: React.FC<{
  c: CourseSearchResult;
  onTap: () => void;
}> = ({ c, onTap }) => (
  <div
    onClick={onTap}
    style={{
      background: 'var(--hcp-bg-1)',
      border: '1px solid var(--hcp-line)',
      borderRadius: 12,
      padding: 14,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: FONT,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '34%',
        background: 'linear-gradient(135deg, var(--hcp-bg-3), var(--hcp-bg-2))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--hcp-t-60)',
      }}
    >
      <MapPin size={18} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <CourseEyebrow type={c.course_type} region={c.region} country={c.country} />
      <div
        style={{
          fontSize: 14,
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
    <ChevronRight size={18} color="var(--hcp-t-60)" style={{ flexShrink: 0 }} />
  </div>
);

export const SearchResultsSubsection: React.FC<Props> = ({
  query,
  results,
  isLoading,
  isError,
  onRetry,
  onSelectCourse,
}) => {
  return (
    <>
      <div style={{ marginTop: 24 }}><SectionHeader tier="standard" kicker="SEARCH RESULTS" paddingX={16} /></div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading && <Skeleton height={68} radius={12} />}
        {isError && <RetryStub message="Couldn't search courses" onRetry={onRetry} />}
        {!isLoading && !isError && results.length === 0 && (
          <EmptyStub title="No matches" body={`Nothing found for "${query.trim()}".`} />
        )}
        {results.map((c) => (
          <SearchRow
            key={c.id}
            c={c}
            onTap={() =>
              onSelectCourse({
                courseId: c.id,
                courseName: c.name,
                courseRegion: c.region,
                courseCountry: c.country,
                courseType: c.course_type,
              })
            }
          />
        ))}
      </div>
    </>
  );
};

export default SearchResultsSubsection;
