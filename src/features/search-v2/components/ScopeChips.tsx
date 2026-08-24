import { PillFilterRow } from '@/components/explore-tab-new/courseled/PillFilterRow';
import type { Scope } from '../hooks/useGlobalSearchV2';

/**
 * Search scopes render the SHARED Discover pill row (PillFilterRow), not a
 * local copy. The previous implementation hand-styled its own active/inactive
 * pair with the ACTIVE state hardcoded to ink-on-white, which is exactly how
 * four surfaces end up with four different pills. Geometry, radius, padding,
 * type and both states now come from one place.
 */
const CHIPS: { value: Scope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'people', label: 'People' },
  { value: 'courses', label: 'Courses' },
  { value: 'players', label: 'Players' },
  { value: 'clubs', label: 'Clubs' },
  { value: 'videos', label: 'Videos' },
  { value: 'posts', label: 'Posts' },
];

interface Props {
  scope: Scope;
  onChange: (s: Scope) => void;
}

export function ScopeChips({ scope, onChange }: Props) {
  return (
    <div className="w-full md:max-w-[560px]" style={{ padding: '10px 16px 6px' }}>
      <PillFilterRow<Scope>
        value={scope}
        options={CHIPS}
        onChange={onChange}
        ariaLabel="Search scope"
      />
    </div>
  );
}
