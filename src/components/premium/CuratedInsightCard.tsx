/**
 * CuratedInsightCard - Phase 8: Editorial course insights
 * Future-proofing for premium content
 */
import React from 'react';
import { Lightbulb, Calendar, Sun, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CuratedInsight {
  id: string;
  type: 'best_time' | 'local_knowledge' | 'play_tip' | 'general';
  title: string;
  content: string;
  isPremium?: boolean;
}

interface CuratedInsightCardProps {
  insight: CuratedInsight;
  className?: string;
}

const insightIcons: Record<CuratedInsight['type'], React.ReactNode> = {
  best_time: <Calendar className="h-4 w-4" />,
  local_knowledge: <Lightbulb className="h-4 w-4" />,
  play_tip: <Sun className="h-4 w-4" />,
  general: <Info className="h-4 w-4" />,
};

const insightLabels: Record<CuratedInsight['type'], string> = {
  best_time: 'Best Time to Play',
  local_knowledge: 'Local Knowledge',
  play_tip: 'Playing Tip',
  general: 'Insight',
};

export const CuratedInsightCard: React.FC<CuratedInsightCardProps> = ({
  insight,
  className,
}) => {
  const icon = insightIcons[insight.type] || insightIcons.general;
  const label = insightLabels[insight.type] || insightLabels.general;

  return (
    <div className={cn(
      "bg-slate-50 rounded-xl p-4 space-y-2",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-base font-semibold text-slate-900">
        {insight.title}
      </h4>

      {/* Content */}
      <p className="text-sm text-slate-600 leading-relaxed">
        {insight.content}
      </p>
    </div>
  );
};

/**
 * Container for multiple insights on a course page
 */
interface CuratedInsightsSectionProps {
  insights: CuratedInsight[];
  className?: string;
}

export const CuratedInsightsSection: React.FC<CuratedInsightsSectionProps> = ({
  insights,
  className,
}) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-slate-700">Insights</h3>
      <div className="space-y-3">
        {insights.map((insight) => (
          <CuratedInsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
};

export default CuratedInsightCard;
