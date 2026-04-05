import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { MapPin, ChevronLeft } from 'lucide-react';
import { useWatchCategoryChips } from './hooks/useWatchCategoryChips';
import { useWatchFeed } from './hooks/useWatchFeed';
import WatchAutoplay from './WatchAutoplay';
import WatchGrid from './WatchGrid';
import { Skeleton } from '@/components/ui/skeleton';

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
      className="shrink-0 flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-[13px] font-semibold active:scale-[0.97] transition-transform"
      style={{
        background: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted))',
        color: isActive ? 'hsl(var(--background))' : 'hsl(var(--foreground))',
      }}
    >
      {icon}
      {label}
    </button>
  );
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
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4" style={{ paddingTop: 12, paddingBottom: 8 }}>
        <button
          onClick={() => navigate(-1)}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{ background: 'rgba(0,0,0,0.06)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[18px] font-bold text-foreground">
          Clips
        </span>
        <div className="flex-1" />
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
    </div>
  );
}
