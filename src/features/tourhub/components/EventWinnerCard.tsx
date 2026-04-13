/**
 * EventWinnerCard - Dispatch champion block
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEventWinner } from '../hooks/useEventWinner';
import { PlayerAvatar } from './PlayerAvatar';

interface EventWinnerCardProps {
  tournamentId: string;
  className?: string;
}

const sectionEntrance = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' as const },
  transition: { duration: 0.35 },
};

export function EventWinnerCard({ tournamentId, className }: EventWinnerCardProps) {
  const { data: winner, isLoading } = useEventWinner(tournamentId);
  
  if (isLoading) {
    return (
      <div className={cn("", className)} style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px', padding: '14px 20px 14px' }}>
        <div className="animate-pulse" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: '8px', width: '80px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ height: '20px', width: '150px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px', marginBottom: '6px' }} />
            <div style={{ height: '10px', width: '100px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '34%', background: 'rgba(15,23,42,0.06)' }} />
          <div style={{ width: '52px' }}>
            <div style={{ height: '28px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px', marginBottom: '4px' }} />
            <div style={{ height: '8px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    );
  }
  
  if (!winner) {
    return (
      <motion.div className={cn('', className)} {...sectionEntrance}>
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Champion</span>
          </div>
        </div>
        <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', padding: '16px 20px' }}>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Champion unlocking soon — official results will appear once the event concludes.</p>
        </div>
      </motion.div>
    );
  }
  
  if (!winner.player) {
    return (
      <motion.div className={cn('', className)} {...sectionEntrance}>
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Champion</span>
          </div>
        </div>
        <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', padding: '14px 20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{winner.headline || 'Champion crowned'}</p>
          {winner.narrative && <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{winner.narrative}</p>}
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div className={cn('', className)} {...sectionEntrance}>
      {/* Section rule marker */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Champion</span>
        </div>
      </div>

      {/* Winner block */}
      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        <Link
          to={`/tourhub/player/${winner.player.id}`}
          style={{ display: 'block', textDecoration: 'none' }}
          className="active:opacity-80 transition-opacity"
        >
          <div style={{ padding: '14px 20px', borderLeft: '3px solid #F7931E', background: 'rgba(247,147,30,0.025)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
                  Tournament Winner
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {winner.player.full_name}
                </div>
                {winner.narrative && (
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                    {winner.narrative}
                  </p>
                )}
              </div>

              {/* Contained squircle headshot */}
              <div style={{ width: '52px', height: '52px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: 'rgba(15,23,42,0.06)' }}>
                <PlayerAvatar playerId={winner.player.id} playerName={winner.player.full_name} size="md" />
              </div>

              {/* Score */}
              <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#F7931E', letterSpacing: '-0.05em', lineHeight: 1 }}>
                  {winner.score_to_par === 0 ? 'E' : winner.score_to_par != null && winner.score_to_par < 0 ? String(winner.score_to_par) : winner.score_to_par != null ? `+${winner.score_to_par}` : '—'}
                </div>
                <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#94A3B8', letterSpacing: '0.08em' }}>TO PAR</div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}

/**
 * Compact winner display for list views
 */
interface CompactWinnerProps {
  winner: {
    player_id: string;
    player?: {
      id: string;
      full_name: string;
      country: string | null;
      photo_url: string | null;
    };
    winning_score: number | null;
    score_to_par: number | null;
    is_playoff: boolean;
  };
  className?: string;
}

export function CompactWinner({ winner, className }: CompactWinnerProps) {
  if (!winner.player) return null;
  
  return (
    <Link 
      to={`/tourhub/player/${winner.player.id}`}
      className={cn(
        "flex items-center gap-2 text-sm hover:text-primary transition-colors",
        className
      )}
    >
      <span style={{ fontSize: '12px', color: '#F7931E' }}>🏆</span>
      <span className="font-medium text-foreground truncate">
        {winner.player.full_name}
      </span>
      {winner.is_playoff && (
        <span className="text-[10px] text-red-500 font-medium shrink-0">(P)</span>
      )}
    </Link>
  );
}
