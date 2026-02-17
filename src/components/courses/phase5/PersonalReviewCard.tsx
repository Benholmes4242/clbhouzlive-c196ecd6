/**
 * PersonalReviewCard - User's own review display with premium styling
 * Features circular score ring and mini progress bars for categories
 */
import React, { useState } from 'react';
import { Pencil, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserCourseRating } from '@/hooks/useUserCourseRating';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getScoreRingColors, getTierKeyFromScore } from '@/hooks/useTierStyles';
import { courseDetailTokens } from '@/styles/course-detail-tokens';

// ReviewText component with line clamping and "Read more"
const ReviewText: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const needsClamp = text.length > 180;
  
  return (
    <div className="pt-4 border-t border-border">
      <p className={cn(
        "text-sm text-muted-foreground leading-relaxed italic whitespace-pre-wrap",
        !expanded && needsClamp && "line-clamp-4"
      )}>
        "{text}"
      </p>
      {needsClamp && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors active:scale-[0.98] min-h-[44px] flex items-center"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

// Score ring SVG component
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 80 }) => {
  const { from, to } = getScoreRingColors(score);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const gradientId = `scoreGradient-${Math.random().toString(36).slice(2)}`;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <circle 
          cx={size / 2} cy={size / 2} r={radius} 
          fill="none" stroke="hsl(var(--border))" strokeWidth="6" 
        />
        <circle 
          cx={size / 2} cy={size / 2} r={radius} 
          fill="none" stroke={`url(#${gradientId})`}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score.toFixed(1)}</span>
      </div>
    </div>
  );
};

interface PersonalReviewCardProps {
  courseId: string;
  rating: UserCourseRating;
  className?: string;
}

export const PersonalReviewCard: React.FC<PersonalReviewCardProps> = ({
  courseId,
  rating,
  className,
}) => {
  const navigate = useNavigate();

  const handleEditClick = () => {
    navigate(`/courses/${courseId}/rate`);
  };

  const dateValue = rating.updated_at || rating.created_at;
  const dateLabel = format(new Date(dateValue), 'MMM d, yyyy');

  const categories = [
    { label: 'Design', score: rating.design_score },
    { label: 'Condition', score: rating.condition_score },
    { label: 'Clubhouse', score: rating.clubhouse_score },
    { label: 'Facilities', score: rating.facilities_score },
  ].filter((c): c is { label: string; score: number } => c.score !== null);

  return (
    <div className={cn(
      "bg-gradient-to-br from-card to-muted/50 rounded-2xl border border-border shadow-sm overflow-hidden",
      className
    )}>
      {/* Header with date */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Your Rating</h3>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Played on {dateLabel}
          </p>
        </div>
        <button 
          onClick={handleEditClick}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-[0.98] min-h-[44px] min-w-[44px] justify-center"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
      </div>
      
      {/* Large score with ring + category breakdown */}
      <div className="flex items-center gap-6 px-5 pb-4">
        <ScoreRing score={rating.rating} size={80} />
        
        {/* Category breakdown as mini bars */}
        {categories.length > 0 && (
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
            {categories.map(cat => {
              const catTierKey = getTierKeyFromScore(cat.score);
              const catTier = courseDetailTokens.tiers[catTierKey];
              
              return (
                <div key={cat.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{cat.label}</span>
                    <span className="font-medium tabular-nums" style={{ color: catTier.numberColor }}>{cat.score.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(cat.score / 10) * 100}%`,
                        background: `linear-gradient(to right, ${catTier.barFrom}, ${catTier.barTo})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Review text */}
      {rating.review && (
        <div className="px-5 pb-5">
          <ReviewText text={rating.review} />
        </div>
      )}
    </div>
  );
};

export default PersonalReviewCard;
