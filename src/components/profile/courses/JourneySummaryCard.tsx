/**
 * JourneySummaryCard — Editorial Course Legacy summary.
 * Serif rating numeral, dispatch eyebrow with amber rule marker,
 * single-line dispatch caps stats row. No icon circles.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface JourneySummaryCardProps {
  coursesPlayed: number;
  countriesPlayed: number;
  avgRating: number | null;
  isOwnProfile: boolean;
  displayName?: string;
  className?: string;
}

export const JourneySummaryCard: React.FC<JourneySummaryCardProps> = ({
  coursesPlayed,
  countriesPlayed,
  avgRating,
  isOwnProfile,
  displayName,
  className,
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  // Empty state
  if (coursesPlayed === 0) {
    return (
      <div
        className={cn("rounded-2xl p-8", className)}
        style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}>
            <MapPin className="w-6 h-6 text-muted-foreground" />
          </div>
          
          <h3 className="text-base font-semibold text-foreground mb-1">
            {isOwnProfile ? "Start Building Your Legacy" : "No Courses Played Yet"}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            {isOwnProfile 
              ? "Play and rate courses to track your golf journey"
              : "This golfer hasn't logged any courses yet."}
          </p>
          
          {isOwnProfile && (
            <button
              onClick={() => navigate('/courses')}
              className="px-5 py-2.5 text-sm font-semibold rounded-full transition-colors min-h-[44px] active:scale-[0.97]"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
            >
              Find Courses
            </button>
          )}
        </div>
      </div>
    );
  }

  const showCountries = countriesPlayed > 0;
  const showAvg = avgRating !== null && avgRating > 0;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('px-5 pt-6 pb-5', className)}
    >
      {/* Eyebrow with amber rule marker */}
      <div className="flex items-center gap-1.5 mb-2">
        <div
          style={{
            width: 3,
            height: 8,
            background: '#F7931E',
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: '#F7931E',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {isOwnProfile
            ? 'Your Course Legacy'
            : `${displayName || 'Their'}'s Course Legacy`}
        </span>
      </div>

      {/* Big serif number */}
      <div
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 900,
          fontSize: 56,
          color: '#0F172A',
          letterSpacing: '-0.035em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {coursesPlayed}
      </div>
      <p
        style={{
          marginTop: 4,
          fontSize: 13,
          color: '#64748B',
          letterSpacing: '-0.005em',
        }}
      >
        {coursesPlayed === 1 ? 'Course Played' : 'Courses Played'}
      </p>

      {/* Stats row — single dispatch line */}
      {(showCountries || showAvg) && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#475569',
            flexWrap: 'wrap',
          }}
        >
          {showCountries && (
            <span>
              <span
                style={{
                  color: '#0F172A',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {countriesPlayed}
              </span>{' '}
              {countriesPlayed === 1 ? 'COUNTRY' : 'COUNTRIES'}
            </span>
          )}
          {showCountries && showAvg && (
            <span style={{ color: '#CBD5E1' }}>·</span>
          )}
          {showAvg && (
            <span>
              <span
                style={{
                  color: '#0F172A',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {(avgRating as number).toFixed(1)}
              </span>{' '}
              AVG RATING
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};
