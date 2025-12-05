import React from 'react';
import { Share2 } from 'lucide-react';
import type { ShareMoment } from '@/lib/top100ProgressSelectors';

interface Top100ShareMomentTeaserProps {
  moment: ShareMoment | null;
  onShareClick: () => void;
}

export function Top100ShareMomentTeaser({ moment, onShareClick }: Top100ShareMomentTeaserProps) {
  if (!moment) return null;

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={onShareClick}
        className="w-full rounded-sq-md border border-border/60 bg-card px-4 py-3 text-left shadow-[0_8px_20px_rgba(15,23,42,0.04)] flex items-center justify-between gap-3 hover:bg-accent/30 transition-colors"
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Share a Top 100 moment
          </div>
          <div className="text-sm text-foreground mt-0.5">
            {moment.courseName}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {moment.country} · {moment.playedAt}
            {moment.rating != null && (
              <> · You rated it <span className="font-semibold">{moment.rating}</span></>
            )}
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/90">
          <Share2 className="h-4 w-4 text-background" />
        </div>
      </button>
    </section>
  );
}
