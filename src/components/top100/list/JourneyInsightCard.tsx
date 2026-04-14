import React from 'react';
import { motion } from 'framer-motion';

interface JourneyInsightCardProps {
  insight: string;
  subtext?: string;
}

/**
 * Neutral insight card inserted between course cards to break scroll fatigue.
 * Shows progress stats or interesting comparisons.
 */
export const JourneyInsightCard: React.FC<JourneyInsightCardProps> = ({
  insight,
  subtext,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-4 my-4 px-5 py-5 rounded-sq-lg"
      style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
    >
      {/* Subtle accent line */}
      <div className="w-8 h-0.5 rounded-full mb-3" style={{ backgroundColor: 'rgba(247,147,30,0.60)' }} />
      
      <p className="text-[15px] font-semibold text-foreground leading-relaxed">
        {insight}
      </p>
      {subtext && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          {subtext}
        </p>
      )}
    </motion.div>
  );
};

// Helper to generate insights based on progress data
export function generateJourneyInsights(
  playedCourses: { id: string; country: string; rank: number }[],
  totalInList: number,
  listSlug?: string,
): string[] {
  const insights: string[] = [];
  const playedCount = playedCourses.length;

  if (playedCount === 0) return [];

  // Count by country
  const countryCounts = playedCourses.reduce((acc, c) => {
    acc[c.country] = (acc[c.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0];

  // Insights for GB&I list
  if (listSlug === 'gb-i') {
    if (countryCounts['Scotland'] && countryCounts['Scotland'] >= 3) {
      insights.push(`You've played ${countryCounts['Scotland']} Scottish links courses — true dedication.`);
    }
    if (countryCounts['Ireland'] && countryCounts['Ireland'] >= 2) {
      insights.push(`${countryCounts['Ireland']} Irish courses down. The emerald isle approves.`);
    }
    if (countryCounts['England'] && countryCounts['England'] >= 3) {
      insights.push(`${countryCounts['England']} English courses played — from heathland to links.`);
    }
  }

  // Generic insights
  if (playedCount >= 10) {
    insights.push(`Double digits! You've played ${playedCount} courses from this list.`);
  }

  if (playedCount >= 25) {
    insights.push(`Quarter century — ${playedCount} courses and counting. Impressive commitment.`);
  }

  // Top 10 progress
  const top10Played = playedCourses.filter(c => c.rank <= 10).length;
  if (top10Played >= 5) {
    insights.push(`${top10Played} of the Top 10 played — you're targeting the best.`);
  }

  // Remaining courses
  const remaining = totalInList - playedCount;
  if (remaining <= 20 && remaining > 0) {
    insights.push(`Only ${remaining} courses left. The finish line is in sight.`);
  }

  return insights;
}
