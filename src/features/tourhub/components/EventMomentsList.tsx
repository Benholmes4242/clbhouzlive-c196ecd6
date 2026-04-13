/**
 * EventMomentsList - Flat dispatch ruled list
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEventMoments, MOMENT_TYPE_CONFIG, type MomentType } from '../hooks/useEventMoments';
import { PlayerAvatar } from './PlayerAvatar';

interface EventMomentsListProps {
  tournamentId: string;
  className?: string;
  limit?: number;
}

export function EventMomentsList({ tournamentId, className, limit }: EventMomentsListProps) {
  const { data: moments, isLoading } = useEventMoments(tournamentId);
  
  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div style={{ padding: '14px 20px' }}>
          <div className="h-3 w-24 bg-muted rounded mb-3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted/30 rounded mb-2" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!moments || moments.length === 0) {
    return null;
  }
  
  const displayMoments = limit ? moments.slice(0, limit) : moments;
  
  return (
    <div className={cn('', className)}>
      {/* Section rule marker */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Key Moments
          </span>
        </div>
      </div>

      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        {displayMoments.map((moment, index) => {
          const config = MOMENT_TYPE_CONFIG[moment.moment_type as MomentType] || MOMENT_TYPE_CONFIG.highlight;
          const isLast = index === displayMoments.length - 1;
          
          return (
            <div
              key={moment.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '11px 20px',
                borderBottom: isLast ? 'none' : '0.5px solid rgba(15,23,42,0.07)',
              }}
            >
              {/* Type icon — small rounded square */}
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(15,23,42,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                {config.icon ?? '⛳'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' as const }}>
                  {moment.player && (
                    <Link
                      to={`/tourhub/player/${moment.player.id}`}
                      style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', textDecoration: 'none' }}
                      className="active:opacity-70 transition-opacity"
                    >
                      {moment.player.full_name}
                    </Link>
                  )}
                </div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', margin: '2px 0 0', lineHeight: 1.4 }}>
                  {moment.headline}
                </p>
                {moment.description && (
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0', lineHeight: 1.5 }}>
                    {moment.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Show more indicator */}
      {limit && moments.length > limit && (
        <div style={{ padding: '8px 20px', textAlign: 'center' as const }}>
          <span style={{ fontSize: '10px', color: '#94A3B8' }}>+{moments.length - limit} more moments</span>
        </div>
      )}
    </div>
  );
}
