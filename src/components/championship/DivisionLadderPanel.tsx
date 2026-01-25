import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, Check, ChevronRight, Target } from 'lucide-react';

interface Division {
  id: string;
  name: string;
  threshold: number;
  color: string;
  status: 'locked' | 'current' | 'next' | 'completed';
}

interface DivisionLadderPanelProps {
  divisions: Division[];
  userCourses: number;
  coursesToNext: number;
  nextDivisionName: string;
  estimatedRounds?: number;
}

// Helper to create light tint from hex color
const getColorTint = (hexColor: string, opacity: number = 0.12): string => {
  return `${hexColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

/**
 * DivisionLadderPanel - Clean division ladder with milestone colors
 * 
 * Features:
 * - Uses each division's milestone color for styling
 * - Clear status icons in division colors
 * - "X to go" for next division
 * - Progress header with current division color
 */
export const DivisionLadderPanel: React.FC<DivisionLadderPanelProps> = ({
  divisions,
  userCourses,
  coursesToNext,
  nextDivisionName,
  estimatedRounds,
}) => {
  // Get current division for progress bar color
  const currentDivision = divisions.find(d => d.status === 'current');
  const currentColor = currentDivision?.color || '#7A6B5B';
  
  // Calculate progress within current tier
  const progressPercent = coursesToNext > 0 
    ? Math.min(100, ((10 - (coursesToNext % 10)) / 10) * 100)
    : 100;

  // Get styles based on status and division color
  const getRowStyles = (division: Division) => {
    const color = division.color;
    switch (division.status) {
      case 'completed':
        return {
          background: getColorTint(color, 0.12),
          iconBg: getColorTint(color, 0.20),
          iconColor: color,
          textColor: color,
        };
      case 'current':
        return {
          background: getColorTint(color, 0.18),
          borderColor: getColorTint(color, 0.25),
          iconBg: getColorTint(color, 0.25),
          iconColor: color,
          textColor: color,
        };
      case 'next':
        return {
          background: 'rgba(251, 146, 60, 0.12)',
          iconBg: 'rgba(251, 146, 60, 0.20)',
          iconColor: '#F97316',
          textColor: undefined,
          accentColor: '#F97316',
        };
      case 'locked':
      default:
        return {
          background: 'transparent',
          iconBg: undefined,
          iconColor: '#9CA3AF',
          textColor: '#9CA3AF',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Header - uses current division color */}
      {coursesToNext > 0 && (
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              Next: {nextDivisionName}
            </span>
            <span className="text-sm font-semibold">{coursesToNext} to go</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${progressPercent}%`,
                backgroundColor: currentColor,
              }}
            />
          </div>
          {estimatedRounds !== undefined && estimatedRounds > 0 && (
            <p className="text-xs text-muted-foreground">
              ~{estimatedRounds} rounds to promotion
            </p>
          )}
        </div>
      )}

      {/* Division List - with milestone colors */}
      <div className="space-y-1">
        {divisions.map((division) => {
          const styles = getRowStyles(division);
          
          return (
            <div
              key={division.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                division.status === 'current' && "border",
                division.status === 'locked' && "opacity-60"
              )}
              style={{
                backgroundColor: division.status !== 'locked' ? styles.background : undefined,
                borderColor: division.status === 'current' ? styles.borderColor : undefined,
              }}
            >
              {/* Status Icon - uses division color */}
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  division.status === 'locked' && "bg-muted"
                )}
                style={{
                  backgroundColor: division.status !== 'locked' ? styles.iconBg : undefined,
                }}
              >
                {(division.status === 'current' || division.status === 'completed') && (
                  <Check className="w-4 h-4" style={{ color: styles.iconColor }} />
                )}
                {division.status === 'next' && (
                  <ChevronRight className="w-4 h-4" style={{ color: styles.iconColor }} />
                )}
                {division.status === 'locked' && (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
              </div>

              {/* Division Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: division.color }}
                  />
                  <span 
                    className={cn(
                      "font-medium text-sm",
                      division.status === 'locked' && "text-gray-400"
                    )}
                    style={{
                      color: division.status !== 'locked' ? styles.textColor : undefined,
                    }}
                  >
                    {division.name}
                  </span>
                  {division.status === 'current' && (
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: getColorTint(division.color, 0.25),
                        color: division.color,
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {division.threshold}+ courses
                </span>
              </div>

              {/* Right side - "X to go" for next division */}
              {division.status === 'next' && coursesToNext > 0 && (
                <span className="text-xs font-semibold text-orange-500">
                  {coursesToNext} to go
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DivisionLadderPanel;
