import React from 'react';

interface RegionProgress {
  played: number;
  total: number;
  percentage: number;
}

interface NetflixProgressRingsProps {
  regionProgress: Record<string, RegionProgress>;
  onRegionClick: (region: string) => void;
}

const NetflixProgressRings: React.FC<NetflixProgressRingsProps> = ({
  regionProgress,
  onRegionClick
}) => {
  const regions = [
    { key: 'worldwide', label: 'Worldwide', color: 'text-orange-500' },
    { key: 'britain-ireland', label: 'GB&I', color: 'text-green-500' },
    { key: 'europe', label: 'Europe', color: 'text-blue-500' },
    { key: 'usa', label: 'USA', color: 'text-red-500' }
  ];

  return (
    <div className="px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {regions.map((region) => {
          const progress = regionProgress[region.key] || { played: 0, total: 0, percentage: 0 };
          const percentage = progress.total > 0 ? (progress.played / progress.total) * 100 : 0;
          const strokeDasharray = 2 * Math.PI * 45; // circumference
          const strokeDashoffset = strokeDasharray * (1 - percentage / 100);
          
          return (
            <button
              key={region.key}
              onClick={() => onRegionClick(region.key)}
              className="flex flex-col items-center space-y-2 group hover:scale-105 transition-transform duration-200"
            >
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className={`${region.color} transition-all duration-500 stroke-linecap-round`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {progress.played}/{progress.total}
                  </span>
                  <span className={`text-sm font-medium ${region.color}`}>
                    {progress.played > 0 ? `${Math.floor(percentage)}%` : 'XP'}
                  </span>
                </div>
              </div>
              <span className="text-white font-medium text-sm group-hover:text-primary transition-colors">
                {region.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NetflixProgressRings;