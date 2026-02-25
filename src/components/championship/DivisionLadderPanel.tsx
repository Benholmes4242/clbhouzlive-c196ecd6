import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, Check, ChevronRight } from 'lucide-react';
import { getSeasonGradient } from '@/lib/colorUtils';

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
  seasonColor?: string;
}

/**
 * DivisionLadderPanel - Premium tier list with connector lines and progressive fade
 */
export const DivisionLadderPanel: React.FC<DivisionLadderPanelProps> = ({
  divisions,
  userCourses,
  coursesToNext,
  nextDivisionName,
  seasonColor = '#006747',
}) => {
  const gradient = getSeasonGradient(seasonColor);

  // Track locked index for progressive fade
  let lockedIndex = 0;

  // Determine connector line style between two divisions
  const getConnectorStyle = (currentStatus: Division['status'], nextStatus: Division['status']) => {
    if (
      (currentStatus === 'completed' && nextStatus === 'current') ||
      (currentStatus === 'completed' && nextStatus === 'completed')
    ) {
      return { width: 2, color: seasonColor, dashed: false };
    }
    if (currentStatus === 'current' && nextStatus === 'next') {
      return { width: 2, gradient: true, dashed: false };
    }
    if (currentStatus === 'next' && nextStatus === 'locked') {
      return { width: 1, color: 'rgba(0, 0, 0, 0.1)', dashed: false };
    }
    // locked → locked
    return { width: 1, color: 'rgba(0, 0, 0, 0.06)', dashed: true };
  };

  return (
    <div className="px-4 pb-2">
      {divisions.map((division, index) => {
        const isLocked = division.status === 'locked';
        const currentLockedIndex = isLocked ? lockedIndex++ : 0;
        const opacity = isLocked ? Math.max(0.4, 0.8 - currentLockedIndex * 0.07) : 1;

        // Connector line to next item
        const nextDiv = divisions[index + 1];
        const connector = nextDiv ? getConnectorStyle(division.status, nextDiv.status) : null;

        return (
          <div key={division.id} style={{ opacity }}>
            {/* Tier item */}
            <div
              className={cn(
                'flex items-center gap-3 px-3 py-3 relative',
                division.status === 'current' && 'rounded-xl',
                division.status === 'next' && 'rounded-xl',
              )}
              style={{
                ...(division.status === 'current' && {
                  backgroundColor: gradient.subtleTint,
                  borderLeft: `3px solid ${seasonColor}`,
                  borderRadius: '12px',
                }),
                ...(division.status === 'next' && {
                  backgroundColor: 'rgba(212, 168, 83, 0.06)',
                  border: '1px solid rgba(212, 168, 83, 0.15)',
                  borderRadius: '12px',
                }),
              }}
            >
              {/* Icon circle — uses division.color for completed/current */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  ...(division.status === 'completed' && {
                    backgroundColor: division.color || seasonColor,
                  }),
                  ...(division.status === 'current' && {
                    backgroundColor: seasonColor,
                  }),
                  ...(division.status === 'next' && {
                    backgroundColor: 'rgba(212, 168, 83, 0.15)',
                  }),
                  ...(division.status === 'locked' && {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }),
                }}
              >
                {(division.status === 'completed' || division.status === 'current') && (
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                )}
                {division.status === 'next' && (
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: '#D4A853' }} />
                )}
                {division.status === 'locked' && (
                  <Lock
                    className="w-3.5 h-3.5"
                    style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.4 }}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'text-sm block',
                    division.status === 'completed' && 'font-semibold text-foreground',
                    division.status === 'current' && 'font-bold text-foreground',
                    division.status === 'next' && 'font-bold text-foreground',
                    division.status === 'locked' && 'font-medium',
                  )}
                  style={{
                    ...(division.status === 'locked' && {
                      color: 'hsl(var(--muted-foreground))',
                      opacity: 0.7,
                    }),
                  }}
                >
                  {division.name}
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: 'hsl(var(--muted-foreground))',
                    ...(division.status === 'locked' && { opacity: 0.5 }),
                  }}
                >
                  {division.threshold}+ courses
                </span>
              </div>

              {/* Right side */}
              {division.status === 'current' && (
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 flex-shrink-0"
                  style={{
                    backgroundColor: gradient.tint,
                    borderRadius: '6px',
                  }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                      style={{ backgroundColor: seasonColor }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-1.5 w-1.5"
                      style={{ backgroundColor: seasonColor }}
                    />
                  </span>
                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: seasonColor }}
                  >
                    Current
                  </span>
                </div>
              )}
              {division.status === 'next' && coursesToNext > 0 && (
                <span className="text-sm font-bold flex-shrink-0" style={{ color: '#D4A853' }}>
                  {coursesToNext} to go
                </span>
              )}
            </div>

            {/* Connector line */}
            {connector && (
              <div className="flex pl-[18px]">
                <div
                  style={{
                    width: `${connector.width}px`,
                    height: '8px',
                    ...(connector.gradient
                      ? {
                          background: `linear-gradient(to bottom, ${seasonColor}, rgba(212, 168, 83, 0.4))`,
                        }
                      : {
                          backgroundColor: connector.color,
                        }),
                    ...(connector.dashed && {
                      backgroundColor: 'transparent',
                      borderLeft: `${connector.width}px dashed ${connector.color}`,
                    }),
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DivisionLadderPanel;
