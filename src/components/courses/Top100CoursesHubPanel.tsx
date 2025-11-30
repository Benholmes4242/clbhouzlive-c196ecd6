import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ListsWithHero } from '@/hooks/useTop100ListsWithHero';
import { Top100RegionCard } from './Top100RegionCard';
import { Top100ClubSummary } from './Top100ClubSummary';
import { Skeleton } from '@/components/ui/skeleton';
import GlobalTop100 from './GlobalTop100';

const Top100CoursesHubPanel = () => {
  const { user } = useSupabaseSession();
  const { data: lists = [], isLoading } = useTop100ListsWithHero(user?.id);

  return (
    <div className="space-y-6">
      {/* Top 100 Club Summary */}
      <Top100ClubSummary />

      {/* Top 100 Region Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[200px] w-full rounded-[24px]" />
            ))}
          </>
        ) : (
          lists.map((list) => <Top100RegionCard key={list.id} list={list} />)
        )}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-slate-200/70" />

      {/* Full Top 100 List View */}
      <GlobalTop100 />
    </div>
  );
};

export default Top100CoursesHubPanel;
