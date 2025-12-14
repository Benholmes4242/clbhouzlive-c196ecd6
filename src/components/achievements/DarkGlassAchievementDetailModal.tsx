/**
 * Dark Glass Achievement Detail Modal
 * 
 * Premium dark glass bottom sheet modal for viewing achievement details.
 * Supports both Milestone Clubs and Top 100 List Completions.
 */

import React from 'react';
import { X, Trophy, MapPin, Lock, Check, ChevronRight, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  MILESTONE_THEMES, 
  REGION_THEMES,
  MilestoneTier,
  RegionKey,
} from '@/lib/globalAchievementMilestoneSystem';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type DarkAchievementType = 'milestone' | 'list';
export type DarkAchievementStatus = 'locked' | 'in_progress' | 'unlocked' | 'complete';

export interface DarkGlassAchievementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: DarkAchievementType;
  status: DarkAchievementStatus;
  title: string;
  subtitle?: string;
  description?: string;
  progressCurrent: number;
  progressTarget: number;
  // For milestones
  threshold?: number;
  // For lists
  regionKey?: RegionKey;
  listSlug?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// DARK GLASS STYLES
// ═══════════════════════════════════════════════════════════════════════════════════════════

const MODAL_BG = 'rgba(20, 20, 20, 0.92)';
const MODAL_BORDER = 'rgba(255, 255, 255, 0.06)';
const MODAL_SHADOW = '0 18px 60px rgba(0, 0, 0, 0.55)';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════════════════

const StatusPill: React.FC<{ status: DarkAchievementStatus }> = ({ status }) => {
  const config = {
    locked: { 
      icon: Lock, 
      label: 'Locked', 
      bg: 'bg-white/10', 
      text: 'text-white/50' 
    },
    in_progress: { 
      icon: null, 
      label: 'In Progress', 
      bg: 'bg-amber-500/20', 
      text: 'text-amber-400/80' 
    },
    unlocked: { 
      icon: Check, 
      label: 'Unlocked', 
      bg: 'bg-emerald-500/20', 
      text: 'text-emerald-400' 
    },
    complete: { 
      icon: Check, 
      label: 'Complete', 
      bg: 'bg-emerald-500/20', 
      text: 'text-emerald-400' 
    },
  };
  
  const { icon: Icon, label, bg, text } = config[status];
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sq-pill text-xs font-medium",
      bg, text
    )}>
      {Icon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const DarkGlassAchievementDetailModal: React.FC<DarkGlassAchievementDetailModalProps> = ({
  isOpen,
  onClose,
  type,
  status,
  title,
  subtitle,
  description,
  progressCurrent,
  progressTarget,
  threshold,
  regionKey,
  listSlug,
}) => {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  const remaining = Math.max(0, progressTarget - progressCurrent);
  const progressPercent = progressTarget > 0 
    ? Math.min(100, (progressCurrent / progressTarget) * 100) 
    : 0;
  
  // Get theme colors
  const theme = type === 'milestone' && threshold
    ? MILESTONE_THEMES[threshold as MilestoneTier]
    : regionKey
      ? REGION_THEMES[regionKey]
      : null;
  
  const gradientColors = theme
    ? { light: theme.bgLight, dark: theme.bgDark }
    : { light: '#22c55e', dark: '#16a34a' };
  
  // CTAs
  const handlePrimaryCta = () => {
    onClose();
    if (type === 'milestone') {
      navigate('/top100');
    } else if (listSlug) {
      navigate(`/top100/${listSlug}`);
    }
  };
  
  const handleSecondaryCta = () => {
    onClose();
    if (type === 'list' && listSlug) {
      navigate(`/top100/${listSlug}?filter=played`);
    }
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${title} Achievement`,
        text: `I've unlocked the ${title} achievement!`,
      }).catch(() => {});
    }
  };
  
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
        style={{ animation: 'fadeIn 200ms ease-out' }}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "max-h-[85vh] overflow-hidden",
          "rounded-t-[28px]",
        )}
        style={{
          background: MODAL_BG,
          backdropFilter: 'blur(18px)',
          border: `1px solid ${MODAL_BORDER}`,
          borderBottom: 'none',
          boxShadow: MODAL_SHADOW,
          animation: 'slideUp 220ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        
        {/* Content container with scroll */}
        <div className="overflow-y-auto max-h-[calc(85vh-40px)] pb-8">
          {/* Header Row */}
          <header className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${gradientColors.light}30, ${gradientColors.dark}20)`,
                }}
              >
                {type === 'milestone' ? (
                  <Trophy className="w-4 h-4 text-white/80" strokeWidth={1.5} />
                ) : (
                  <MapPin className="w-4 h-4 text-white/80" strokeWidth={1.5} />
                )}
              </div>
              
              {/* Title */}
              <h2 className="text-lg font-semibold text-white">
                {title}
              </h2>
            </div>
            
            {/* Close button */}
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/15 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </header>
          
          {/* Hero Area */}
          <div className="px-5 py-6 flex flex-col items-center">
            {/* Large emblem with glow */}
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center relative mb-4"
              style={{ 
                background: `linear-gradient(135deg, ${gradientColors.light}25, ${gradientColors.dark}15)`,
              }}
            >
              {/* Soft glow */}
              <div 
                className="absolute inset-0 rounded-full opacity-40 blur-xl"
                style={{ 
                  background: `radial-gradient(circle, ${gradientColors.light}50, transparent 70%)`,
                }}
              />
              
              {type === 'milestone' ? (
                <Trophy 
                  className="w-12 h-12 relative z-10" 
                  style={{ color: gradientColors.light }}
                  strokeWidth={1.2}
                />
              ) : (
                <MapPin 
                  className="w-12 h-12 relative z-10" 
                  style={{ color: gradientColors.light }}
                  strokeWidth={1.2}
                />
              )}
            </div>
            
            {/* Status pill */}
            <StatusPill status={status} />
          </div>
          
          {/* Progress Block */}
          <div className="px-5 py-4 border-t border-white/5">
            {/* Progress numbers */}
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-3xl font-bold text-white">
                {progressCurrent}
              </span>
              <span className="text-xl text-white/40 font-medium">
                / {progressTarget}
              </span>
              <span className="text-sm text-white/50 ml-1">
                courses
              </span>
            </div>
            
            {/* Remaining text */}
            {remaining > 0 && (
              <p className="text-center text-sm text-white/50 mb-4">
                {remaining} more to {status === 'locked' ? 'unlock' : 'complete'}
              </p>
            )}
            
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressPercent}%`,
                  background: `linear-gradient(90deg, ${gradientColors.light}, ${gradientColors.dark})`,
                  boxShadow: `0 0 12px ${gradientColors.light}40`,
                }}
              />
            </div>
            
            {/* Meta row */}
            <div className="flex items-center justify-between mt-4 text-xs text-white/40">
              <span>
                {type === 'milestone' ? 'Milestone Club' : 'Top 100 List'}
              </span>
              <span>
                {/* Rarity placeholder for future */}
              </span>
            </div>
          </div>
          
          {/* Description */}
          {description && (
            <div className="px-5 py-4 border-t border-white/5">
              <p className="text-sm text-white/60 leading-relaxed">
                {description}
              </p>
            </div>
          )}
          
          {/* Rewards Section */}
          <div className="px-5 py-4 border-t border-white/5">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-3">
              What you get
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <Trophy className="w-3.5 h-3.5 text-white/60" />
                </div>
                <span>
                  {type === 'milestone' 
                    ? 'Club badge on profile' 
                    : 'Region completion badge'}
                </span>
              </div>
              
              {type === 'milestone' && (
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full border-2 border-white/50" />
                  </div>
                  <span>Ring tier progress</span>
                </div>
              )}
              
              {type === 'list' && (
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-white/60" />
                  </div>
                  <span>Adds to your Journey Map</span>
                </div>
              )}
            </div>
          </div>
          
          {/* CTAs */}
          <div className="px-5 pt-4 pb-2 space-y-3">
            {/* Primary CTA */}
            <button
              onClick={status === 'unlocked' || status === 'complete' ? handleShare : handlePrimaryCta}
              className={cn(
                "w-full py-3.5 rounded-sq-md text-sm font-semibold",
                "flex items-center justify-center gap-2",
                "transition-all duration-200",
                status === 'unlocked' || status === 'complete'
                  ? "bg-white text-slate-900 hover:bg-white/90"
                  : "bg-white/15 text-white hover:bg-white/20"
              )}
            >
              {status === 'unlocked' || status === 'complete' ? (
                <>
                  <Share2 className="w-4 h-4" />
                  Share achievement
                </>
              ) : (
                <>
                  {type === 'milestone' ? 'View eligible courses' : 'Open this Top 100 list'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            {/* Secondary CTA */}
            {type === 'list' && (
              <button
                onClick={handleSecondaryCta}
                className={cn(
                  "w-full py-3 rounded-sq-md text-sm font-medium",
                  "text-white/60 hover:text-white/80 hover:bg-white/5",
                  "transition-all duration-200"
                )}
              >
                See played courses
              </button>
            )}
            
            {/* Explore CTA for locked milestones with 0 progress */}
            {type === 'milestone' && status === 'locked' && progressCurrent === 0 && (
              <button
                onClick={() => { onClose(); navigate('/top100'); }}
                className={cn(
                  "w-full py-3 rounded-sq-md text-sm font-medium",
                  "text-white/60 hover:text-white/80 hover:bg-white/5",
                  "transition-all duration-200"
                )}
              >
                Explore Top 100 courses
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default DarkGlassAchievementDetailModal;
