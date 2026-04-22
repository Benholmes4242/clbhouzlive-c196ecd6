import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { MapPin, ChevronLeft } from 'lucide-react';
import PageRoot from '@/components/layout/PageRoot';
import { useWatchCategoryChips } from './hooks/useWatchCategoryChips';
import { useWatchFeed } from './hooks/useWatchFeed';
import WatchAutoplay from './WatchAutoplay';
import WatchGrid from './WatchGrid';
import { Skeleton } from '@/components/ui/skeleton';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

interface ChipButtonProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onTap: () => void;
}

function ChipButton({ label, icon, isActive, onTap }: ChipButtonProps) {
  return (
    <button
      onClick={onTap}
      className="shrink-0 flex items-center gap-1.5 active:scale-[0.97] transition-transform"
      style={{
        height: 36,
        padding: '0 14px',
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 999,
        background: isActive ? '#0F172A' : '#FFFFFF',
        border: isActive ? '1px solid transparent' : '1px solid rgba(15,23,42,0.12)',
        color: isActive ? '#FFFFFF' : '#0F172A',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

const SUBHEAD_BY_TAG: Record<string, string> = {
  all: 'Tailored to your taste',
  near: 'Filmed near you',
};
function getSubheadForTag(tag: string, chipLabel?: string): string {
  if (SUBHEAD_BY_TAG[tag]) return SUBHEAD_BY_TAG[tag];
  if (chipLabel) return `${chipLabel} from across the community`;
  return 'Shorts from the community';
}

export default function ClipsSubpage() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const [activeTag, setActiveTag] = useState<string>('all');
  const gridRef = useRef<HTMLDivElement>(null);

  const { data: categoryChips = [], isLoading: chipsLoading } = useWatchCategoryChips();
  const activeCategory = (activeTag === 'all' || activeTag === 'near') ? undefined : activeTag;
  const activeFilter = activeTag === 'near' ? 'near' as const : 'trending' as const;

  const {
    posts, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch,
  } = useWatchFeed({ userId, filter: activeFilter, category: activeCategory });

  return (
    <PageRoot className="bg-background min-h-screen" hasBottomNav={true}>
      {/* Sticky header + chips block */}
      <div style={{ position: 'sticky', top: '0px', zIndex: 20, background: 'hsl(var(--background))' }}>
        {/* Header */}
        <div className="flex items-start gap-3 px-4" style={{ paddingTop: 12, paddingBottom: 8 }}>
          <button
            onClick={() => navigate(-1)}
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-[0.97] transition-transform mt-[2px]"
            style={{ background: 'rgba(0,0,0,0.06)' }}
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[18px] font-bold text-foreground leading-tight">
              Clips
            </div>
            <div
              className="leading-tight"
              style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}
            >
              {getSubheadForTag(
                activeTag,
                categoryChips.find(c => c.id === activeTag)?.label,
              )}
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ padding: '4px 0 8px' }}>
          <div className="flex gap-2 overflow-x-auto px-4" style={{ scrollbarWidth: 'none' }}>
            <ChipButton label="For you" isActive={activeTag === 'all'} onTap={() => setActiveTag('all')} />
            <ChipButton label="Nearby" icon={<MapPin size={13} />} isActive={activeTag === 'near'} onTap={() => setActiveTag('near')} />
            {chipsLoading
              ? [0, 1, 2].map(i => <Skeleton key={i} className="shrink-0 w-[72px] h-[34px] rounded-full" />)
              : categoryChips.map(chip => (
                  <ChipButton key={chip.id} label={chip.label} isActive={activeTag === chip.id} onTap={() => setActiveTag(chip.id)} />
                ))
            }
          </div>
        </div>
      </div>

      {/* 2-col clip grid with autoplay */}
      <WatchAutoplay posts={posts} gridRef={gridRef as React.RefObject<HTMLDivElement>} />
      <WatchGrid
        posts={posts}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        gridRef={gridRef as React.RefObject<HTMLDivElement>}
        userId={userId}
      />
      <ScrollToTopGlass />
    </PageRoot>
  );
}
