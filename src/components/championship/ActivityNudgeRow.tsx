import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';

interface ActivityNudgeRowProps {
  daysSinceLastLog: number;
  onLogCourse: () => void;
}

/**
 * ActivityNudgeRow - Slim inline activity nudge strip
 * 
 * Features:
 * - Slim inline strip, not a card
 * - Clock SVG icon, not emoji
 * - Clear CTA on right
 * - Only shows after 7+ days of inactivity
 */
export const ActivityNudgeRow: React.FC<ActivityNudgeRowProps> = ({
  daysSinceLastLog,
  onLogCourse,
}) => {
  if (daysSinceLastLog < 7) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">It's been {daysSinceLastLog} days</p>
        <p className="text-xs text-muted-foreground">Log a course to stay in the race</p>
      </div>
      <button
        onClick={onLogCourse}
        className="flex items-center gap-1 text-sm font-medium text-primary hover:underline flex-shrink-0"
      >
        Log course
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ActivityNudgeRow;
