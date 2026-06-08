/**
 * JourneySummaryCard — Course Legacy stat card.
 * Eyebrow ABOVE the card; white card surface with centered big number
 * + divided KPI strip (countries / avg rating).
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Trophy, Globe, Star } from 'lucide-react';
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

const FONT_SANS =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const CARD_STYLE: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '0.5px solid rgba(15,23,42,0.08)',
  overflow: 'hidden',
};

// Canonical amber eyebrow with icon (matches Courses Discover SectionLabel)
const Eyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-1.5 mb-2 px-2.5">
    <Trophy size={11} strokeWidth={2.4} color="#F7931E" />
    <span
      style={{
        fontFamily: FONT_SANS,
        fontSize: 10.5,
        fontWeight: 800,
        color: '#F7931E',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  </div>
);

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

  const eyebrowLabel = isOwnProfile
    ? 'Your Course Legacy'
    : `${displayName || 'Their'}'s Course Legacy`;

  // Empty state — sits inside the same card surface for consistency.
  if (coursesPlayed === 0) {
    return (
      <div className={cn('', className)}>
        <Eyebrow label={eyebrowLabel} />
        <div style={{ ...CARD_STYLE, padding: '28px 20px' }}>
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{
                background: 'rgba(15,23,42,0.05)',
                border: '0.5px solid rgba(15,23,42,0.08)',
              }}
            >
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>

            <h3
              className="mb-1"
              style={{
                fontFamily: FONT_SANS,
                fontSize: 16,
                fontWeight: 700,
                color: '#0F172A',
              }}
            >
              {isOwnProfile ? 'Start Building Your Legacy' : 'No Courses Played Yet'}
            </h3>

            <p
              className="mb-5 max-w-xs"
              style={{ fontFamily: FONT_SANS, fontSize: 13, color: '#64748B' }}
            >
              {isOwnProfile
                ? 'Play and rate courses to track your golf journey'
                : "This golfer hasn't logged any courses yet."}
            </p>

            {isOwnProfile && (
              <button
                onClick={() => navigate('/courses')}
                className="px-5 py-2.5 rounded-full transition-colors min-h-[44px] active:scale-[0.97]"
                style={{
                  background: '#FFFFFF',
                  border: '0.5px solid rgba(15,23,42,0.12)',
                  color: '#0F172A',
                  fontFamily: FONT_SANS,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Find Courses
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const showCountries = countriesPlayed > 0;
  const showAvg = avgRating !== null && avgRating > 0;
  const hasStrip = showCountries || showAvg;
  const bothCells = showCountries && showAvg;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('', className)}
    >
      <Eyebrow label={eyebrowLabel} />

      <div style={CARD_STYLE}>
        {/* Big number */}
        <div
          style={{
            padding: '18px 18px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: FONT_SANS,
              fontWeight: 800,
              fontSize: 56,
              color: '#0F172A',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {coursesPlayed}
          </div>
          <p
            style={{
              fontFamily: FONT_SANS,
              marginTop: 6,
              fontSize: 12.5,
              color: '#64748B',
              letterSpacing: '-0.005em',
            }}
          >
            {coursesPlayed === 1 ? 'Course Played' : 'Courses Played'}
          </p>
        </div>

        {/* Divided KPI strip */}
        {hasStrip && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: bothCells ? '1fr 1fr' : '1fr',
              borderTop: '0.5px solid rgba(15,23,42,0.06)',
            }}
          >
            {showCountries && (
              <div
                style={{
                  padding: '12px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRight: bothCells
                    ? '0.5px solid rgba(15,23,42,0.06)'
                    : 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#0F172A',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.1,
                  }}
                >
                  {countriesPlayed}
                </div>
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    marginTop: 4,
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: '#94A3B8',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {countriesPlayed === 1 ? 'Country' : 'Countries'}
                </div>
              </div>
            )}
            {showAvg && (
              <div
                style={{
                  padding: '12px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#0F172A',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.1,
                  }}
                >
                  {(avgRating as number).toFixed(1)}
                </div>
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    marginTop: 4,
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: '#94A3B8',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Avg Rating
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
