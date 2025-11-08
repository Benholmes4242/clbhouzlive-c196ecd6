import React from 'react';

interface NearbySkeletonRowProps {
  count?: number;
}

export function NearbySkeletonRow({ count = 3 }: NearbySkeletonRowProps) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="mx-3 rounded-[18px] backdrop-blur-[20px] border overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255,255,255,0.08)',
            padding: '16px 14px',
            animation: `rowFadeUp 90ms ease-out both ${i * 35}ms`
          }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar skeleton */}
            <div 
              className="shrink-0 w-[52px] h-[52px] rounded-full relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div 
                className="absolute inset-0 shimmer-gradient"
                style={{
                  backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.2s infinite'
                }}
              />
            </div>

            {/* Content skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Name line */}
              <div 
                className="h-[17px] w-[120px] rounded relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <div 
                  className="absolute inset-0 shimmer-gradient"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.2s infinite'
                  }}
                />
              </div>

              {/* Meta line */}
              <div 
                className="h-[14px] w-[180px] rounded relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div 
                  className="absolute inset-0 shimmer-gradient"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.2s infinite',
                    animationDelay: '0.1s'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Button row skeleton */}
          <div className="flex gap-2 mt-3">
            {[0, 1, 2].map((btnIdx) => (
              <div
                key={btnIdx}
                className="flex-1 h-9 rounded-xl relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div 
                  className="absolute inset-0 shimmer-gradient"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.2s infinite',
                    animationDelay: `${0.2 + btnIdx * 0.05}s`
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
