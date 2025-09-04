import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, CheckCircle } from 'lucide-react';
import { SwingAnalysisSummary } from './SwingReview';

interface SummaryCardProps {
  summary: SwingAnalysisSummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {summary.club} – Swing Breakdown
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-3 w-3" />
            <span>{summary.date}</span>
            {summary.lie && (
              <>
                <span>•</span>
                <span>{summary.lie}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Strengths */}
        {summary.strengths.map((strength, index) => (
          <Badge 
            key={`strength-${index}`}
            variant="secondary" 
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {strength}
          </Badge>
        ))}
        
        {/* Priority Fix */}
        <Badge 
          variant="secondary"
          className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
        >
          ⚠️ {summary.priorityFix}
        </Badge>
        
        {/* Recommended Drill */}
        <Badge 
          variant="secondary"
          className="bg-brand-orange/10 text-brand-orange border-brand-orange/20 hover:bg-brand-orange/20"
        >
          <Target className="h-3 w-3 mr-1" />
          {summary.recommendedDrill}
        </Badge>
      </div>

      {/* Coach Verdict */}
      <div className="bg-muted/50 rounded-lg p-3 border border-muted">
        <p className="text-sm font-medium text-foreground">
          Coach verdict: <span className="font-normal">{summary.verdict}</span>
        </p>
      </div>
    </div>
  );
};