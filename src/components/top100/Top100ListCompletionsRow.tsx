import React from 'react';
import type { Top100ListProgress } from '@/hooks/useTop100ProgressForUser';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';

// Base labels - "Complete" suffix added dynamically when list is finished
const LIST_BASE_LABELS: Record<string, string> = {
  global: 'World Top 100',
  'gb-i': 'GB&I Top 100',
  usa: 'USA Top 100',
  europe: 'Europe Top 100',
};

// Get label based on completion status
function getListLabel(slug: string, isComplete: boolean): string {
  const base = LIST_BASE_LABELS[slug] || 'Top 100';
  return isComplete ? `${base} ✓` : base;
}

const TIER_MAP: Record<string, EliteCardTier> = {
  global: 'WORLD',
  'gb-i': 'GBI',
  usa: 'USA',
  europe: 'EU',
};

const COMPLETION_LIST_SLUGS = ['global', 'usa', 'gb-i', 'europe'] as const;

interface Top100ListCompletionsRowProps {
  lists: Top100ListProgress[];
  onCardClick: (slug: string, played: number, total: number) => void;
}

export const Top100ListCompletionsRow: React.FC<Top100ListCompletionsRowProps> = ({
  lists,
  onCardClick,
}) => {
  // Order the lists according to COMPLETION_LIST_SLUGS
  const ordered = COMPLETION_LIST_SLUGS.map(slug =>
    lists.find(l => l.listSlug === slug) ?? null
  );

  return (
    <div className="mt-10 px-4">
      {/* Section header */}
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
        Top 100 list completions
      </p>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {ordered.map((progress, idx) => {
          const slug = COMPLETION_LIST_SLUGS[idx];
          const played = progress?.played ?? 0;
          const total = progress?.total ?? 100;
          const complete = played >= total && total > 0;

          return (
            <button
              key={slug}
              type="button"
              onClick={() => onCardClick(slug, played, total)}
              className="text-left"
              aria-label={`${getListLabel(slug, complete)}: ${played} of ${total} courses played`}
            >
              <EliteGameCard
                tier={TIER_MAP[slug]}
                earned={complete}
                currentProgress={played}
                targetProgress={total}
                title={getListLabel(slug, complete)}
                subtitle={complete ? `${total} / ${total} courses` : `${played} / ${total} courses`}
                enableAnimations={false}
                quality="medium"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
