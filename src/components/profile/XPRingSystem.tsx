import React from 'react';
import { cn } from '@/lib/utils';

interface XPRingTier {
  name: string;
  color: string;
  minXP: number;
  maxXP: number;
  ringGradient: string;
}

const XP_RING_TIERS: XPRingTier[] = [
  {
    name: "Blue Ring", 
    color: "#4682B4",
    minXP: 10000,
    maxXP: 19999,
    ringGradient: "conic-gradient(from 0deg, #4682B4, #5F9EA0, #4682B4)"
  },
  {
    name: "Green Ring",
    color: "#6e9277", 
    minXP: 20000,
    maxXP: 29999,
    ringGradient: "conic-gradient(from 0deg, #6e9277, #8bb485, #6e9277)"
  },
  {
    name: "Silver Ring",
    color: "#C0C0C0",
    minXP: 30000,
    maxXP: 39999,
    ringGradient: "conic-gradient(from 0deg, #C0C0C0, #E5E5E5, #C0C0C0)"
  },
  {
    name: "Gold Ring",
    color: "#FFD700",
    minXP: 40000,
    maxXP: 49999,
    ringGradient: "conic-gradient(from 0deg, #FFD700, #FFA500, #FFD700)"
  }
];

interface XPRingSystemProps {
  currentXP: number;
  className?: string;
  showMiniRings?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'vertical' | 'horizontal';
}

export const XPRingSystem: React.FC<XPRingSystemProps> = ({ 
  currentXP, 
  className,
  showMiniRings = false,
  size = 'medium',
  layout = 'vertical'
}) => {
  const getCurrentTier = (xp: number): XPRingTier | null => {
    return XP_RING_TIERS.find(tier => xp >= tier.minXP && xp <= tier.maxXP) || null;
  };

  const getNextTier = (currentTier: XPRingTier | null): XPRingTier | null => {
    if (!currentTier) return XP_RING_TIERS[0]; // First achievable ring is Blue Ring
    const currentIndex = XP_RING_TIERS.findIndex(tier => tier.name === currentTier.name);
    return currentIndex < XP_RING_TIERS.length - 1 ? XP_RING_TIERS[currentIndex + 1] : null;
  };

  const calculateProgress = (xp: number, tier: XPRingTier | null): number => {
    if (!tier) {
      // Progress towards first ring (Blue Ring at 10,000 XP)
      return Math.min((xp / 10000) * 100, 100);
    }
    const tierRange = tier.maxXP - tier.minXP + 1;
    const progressInTier = xp - tier.minXP;
    return Math.min((progressInTier / tierRange) * 100, 100);
  };

  const currentTier = getCurrentTier(currentXP);
  const nextTier = getNextTier(currentTier);
  const progress = calculateProgress(currentXP, currentTier);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24', 
    large: 'w-32 h-32'
  };

  const strokeWidth = {
    small: 4,
    medium: 6,
    large: 8
  };

  if (layout === 'horizontal') {
    return (
      <div className={cn('flex items-center gap-6', className)}>
        {/* Main Ring Display */}
        <div className="relative flex-shrink-0">
          {currentTier ? (
            // User has achieved a ring
            <div className="relative">
              {/* Glow effect for current tier */}
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${currentTier.color}80 0%, ${currentTier.color}40 40%, transparent 70%)`,
                  filter: 'blur(16px)',
                  transform: 'scale(1.4)'
                }}
              />
              <div 
                className={cn('relative rounded-full flex items-center justify-center', sizeClasses[size])}
                style={{
                  background: currentTier.ringGradient,
                  padding: '4px',
                  filter: `drop-shadow(0 0 12px ${currentTier.color}60) drop-shadow(0 0 6px ${currentTier.color}40)`
                }}
              >
                {/* Inner circle with progress */}
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center relative overflow-hidden">
                  {/* Progress fill */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from 0deg, ${currentTier.color} 0%, ${currentTier.color} ${progress}%, transparent ${progress}%, transparent 100%)`,
                      opacity: 0.2
                    }}
                  />
                  
                  {/* Center icon/text */}
                  <div className="relative z-10 text-center">
                    <div className="w-4 h-4 bg-current rounded-sm opacity-60" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // User hasn't achieved any ring yet
            <div 
              className={cn('relative rounded-full flex items-center justify-center border-4 border-gray-300 dark:border-gray-600', sizeClasses[size])}
            >
              <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center relative overflow-hidden">
                {/* Progress fill towards first ring */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, #4682B4 0%, #4682B4 ${progress}%, transparent ${progress}%, transparent 100%)`,
                    opacity: 0.1
                  }}
                />
                
                {/* Center icon/text */}
                <div className="relative z-10 text-center">
                  <div className="w-4 h-4 bg-gray-400 rounded-sm opacity-60" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side content */}
        <div className="flex-1 space-y-3">
          {/* Tier Information */}
          <div className="space-y-1">
            {currentTier ? (
              <>
                <h3 className="font-semibold text-sm" style={{ color: currentTier.color }}>
                  {currentTier.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {currentTier.minXP.toLocaleString()} - {currentTier.maxXP.toLocaleString()} XP
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-sm text-gray-500">
                  No Ring Achieved
                </h3>
                <p className="text-xs text-muted-foreground">
                  Reach 10,000 XP to unlock your first ring
                </p>
              </>
            )}
            {nextTier && (
              <p className="text-xs text-muted-foreground">
                Next: {nextTier.name} at {nextTier.minXP.toLocaleString()} XP
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              {currentTier ? (
                <>
                  <span>{currentTier.minXP.toLocaleString()}</span>
                  <span>{currentTier.maxXP.toLocaleString()}</span>
                </>
              ) : (
                <>
                  <span>0</span>
                  <span>10,000</span>
                </>
              )}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${progress}%`,
                  background: currentTier ? currentTier.ringGradient : 'linear-gradient(to right, #4682B4, #5F9EA0)'
                }}
              />
            </div>
          </div>

          {/* Mini Rings Display (All Tiers) for horizontal layout */}
          {showMiniRings && (
            <div className="w-full mt-4">
              <div className="flex justify-between items-start gap-2 relative">
                {XP_RING_TIERS.map((tier, index) => {
                  const isActive = currentXP >= tier.minXP;
                  const isCurrent = currentTier && tier.name === currentTier.name;
                  const nextTierData = XP_RING_TIERS[index + 1];
                  
                  return (
                    <div key={tier.name} className="flex flex-col items-center flex-1 relative">
                      {/* Connecting line to next ring */}
                      {nextTierData && (
                        <div className="absolute top-6 left-full w-full h-0.5 z-0" style={{
                          background: `linear-gradient(to right, ${tier.color}, ${nextTierData.color})`,
                          transform: 'translateY(-50%)'
                        }} />
                      )}
                      
                      <div className="relative z-10">
                        {/* Glow effect for active mini rings */}
                        {isActive && (
                          <div 
                            className="absolute inset-0 rounded-full animate-pulse"
                            style={{
                              background: `radial-gradient(circle, ${tier.color}60 0%, ${tier.color}30 50%, transparent 70%)`,
                              filter: 'blur(8px)',
                              transform: 'scale(1.5)'
                            }}
                          />
                        )}
                        <div 
                          className={cn(
                            'relative w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all mb-2',
                            isCurrent ? 'scale-110' : 'scale-100',
                            isActive ? 'opacity-100' : 'opacity-40'
                          )}
                          style={{
                            borderColor: tier.color,
                            backgroundColor: isActive ? tier.color + '20' : 'transparent',
                            filter: isActive ? `drop-shadow(0 0 6px ${tier.color}40)` : 'none'
                          }}
                          title={`${tier.name}: ${tier.minXP.toLocaleString()} - ${tier.maxXP.toLocaleString()} XP`}
                        >
                          {/* Remove the inner dot/square */}
                        </div>
                      </div>
                      
                      {/* Ring information text */}
                      <div className="text-center">
                        <h4 className="font-semibold text-xs" style={{ color: isActive ? tier.color : '#9CA3AF' }}>
                          {tier.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {tier.minXP.toLocaleString()}-{tier.maxXP.toLocaleString()} XP
                        </p>
                        {isCurrent && (
                          <p className="text-xs font-medium mt-1" style={{ color: tier.color }}>
                            {currentXP.toLocaleString()} XP
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Main Ring Display */}
      <div className="relative">
        {currentTier ? (
          // User has achieved a ring
          <div className="relative">
            {/* Glow effect for current tier */}
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: `radial-gradient(circle, ${currentTier.color}80 0%, ${currentTier.color}40 40%, transparent 70%)`,
                filter: 'blur(16px)',
                transform: 'scale(1.4)'
              }}
            />
            <div 
              className={cn('relative rounded-full flex items-center justify-center', sizeClasses[size])}
              style={{
                background: currentTier.ringGradient,
                padding: '4px',
                filter: `drop-shadow(0 0 12px ${currentTier.color}60) drop-shadow(0 0 6px ${currentTier.color}40)`
              }}
            >
              {/* Inner circle with progress */}
              <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center relative overflow-hidden">
                {/* Progress fill */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, ${currentTier.color} 0%, ${currentTier.color} ${progress}%, transparent ${progress}%, transparent 100%)`,
                    opacity: 0.2
                  }}
                />
                
                {/* Center icon/text */}
                <div className="relative z-10 text-center">
                  <div className="w-4 h-4 bg-current rounded-sm opacity-60" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // User hasn't achieved any ring yet
          <div 
            className={cn('relative rounded-full flex items-center justify-center border-4 border-gray-300 dark:border-gray-600', sizeClasses[size])}
          >
            <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center relative overflow-hidden">
              {/* Progress fill towards first ring */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, #4682B4 0%, #4682B4 ${progress}%, transparent ${progress}%, transparent 100%)`,
                  opacity: 0.1
                }}
              />
              
              {/* Center icon/text */}
              <div className="relative z-10 text-center">
                <div className="w-4 h-4 bg-gray-400 rounded-sm opacity-60" />
              </div>
            </div>
          </div>
        )}
        
        {/* XP Amount overlay */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1">
            <span className="text-xs font-medium">{currentXP.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tier Information */}
      <div className="text-center space-y-1">
        {currentTier ? (
          <>
            <h3 className="font-semibold text-sm" style={{ color: currentTier.color }}>
              {currentTier.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {currentTier.minXP.toLocaleString()} - {currentTier.maxXP.toLocaleString()} XP
            </p>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-sm text-gray-500">
              No Ring Achieved
            </h3>
            <p className="text-xs text-muted-foreground">
              Reach 10,000 XP to unlock your first ring
            </p>
          </>
        )}
        {nextTier && (
          <p className="text-xs text-muted-foreground">
            Next: {nextTier.name} at {nextTier.minXP.toLocaleString()} XP
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          {currentTier ? (
            <>
              <span>{currentTier.minXP.toLocaleString()}</span>
              <span>{Math.round(progress)}%</span>
              <span>{currentTier.maxXP.toLocaleString()}</span>
            </>
          ) : (
            <>
              <span>0</span>
              <span>{Math.round(progress)}%</span>
              <span>10,000</span>
            </>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${progress}%`,
              background: currentTier ? currentTier.ringGradient : 'linear-gradient(to right, #4682B4, #5F9EA0)'
            }}
          />
        </div>
      </div>

      {/* Mini Rings Display (All Tiers) */}
      {showMiniRings && (
        <div className="w-full mt-6">
          <div className="flex justify-between items-start gap-2">
            {XP_RING_TIERS.map((tier, index) => {
              const isActive = currentXP >= tier.minXP;
              const isCurrent = currentTier && tier.name === currentTier.name;
              
              return (
                <div key={tier.name} className="flex flex-col items-center flex-1">
                  <div className="relative">
                    {/* Glow effect for active mini rings */}
                    {isActive && (
                       <div 
                         className="absolute inset-0 rounded-full animate-pulse"
                         style={{
                           background: `radial-gradient(circle, ${tier.color}60 0%, ${tier.color}30 50%, transparent 70%)`,
                           filter: 'blur(8px)',
                           transform: 'scale(1.5)'
                         }}
                       />
                    )}
                    <div 
                      className={cn(
                        'relative w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all mb-2',
                        isCurrent ? 'scale-110' : 'scale-100',
                        isActive ? 'opacity-100' : 'opacity-40'
                      )}
                      style={{
                        borderColor: tier.color,
                        backgroundColor: isActive ? tier.color + '20' : 'transparent',
                        filter: isActive ? `drop-shadow(0 0 6px ${tier.color}40)` : 'none'
                      }}
                      title={`${tier.name}: ${tier.minXP.toLocaleString()} - ${tier.maxXP.toLocaleString()} XP`}
                    >
                      {/* Remove the inner dot/square */}
                    </div>
                  </div>
                  
                  {/* Ring information text */}
                  <div className="text-center">
                    <h4 className="font-semibold text-xs" style={{ color: isActive ? tier.color : '#9CA3AF' }}>
                      {tier.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tier.minXP.toLocaleString()}-{tier.maxXP.toLocaleString()} XP
                    </p>
                    {isCurrent && (
                      <p className="text-xs font-medium mt-1" style={{ color: tier.color }}>
                        {currentXP.toLocaleString()} XP
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default XPRingSystem;