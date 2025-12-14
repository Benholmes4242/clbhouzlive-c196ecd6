/**
 * CoursesWorldPreview - Map preview module for courses played
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Globe, ChevronRight } from 'lucide-react';
import { CoursesWorldData } from './types';

interface CoursesWorldPreviewProps {
  data: CoursesWorldData;
  onOpenMap?: () => void;
  className?: string;
}

export const CoursesWorldPreview: React.FC<CoursesWorldPreviewProps> = ({
  data,
  onOpenMap,
  className,
}) => {
  return (
    <section className={cn('px-5 py-6', className)}>
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: 'var(--dgp-text-primary)' }}
      >
        Your Golf World
      </h2>

      <button
        onClick={onOpenMap}
        className="w-full dgp-glass-card rounded-2xl overflow-hidden transition-transform active:scale-[0.98]"
      >
        {/* Map Preview Area */}
        <div
          className="relative h-32 w-full"
          style={{
            background: 'linear-gradient(135deg, #1a2a1f 0%, #0d1a12 50%, #0a1510 100%)',
          }}
        >
          {/* Stylized map pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 400 128" preserveAspectRatio="xMidYMid slice">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(110, 146, 119, 0.15)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Stylized landmass shapes */}
              <ellipse cx="100" cy="60" rx="60" ry="30" fill="rgba(110, 146, 119, 0.1)" />
              <ellipse cx="280" cy="50" rx="80" ry="35" fill="rgba(110, 146, 119, 0.1)" />
              <ellipse cx="200" cy="90" rx="40" ry="20" fill="rgba(110, 146, 119, 0.08)" />
            </svg>
          </div>

          {/* Pin indicators */}
          <div className="absolute inset-0 flex items-center justify-center gap-8">
            {[...Array(Math.min(data.totalCoursesPlayed, 5))].map((_, i) => (
              <MapPin
                key={i}
                className="w-4 h-4"
                style={{
                  color: 'var(--dgp-accent-green)',
                  transform: `translate(${(i - 2) * 20}px, ${Math.sin(i) * 15}px)`,
                  opacity: 0.8 - i * 0.1,
                }}
              />
            ))}
          </div>

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 50%, var(--dgp-bg-surface) 100%)',
            }}
          />
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: 'var(--dgp-accent-green)' }} />
              <div className="text-left">
                <p
                  className="text-lg font-semibold"
                  style={{ color: 'var(--dgp-text-primary)' }}
                >
                  {data.totalCoursesPlayed}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--dgp-text-muted)' }}
                >
                  Courses
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" style={{ color: 'var(--dgp-accent-gold)' }} />
              <div className="text-left">
                <p
                  className="text-lg font-semibold"
                  style={{ color: 'var(--dgp-text-primary)' }}
                >
                  {data.top100Played}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--dgp-text-muted)' }}
                >
                  Top 100
                </p>
              </div>
            </div>

            {data.countries && (
              <div className="text-left">
                <p
                  className="text-lg font-semibold"
                  style={{ color: 'var(--dgp-text-primary)' }}
                >
                  {data.countries}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--dgp-text-muted)' }}
                >
                  Countries
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--dgp-accent-green)' }}
            >
              Open Map
            </span>
            <ChevronRight
              className="w-4 h-4"
              style={{ color: 'var(--dgp-accent-green)' }}
            />
          </div>
        </div>
      </button>
    </section>
  );
};

export default CoursesWorldPreview;
