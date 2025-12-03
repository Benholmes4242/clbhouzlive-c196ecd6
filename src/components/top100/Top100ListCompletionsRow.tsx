import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import type { Top100ListProgress } from '@/hooks/useTop100ProgressForUser';

// Region colors - teal/green/red/violet
const REGION_COLORS: Record<string, { primary: string; bg: string }> = {
  global: { primary: '#1f9f9b', bg: 'rgba(31, 159, 155, 0.06)' },
  'gb-i': { primary: '#1f7a3a', bg: 'rgba(31, 122, 58, 0.06)' },
  usa: { primary: '#c5443b', bg: 'rgba(197, 68, 59, 0.06)' },
  europe: { primary: '#6554c0', bg: 'rgba(101, 84, 192, 0.06)' },
};

const LIST_LABELS: Record<string, string> = {
  global: 'Worldwide',
  'gb-i': 'GB&I',
  usa: 'USA',
  europe: 'Europe',
};

const COMPLETE_LABELS: Record<string, string> = {
  global: 'Worldwide 100',
  'gb-i': 'GB&I 100',
  usa: 'USA 100',
  europe: 'Europe 100',
};

const COMPLETION_LIST_SLUGS = ['global', 'gb-i', 'usa', 'europe'] as const;

interface Top100ListCompletionsRowProps {
  lists: Top100ListProgress[];
  onOpenList?: (slug: string) => void;
}

export const Top100ListCompletionsRow: React.FC<Top100ListCompletionsRowProps> = ({
  lists,
  onOpenList,
}) => {
  const navigate = useNavigate();

  const handleClick = (slug: string) => {
    if (onOpenList) {
      onOpenList(slug);
    } else {
      navigate(`/top100/${slug}`);
    }
  };

  // Order the lists according to COMPLETION_LIST_SLUGS
  const ordered = COMPLETION_LIST_SLUGS.map(slug =>
    lists.find(l => l.listSlug === slug) ?? null
  );

  return (
    <div className="mt-4">
      <p className="text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground mb-3 px-5">
        Top 100 list completions
      </p>

      <div className="flex gap-3 overflow-x-auto pb-1 px-5 scrollbar-hide">
        {ordered.map((progress, idx) => {
          const slug = COMPLETION_LIST_SLUGS[idx];
          if (!progress) {
            // Render placeholder for missing list data
            return (
              <button
                key={slug}
                type="button"
                onClick={() => handleClick(slug)}
                className="min-w-[140px] flex-shrink-0 px-3 py-3 rounded-[18px] border text-xs flex flex-col justify-center cursor-pointer transition-all bg-muted/30 border-border/40"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {LIST_LABELS[slug]} Top 100
                  </span>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  0 / ? courses played
                </div>
              </button>
            );
          }

          const complete = progress.played >= progress.total && progress.total > 0;
          const remaining = Math.max(0, progress.total - progress.played);
          const colors = REGION_COLORS[slug] || REGION_COLORS.global;

          return (
            <button
              key={slug}
              type="button"
              onClick={() => handleClick(slug)}
              className="min-w-[140px] flex-shrink-0 px-3 py-3 rounded-[18px] border text-xs flex flex-col justify-center cursor-pointer transition-all active:scale-[0.98]"
              style={{
                backgroundColor: complete ? colors.bg : 'rgba(241, 245, 249, 0.6)',
                borderColor: complete ? colors.primary : `${colors.primary}44`,
                boxShadow: complete 
                  ? `0 0 16px ${colors.primary}18` 
                  : '0 0 8px rgba(15,23,42,0.04)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span 
                  className="text-[12px] font-medium"
                  style={{ color: complete ? colors.primary : '#475569' }}
                >
                  {complete ? COMPLETE_LABELS[slug] : `${LIST_LABELS[slug]} Top 100`}
                </span>
                {complete ? (
                  <span 
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </span>
                ) : (
                  <span 
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border"
                    style={{ borderColor: `${colors.primary}66` }}
                  >
                    <Lock className="h-3 w-3" style={{ color: `${colors.primary}88` }} />
                  </span>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground">
                {progress.played} / {progress.total} courses played
                {!complete && remaining > 0 && (
                  <span className="ml-1">· {remaining} away</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
