import React from 'react';
import { TrendingUp, Target, Award } from 'lucide-react';

interface PromotionStatusBannerProps {
  isInPromotionZone: boolean;
  distanceToPromotion: number;
  justPromotedRecently: boolean; // Within 48h
  newDivisionName?: string;
}

/**
 * PromotionStatusBanner - Contextual promotion messaging
 * 
 * State Priority:
 * 1. justPromotedRecently → "Welcome to {Division}. New targets unlocked."
 * 2. isInPromotionZone → "You're in the promotion zone…"
 * 3. distanceToPromotion <= 3 → "You're X courses from the promotion zone."
 * 4. Otherwise → Hide banner
 */
export const PromotionStatusBanner: React.FC<PromotionStatusBannerProps> = ({
  isInPromotionZone,
  distanceToPromotion,
  justPromotedRecently,
  newDivisionName,
}) => {
  // State A: Just promoted (48h)
  if (justPromotedRecently && newDivisionName) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-xl">
        <Award className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Welcome to {newDivisionName}.</span>
          {' '}New targets unlocked.
        </p>
      </div>
    );
  }

  // State B: In promotion zone
  if (isInPromotionZone) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl">
        <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <p className="text-sm text-emerald-800">
          You're in the promotion zone. Maintain your pace to advance next season.
        </p>
      </div>
    );
  }

  // State C: Close to promotion (1-3 courses)
  if (distanceToPromotion > 0 && distanceToPromotion <= 3) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl">
        <Target className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <p className="text-sm text-blue-800">
          You're <span className="font-semibold">{distanceToPromotion} course{distanceToPromotion !== 1 ? 's' : ''}</span> from the promotion zone.
        </p>
      </div>
    );
  }

  // State D: Hide banner
  return null;
};

export default PromotionStatusBanner;
