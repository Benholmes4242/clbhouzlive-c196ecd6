import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsSkeletonProps {
  /** Number of sections to show */
  sections?: Array<{ title: string; rows: number }>;
}

/**
 * SettingsSkeleton - Loading state matching global light system
 * 
 * Uses light card containers with subtle shimmer animation
 */
export function SettingsSkeleton({ 
  sections = [
    { title: 'Account', rows: 3 },
    { title: 'Identity & Creator', rows: 2 },
    { title: 'Privacy & Safety', rows: 2 },
    { title: 'Notifications', rows: 1 },
    { title: 'Security', rows: 1 },
    { title: 'Support', rows: 3 },
    { title: 'Legal', rows: 3 },
    { title: 'Danger Zone', rows: 1 },
  ]
}: SettingsSkeletonProps) {
  return (
    <div className="space-y-[18px] md:space-y-[22px]">
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx} className="space-y-2">
          {/* Section title skeleton */}
          <div className="px-3.5">
            <div 
              className="h-3 rounded-md animate-pulse"
              style={{ 
                width: `${section.title.length * 8}px`,
                background: 'rgba(31,36,40,0.08)' 
              }}
            />
          </div>

          {/* Card container */}
          <div
            className={cn(
              'rounded-[16px] overflow-hidden',
              'border border-[rgba(31,36,40,0.06)]',
              'bg-[#FAFAFB]'
            )}
          >
            {Array.from({ length: section.rows }).map((_, rowIdx) => (
              <SkeletonRow 
                key={rowIdx} 
                isLast={rowIdx === section.rows - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonRow({ isLast }: { isLast: boolean }) {
  // Randomize widths slightly for natural look
  const titleWidth = 42 + Math.random() * 16; // 42-58%
  const subtitleWidth = 55 + Math.random() * 17; // 55-72%

  return (
    <div className="relative min-h-[52px] px-[14px] py-[12px] flex items-center gap-3">
      {/* Icon circle */}
      <div 
        className="w-[18px] h-[18px] rounded-full animate-pulse"
        style={{ background: 'rgba(31,36,40,0.07)' }}
      />

      {/* Text content */}
      <div className="flex-1 space-y-2">
        <div 
          className="h-3 rounded-md"
          style={{ 
            width: `${titleWidth}%`,
            background: 'linear-gradient(90deg, rgba(31,36,40,0.08) 0%, rgba(31,36,40,0.12) 50%, rgba(31,36,40,0.08) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer-slide 1.4s ease-in-out infinite',
          }}
        />
        <div 
          className="h-2.5 rounded-md"
          style={{ 
            width: `${subtitleWidth}%`,
            background: 'linear-gradient(90deg, rgba(31,36,40,0.06) 0%, rgba(31,36,40,0.10) 50%, rgba(31,36,40,0.06) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer-slide 1.4s ease-in-out infinite',
            animationDelay: '0.2s',
          }}
        />
      </div>

      {/* Right control */}
      <div 
        className="w-10 h-3 rounded-md animate-pulse"
        style={{ background: 'rgba(31,36,40,0.07)' }}
      />

      {/* Divider */}
      {!isLast && (
        <div 
          className="absolute bottom-0 left-[14px] right-[14px] h-[1px]"
          style={{ background: 'rgba(31,36,40,0.06)' }}
        />
      )}
    </div>
  );
}
