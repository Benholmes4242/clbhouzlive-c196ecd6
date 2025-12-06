import React, { useState } from 'react';
import { mockNews } from '@/data/tourMock';
import { TourType } from '@/types/tour';

type Filter = TourType | 'ALL';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'PGA', label: 'PGA' },
  { id: 'LIV', label: 'LIV' },
  { id: 'DP_WORLD', label: 'DP World' },
  { id: 'LPGA', label: 'LPGA' },
  { id: 'NCAA_MEN', label: 'NCAA Men' },
  { id: 'NCAA_WOMEN', label: 'NCAA Women' },
];

export function TourNewsView() {
  const [filter, setFilter] = useState<Filter>('ALL');

  const articles = mockNews.filter(article =>
    filter === 'ALL' ? true : article.tour === filter,
  );

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs [-webkit-overflow-scrolling:touch]">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-sq-pill border px-3 py-1.5 whitespace-nowrap transition-colors ${
              filter === f.id 
                ? 'bg-foreground text-background border-foreground' 
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {articles.length === 0 && (
        <div className="rounded-sq-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No news found for this tour right now.
          <div className="mt-2">
            Try switching to "All" or check back closer to tournament week.
          </div>
        </div>
      )}

      <div className="space-y-3">
        {articles.map(article => (
          <article
            key={article.id}
            className="flex gap-3 rounded-sq-lg border border-border bg-card p-3 hover:bg-muted/20 transition-colors cursor-pointer"
          >
            {article.imageUrl ? (
              <img
                src={article.imageUrl}
                className="h-16 w-20 flex-shrink-0 rounded-sq-sm object-cover"
                alt={article.title}
              />
            ) : (
              <div className="h-16 w-20 flex-shrink-0 rounded-sq-sm border border-dashed border-border bg-muted/30" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2">{article.title}</h3>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{article.summary}</p>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{article.source}</span>
                <span>•</span>
                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                {article.tag && (
                  <>
                    <span>•</span>
                    <span className="rounded-sq-pill bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {article.tag}
                    </span>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
