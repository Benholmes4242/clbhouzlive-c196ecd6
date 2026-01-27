import React from 'react';
import { Trophy } from 'lucide-react';

/**
 * HallOfFameHeader - Header displayed when All-Time tab is selected
 */
export const HallOfFameHeader: React.FC = () => {
  return (
    <div className="text-center py-4">
      <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-1" />
      <h2 className="text-lg font-semibold text-gray-900">Hall of Fame</h2>
      <p className="text-xs text-gray-500">Lifetime leaders across all seasons</p>
    </div>
  );
};

export default HallOfFameHeader;
