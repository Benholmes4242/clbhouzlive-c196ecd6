import React from 'react';
import { Globe, Star } from 'lucide-react';

export type CourseLegacySummary = {
  coursesPlayed: number;
  countries: number;
  avgRating: number; // 1dp
};

export interface CourseLegacyMiniCardProps {
  summary: CourseLegacySummary;
  onPress: () => void;
}

/**
 * CourseLegacyMiniCard
 * - Replaces the "Progress" card with mini version of Courses → "Your Course Legacy".
 */
export function CourseLegacyMiniCard({ summary, onPress }: CourseLegacyMiniCardProps) {
  return (
    <button type="button" className="hubCard hubCard--legacy" onClick={onPress}>
      <div className="text-lg font-semibold text-black/85">Your Course Legacy</div>

      <div className="mt-3 flex items-end gap-3">
        <div className="text-4xl font-extrabold text-black/85 leading-none">
          {summary.coursesPlayed}
        </div>
        <div className="pb-1 text-sm text-black/50">Courses played</div>
      </div>

      <div className="mt-4 flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-black/60">
          <span className="legacyPillIcon">
            <Globe className="h-4 w-4 text-black/55" />
          </span>
          <span className="font-semibold text-black/75">{summary.countries}</span>
          <span>countries</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-black/60">
          <span className="legacyPillIcon">
            <Star className="h-4 w-4 text-black/55" />
          </span>
          <span className="font-semibold text-black/75">{summary.avgRating.toFixed(1)}</span>
          <span>avg rating</span>
        </div>
      </div>
    </button>
  );
}
