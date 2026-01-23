import React from 'react';
import { Target, Flame } from 'lucide-react';

interface PodiumThreatBannerProps {
  userPosition: number;
  coursesToPodium: number;
  thirdPlaceName: string;
}

export const PodiumThreatBanner: React.FC<PodiumThreatBannerProps> = ({
  userPosition,
  coursesToPodium,
  thirdPlaceName,
}) => {
  if (userPosition <= 3 || coursesToPodium > 5) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-sq-md p-4 my-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Target className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-amber-900">
            You're {coursesToPodium} course{coursesToPodium !== 1 ? 's' : ''} from the podium!
          </p>
          <p className="text-sm text-amber-700">
            Pass {thirdPlaceName} to claim 3rd place
          </p>
        </div>
        <Flame className="w-6 h-6 text-amber-500 animate-flame-medium" />
      </div>
    </div>
  );
};
