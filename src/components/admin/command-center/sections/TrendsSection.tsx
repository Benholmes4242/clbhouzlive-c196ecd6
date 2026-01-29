import { TrendChart } from '../TrendChart';
import { KpiCard } from '../KpiCard';
import { FileText, Star, MessageSquare, Image } from 'lucide-react';
import type { TrendsMetrics, ContentMetrics } from '@/features/admin/hooks/useCommandCenterMetrics';

interface TrendsSectionProps {
  trendsData: TrendsMetrics | undefined;
  contentData: ContentMetrics | undefined;
  trendsLoading: boolean;
  contentLoading: boolean;
}

export function TrendsSection({ 
  trendsData, 
  contentData,
  trendsLoading,
  contentLoading
}: TrendsSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Activity Trends (14 days)</h2>
      
      {/* Content Stats Row - 16px gap within section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <KpiCard
          title="Posts Today"
          value={contentData?.postsToday ?? 0}
          icon={Image}
          isLoading={contentLoading}
          subtitle={`${contentData?.postsThisWeek ?? 0} this week`}
        />
        
        <KpiCard
          title="Reviews Today"
          value={contentData?.reviewsToday ?? 0}
          icon={Star}
          isLoading={contentLoading}
          subtitle={`${contentData?.reviewsThisWeek ?? 0} this week`}
        />
      </div>
      
      {/* Trend Charts - 16px gap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TrendChart
          title="User Signups"
          data={trendsData?.userSignups ?? []}
          type="bar"
          color="primary"
          isLoading={trendsLoading}
        />
        
        <TrendChart
          title="Post Activity"
          data={trendsData?.postActivity ?? []}
          type="area"
          color="emerald"
          isLoading={trendsLoading}
        />
        
        <TrendChart
          title="Course Reviews"
          data={trendsData?.reviewActivity ?? []}
          type="bar"
          color="amber"
          isLoading={trendsLoading}
        />
      </div>
    </section>
  );
}
