import { memo } from 'react';
import { BIZ } from '@/components/business/businessTokens';
import { Skeleton } from '@/components/ui/skeleton';
import type { HeadlineStats } from '@/hooks/useBusinessAnalytics';

interface HeadlineGridProps {
  headline: HeadlineStats;
  isLoading?: boolean;
}

const TILES: Array<{ key: keyof HeadlineStats; label: string }> = [
  { key: 'profile_views', label: 'Profile views' },
  { key: 'directory_impressions', label: 'Directory impressions' },
  { key: 'click_outs', label: 'Click-outs' },
  { key: 'post_views', label: 'Post views' },
  { key: 'post_engagements', label: 'Post engagements' },
  { key: 'message_clicks', label: 'Message clicks' },
  { key: 'mentions', label: 'Mentions' },
];

function HeadlineGridInner({ headline, isLoading }: HeadlineGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
      {TILES.map((tile) => (
        <div
          key={tile.key}
          className="rounded-[12px] p-3"
          style={{ background: BIZ.fill, border: `1px solid ${BIZ.hairSoft}` }}
        >
          {isLoading ? (
            <>
              <Skeleton className="h-7 w-12 mb-1.5" />
              <Skeleton className="h-3 w-20" />
            </>
          ) : (
            <>
              <p
                className="text-[1.5rem] font-semibold tabular-nums leading-none"
                style={{ color: BIZ.ink, fontFeatureSettings: '"kern" 1, "liga" 1' }}
              >
                {(headline[tile.key] ?? 0).toLocaleString()}
              </p>
              <p className="text-[0.72rem] mt-1.5" style={{ color: BIZ.inkMute }}>
                {tile.label}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default memo(HeadlineGridInner);
