import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { LengthKey } from '../components/videos/VideoChipRail';

export function useVideoLengthFilter() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const value = (params.get('duration') as LengthKey) || 'all';

  const set = (next: LengthKey) => {
    const newParams = new URLSearchParams(params);
    if (next === 'all') {
      newParams.delete('duration');
    } else {
      newParams.set('duration', next);
    }
    navigate({ search: `?${newParams.toString()}` }, { replace: true });
  };

  return [value, set] as const;
}

// Translate key -> seconds range
export function lengthToRange(
  key: LengthKey
): { min?: number; max?: number } | undefined {
  switch (key) {
    case 'shorts':
      return { max: 59 };
    case 'under4':
      return { min: 60, max: 239 };
    case '4to20':
      return { min: 240, max: 1200 };
    case 'over20':
      return { min: 1201 };
    default:
      return undefined;
  }
}
