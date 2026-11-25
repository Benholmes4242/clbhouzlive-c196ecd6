import { PillFilterRow } from '@/components/explore-tab-new/courseled/PillFilterRow';
import { useTranslation } from 'react-i18next';
import type { Scope } from '../hooks/useGlobalSearchV2';

/**
 * Search scopes render the SHARED Discover pill row (PillFilterRow), not a
 * local copy. The previous implementation hand-styled its own active/inactive
 * pair with the ACTIVE state hardcoded to ink-on-white, which is exactly how
 * four surfaces end up with four different pills. Geometry, radius, padding,
 * type and both states now come from one place.
 */
/** Brief 26 order. */
export const SCOPE_ORDER: Scope[] = ['all', 'people', 'pros', 'clubs', 'businesses', 'courses', 'players', 'videos', 'posts'];
const DEFAULT_LABELS: Record<string, string> = {
  all: 'All', people: 'People', pros: 'Pros & coaches', clubs: 'Clubs', businesses: 'Businesses',
  courses: 'Courses', players: 'Players', videos: 'Videos', posts: 'Posts',
};

interface Props {
  scope: Scope;
  onChange: (s: Scope) => void;
}

export function ScopeChips({ scope, onChange }: Props) {
  const { t } = useTranslation('common');
  const CHIPS = SCOPE_ORDER.map((value) => ({
    value,
    label: value === 'pros' || value === 'businesses'
      ? t(`search.scope.${value}`, { defaultValue: DEFAULT_LABELS[value] })
      : DEFAULT_LABELS[value],
  }));
  return (
    <div className="w-full md:max-w-[560px]" style={{ padding: '10px 16px 6px' }}>
      <PillFilterRow
        value={scope}
        options={CHIPS}
        onChange={onChange}
        ariaLabel="Search scope"
      />
    </div>
  );
}
