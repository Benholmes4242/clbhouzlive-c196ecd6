import { useTranslation } from 'react-i18next';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { SCOPE_PILL_RADIUS } from '../courseled/tokens';
import type { ExploreLens } from '../hooks/useExploreLens';

/**
 * ScopePills — the RELEVANCE lens for Around the World
 * (BRIEF_DISCOVER_RELEVANCE A1). Geography is retired as a filter axis: at
 * platform volume the question is not WHERE a course is but whether it means
 * anything to this member. Same pill chrome, position and pin behaviour as the
 * region pills it replaces.
 */

// Display order (BRIEF_GOLF_THIS_WEEK §3): Suggested leads and is the default lens.
export const LENS_ORDER: ExploreLens[] = ['suggested', 'worldwide', 'top_100', 'played'];

interface Props {
  lens: ExploreLens;
  onChange: (lens: ExploreLens) => void;
  /** Outer margin applied to the sticky element itself. It must NOT be moved
   *  onto a wrapper div: a wrapper is the pills' containing block and, being
   *  exactly their height, gives position:sticky zero travel (the pills then
   *  never pin). Keeping the margin here lets the owning <section> bound the
   *  sticky range, so the pills release when the section scrolls past. */
  style?: React.CSSProperties;
}


export function lensLabelKey(lens: ExploreLens): { key: string; fallback: string } {
  switch (lens) {
    case 'suggested':
      return { key: 'discover.lens.suggested', fallback: 'Suggested' };
    case 'top_100':
      return { key: 'discover.lens.top100', fallback: 'Top 100' };
    case 'played':
      return { key: 'discover.lens.played', fallback: 'Played' };
    case 'worldwide':
    default:
      return { key: 'discover.lens.worldwide', fallback: 'Worldwide' };
  }
}

export function ScopePills({ lens, onChange, style }: Props) {
  const { t } = useTranslation('courses');
  return (
    <div
      role="tablist"
      aria-label={t('discover.lens.ariaLabel', 'Relevance')}
      className="scrollbar-hide"
      style={{
        position: 'sticky',
        top: 'var(--sat, 0px)',
        zIndex: 10,
        background: A.CANVAS,
        borderBottom: `1px solid ${A.BORDER}`,
        padding: '12px 16px',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        ...style,
      }}
    >

      {LENS_ORDER.map((id) => {
        const active = id === lens;
        const { key, fallback } = lensLabelKey(id);
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            style={{
              flex: 'none',
              border: `1px solid ${active ? A.INK : A.BORDER}`,
              background: active ? A.INK : A.PANEL,
              color: active ? A.PANEL : A.INK,
              borderRadius: SCOPE_PILL_RADIUS,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: SANS,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {t(key, fallback)}
          </button>
        );
      })}
    </div>
  );
}

export default ScopePills;
