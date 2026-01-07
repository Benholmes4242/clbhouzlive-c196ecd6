import React from 'react';
import type { Top100ListProgress } from '@/hooks/useTop100ProgressForUser';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';

const LIST_LABELS: Record<string, string> = {
  global: 'World Complete',
  'gb-i': 'GB&I Complete',
  usa: 'USA Complete',
  europe: 'Europe Complete',
};

const TIER_MAP: Record<string, AchievementTier> = {
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
      {/* Section header - lighter text, mb-4 */}
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
        Top 100 list completions
      </p>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {ordered.map((progress, idx) => {
          const slug = COMPLETION_LIST_SLUGS[idx];
          const played = progress?.played ?? 0;
          const total = progress?.total ?? 100;
          const complete = played >= total && total > 0;
          const remaining = Math.max(0, total - played);

          return (
            <button
              key={slug}
              type="button"
              onClick={() => onCardClick(slug, played, total)}
              className="text-left"
            >
              <AchievementBadgeCard
                tier={TIER_MAP[slug]}
                title={LIST_LABELS[slug]}
                subtitle={`${played} / ${total} courses`}
                unlocked={complete}
                remaining={complete ? undefined : remaining}
                playedOnList={played}
                totalOnList={total}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
