/**
 * GlobalProgressMap - Premium Apple-grade world map visualization
 * Shows continents played with proper geographic shapes and styling
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlobalProgressMapProps {
  playedContinents: string[];
  className?: string;
}

// Map continent names to SVG IDs
const CONTINENT_ID_MAP: Record<string, string> = {
  'North America': 'north_america',
  'South America': 'south_america',
  'Europe': 'europe',
  'Africa': 'africa',
  'Asia': 'asia',
  'Oceania': 'oceania',
  'Antarctica': 'antarctica',
};

// Reverse map for display names
const CONTINENT_DISPLAY_NAMES: Record<string, string> = {
  'north_america': 'North America',
  'south_america': 'South America',
  'europe': 'Europe',
  'africa': 'Africa',
  'asia': 'Asia',
  'oceania': 'Oceania',
  'antarctica': 'Antarctica',
};

// Brand green color (matching the design)
const PLAYED_FILL = '#7C9A5E';
const PLAYED_STROKE = '#FFFFFF';
const NOT_PLAYED_STROKE = '#D1D5DB';

export function GlobalProgressMap({ playedContinents, className }: GlobalProgressMapProps) {
  const [pulsedContinent, setPulsedContinent] = useState<string | null>(null);

  // Normalize continent names for comparison
  const normalizedPlayed = new Set(
    playedContinents.map(c => CONTINENT_ID_MAP[c] || c.toLowerCase().replace(/\s+/g, '_'))
  );

  const isPlayed = (continentId: string) => normalizedPlayed.has(continentId);

  const handleContinentTap = useCallback((continentId: string) => {
    if (isPlayed(continentId)) {
      setPulsedContinent(continentId);
      setTimeout(() => setPulsedContinent(null), 200);
    }
  }, [normalizedPlayed]);

  const continentsPlayedCount = normalizedPlayed.size;

  // Generate gradient IDs for played continents
  const getGradientId = (continentId: string) => `gradient-${continentId}`;

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-center gap-3">
          {/* Left decorative line */}
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-200" />
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800">
              Global Progress
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {continentsPlayedCount} of 7 Continents Played
            </p>
          </div>
          
          {/* Right decorative line */}
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-200" />
        </div>
      </div>

      {/* Map Container */}
      <div className="px-4 pb-3">
        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-auto"
          aria-label="World map showing continents visited"
        >
          {/* Gradient definitions for played continents */}
          <defs>
            {['north_america', 'south_america', 'europe', 'africa', 'asia', 'oceania', 'antarctica'].map(id => (
              <linearGradient key={id} id={getGradientId(id)} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8AAD6A" />
                <stop offset="100%" stopColor="#6B8B4E" />
              </linearGradient>
            ))}
            
            {/* Subtle shadow filter for played continents */}
            <filter id="continent-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08"/>
            </filter>
          </defs>

          {/* North America */}
          <motion.path
            id="north_america"
            d="M40,120 L80,100 L95,85 L130,75 L170,70 L200,65 L235,72 L260,95 L270,125 L265,160 L250,190 L235,205 L215,225 L195,235 L175,245 L160,250 L145,242 L130,225 L115,215 L100,210 L85,205 L70,195 L55,175 L45,155 L40,140 Z M165,255 L175,260 L185,280 L180,295 L165,300 L155,290 L150,275 L155,260 Z"
            fill={isPlayed('north_america') ? `url(#${getGradientId('north_america')})` : 'transparent'}
            stroke={isPlayed('north_america') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
            strokeWidth={isPlayed('north_america') ? 1 : 0.75}
            strokeOpacity={isPlayed('north_america') ? 1 : 0.4}
            filter={isPlayed('north_america') ? 'url(#continent-shadow)' : undefined}
            className="cursor-pointer transition-all duration-200"
            animate={pulsedContinent === 'north_america' ? { scale: 1.02 } : { scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: '150px 165px' }}
            onClick={() => handleContinentTap('north_america')}
          />

          {/* South America */}
          <motion.path
            id="south_america"
            d="M185,310 L205,305 L225,315 L240,340 L250,375 L255,410 L250,440 L235,460 L210,470 L185,465 L165,450 L155,420 L150,385 L155,350 L165,325 L175,315 Z"
            fill={isPlayed('south_america') ? `url(#${getGradientId('south_america')})` : 'transparent'}
            stroke={isPlayed('south_america') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
            strokeWidth={isPlayed('south_america') ? 1 : 0.75}
            strokeOpacity={isPlayed('south_america') ? 1 : 0.4}
            filter={isPlayed('south_america') ? 'url(#continent-shadow)' : undefined}
            className="cursor-pointer transition-all duration-200"
            animate={pulsedContinent === 'south_america' ? { scale: 1.02 } : { scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: '200px 385px' }}
            onClick={() => handleContinentTap('south_america')}
          />

          {/* Europe */}
          <motion.g
            id="europe"
            className="cursor-pointer"
            animate={pulsedContinent === 'europe' ? { scale: 1.02 } : { scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: '500px 115px' }}
            onClick={() => handleContinentTap('europe')}
          >
            {/* Main Europe */}
            <path
              d="M460,70 L480,65 L510,68 L540,75 L560,90 L570,110 L565,135 L550,155 L525,165 L495,168 L465,162 L445,150 L435,130 L440,105 L450,85 Z"
              fill={isPlayed('europe') ? `url(#${getGradientId('europe')})` : 'transparent'}
              stroke={isPlayed('europe') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('europe') ? 1 : 0.75}
              strokeOpacity={isPlayed('europe') ? 1 : 0.4}
              filter={isPlayed('europe') ? 'url(#continent-shadow)' : undefined}
            />
            {/* British Isles */}
            <path
              d="M420,75 L435,70 L445,80 L440,95 L428,100 L418,90 Z"
              fill={isPlayed('europe') ? `url(#${getGradientId('europe')})` : 'transparent'}
              stroke={isPlayed('europe') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('europe') ? 1 : 0.75}
              strokeOpacity={isPlayed('europe') ? 1 : 0.4}
              filter={isPlayed('europe') ? 'url(#continent-shadow)' : undefined}
            />
            {/* Scandinavia */}
            <path
              d="M490,40 L510,35 L530,45 L535,65 L520,75 L500,70 L490,55 Z"
              fill={isPlayed('europe') ? `url(#${getGradientId('europe')})` : 'transparent'}
              stroke={isPlayed('europe') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('europe') ? 1 : 0.75}
              strokeOpacity={isPlayed('europe') ? 1 : 0.4}
              filter={isPlayed('europe') ? 'url(#continent-shadow)' : undefined}
            />
            {/* Iberian Peninsula */}
            <path
              d="M430,145 L455,140 L465,155 L460,175 L440,180 L425,170 L420,155 Z"
              fill={isPlayed('europe') ? `url(#${getGradientId('europe')})` : 'transparent'}
              stroke={isPlayed('europe') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('europe') ? 1 : 0.75}
              strokeOpacity={isPlayed('europe') ? 1 : 0.4}
              filter={isPlayed('europe') ? 'url(#continent-shadow)' : undefined}
            />
            {/* Italy */}
            <path
              d="M495,170 L510,165 L520,185 L515,210 L500,220 L490,205 L488,185 Z"
              fill={isPlayed('europe') ? `url(#${getGradientId('europe')})` : 'transparent'}
              stroke={isPlayed('europe') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('europe') ? 1 : 0.75}
              strokeOpacity={isPlayed('europe') ? 1 : 0.4}
              filter={isPlayed('europe') ? 'url(#continent-shadow)' : undefined}
            />
          </motion.g>

          {/* Africa */}
          <motion.g
            id="africa"
            className="cursor-pointer"
            animate={pulsedContinent === 'africa' ? { scale: 1.02 } : { scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: '510px 300px' }}
            onClick={() => handleContinentTap('africa')}
          >
            <path
              d="M450,185 L490,180 L530,190 L560,215 L575,255 L570,300 L555,345 L530,380 L495,400 L460,395 L435,375 L420,340 L415,295 L420,250 L430,215 Z"
              fill={isPlayed('africa') ? `url(#${getGradientId('africa')})` : 'transparent'}
              stroke={isPlayed('africa') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('africa') ? 1 : 0.75}
              strokeOpacity={isPlayed('africa') ? 1 : 0.4}
              filter={isPlayed('africa') ? 'url(#continent-shadow)' : undefined}
            />
            {/* Madagascar */}
            <path
              d="M585,335 L595,330 L600,355 L595,375 L582,370 L580,350 Z"
              fill={isPlayed('africa') ? `url(#${getGradientId('africa')})` : 'transparent'}
              stroke={isPlayed('africa') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('africa') ? 1 : 0.75}
              strokeOpacity={isPlayed('africa') ? 1 : 0.4}
              filter={isPlayed('africa') ? 'url(#continent-shadow)' : undefined}
            />
          </motion.g>

          {/* Asia */}
          <motion.g
            id="asia"
            className="cursor-pointer"
            animate={pulsedContinent === 'asia' ? { scale: 1.02 } : { scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: '700px 150px' }}
            onClick={() => handleContinentTap('asia')}
          >
            {/* Main Asia */}
            <path
              d="M575,50 L620,40 L680,45 L740,55 L800,75 L850,100 L880,140 L890,180 L875,220 L845,250 L800,270 L745,280 L690,275 L640,260 L600,235 L575,200 L565,160 L568,110 Z"
              fill={isPlayed('asia') ? `url(#${getGradientId('asia')})` : 'transparent'}
              stroke={isPlayed('asia') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('asia') ? 1 : 0.75}
              strokeOpacity={isPlayed('asia') ? 1 : 0.4}
              filter={isPlayed('asia') ? 'url(#continent-shadow)' : undefined}
            />
            {/* Middle East */}
            <path
              d="M565,160 L595,155 L620,175 L615,200 L590,215 L565,200 Z"
              fill={isPlayed('asia') ? `url(#${getGradientId('asia')})` : 'transparent'}
              stroke={isPlayed('asia') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('asia') ? 1 : 0.75}
              strokeOpacity={isPlayed('asia') ? 1 : 0.4}
              filter={isPlayed('asia') ? 'url(#continent-shadow)' : undefined}
            />
            {/* India */}
            <path
              d="M665,220 L700,215 L725,245 L715,290 L685,305 L655,290 L650,255 Z"
              fill={isPlayed('asia') ? `url(#${getGradientId('asia')})` : 'transparent'}
              stroke={isPlayed('asia') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('asia') ? 1 : 0.75}
              strokeOpacity={isPlayed('asia') ? 1 : 0.4}
              filter={isPlayed('asia') ? 'url(#continent-shadow)' : undefined}
            />
            {/* Southeast Asia */}
            <path
              d="M745,265 L780,255 L805,280 L795,315 L760,330 L730,315 L735,285 Z"
              fill={isPlayed('asia') ? `url(#${getGradientId('asia')})` : 'transparent'}
              stroke={isPlayed('asia') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('asia') ? 1 : 0.75}
              strokeOpacity={isPlayed('asia') ? 1 : 0.4}
              filter={isPlayed('asia') ? 'url(#continent-shadow)' : undefined}
            />
            {/* Japan */}
            <path
              d="M885,115 L905,108 L918,130 L912,158 L895,165 L880,150 Z"
              fill={isPlayed('asia') ? `url(#${getGradientId('asia')})` : 'transparent'}
              stroke={isPlayed('asia') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('asia') ? 1 : 0.75}
              strokeOpacity={isPlayed('asia') ? 1 : 0.4}
              filter={isPlayed('asia') ? 'url(#continent-shadow)' : undefined}
            />
          </motion.g>

          {/* Oceania / Australia */}
          <motion.g
            id="oceania"
            className="cursor-pointer"
            animate={pulsedContinent === 'oceania' ? { scale: 1.02 } : { scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: '840px 380px' }}
            onClick={() => handleContinentTap('oceania')}
          >
            {/* Australia */}
            <path
              d="M780,340 L830,325 L885,340 L915,375 L905,420 L870,450 L820,455 L775,440 L755,405 L760,365 Z"
              fill={isPlayed('oceania') ? `url(#${getGradientId('oceania')})` : 'transparent'}
              stroke={isPlayed('oceania') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('oceania') ? 1 : 0.75}
              strokeOpacity={isPlayed('oceania') ? 1 : 0.4}
              filter={isPlayed('oceania') ? 'url(#continent-shadow)' : undefined}
            />
            {/* New Zealand */}
            <path
              d="M935,420 L950,415 L958,440 L950,465 L935,458 Z"
              fill={isPlayed('oceania') ? `url(#${getGradientId('oceania')})` : 'transparent'}
              stroke={isPlayed('oceania') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('oceania') ? 1 : 0.75}
              strokeOpacity={isPlayed('oceania') ? 1 : 0.4}
              filter={isPlayed('oceania') ? 'url(#continent-shadow)' : undefined}
            />
            {/* Papua New Guinea / Indonesia */}
            <path
              d="M820,300 L855,292 L875,315 L865,335 L830,340 L815,325 Z"
              fill={isPlayed('oceania') ? `url(#${getGradientId('oceania')})` : 'transparent'}
              stroke={isPlayed('oceania') ? PLAYED_STROKE : NOT_PLAYED_STROKE}
              strokeWidth={isPlayed('oceania') ? 1 : 0.75}
              strokeOpacity={isPlayed('oceania') ? 1 : 0.4}
              filter={isPlayed('oceania') ? 'url(#continent-shadow)' : undefined}
            />
          </motion.g>

          {/* Antarctica - always shown as not played (perpetually inactive) */}
          <path
            id="antarctica"
            d="M150,480 L350,475 L550,478 L750,480 L900,485 L850,492 L600,495 L300,493 L100,488 Z"
            fill="transparent"
            stroke={NOT_PLAYED_STROKE}
            strokeWidth={0.75}
            strokeOpacity={0.3}
            className="pointer-events-none"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pb-5">
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ 
              background: 'linear-gradient(135deg, #8AAD6A 0%, #6B8B4E 100%)',
            }}
          />
          <span className="text-xs text-slate-500 font-medium">Played</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full border border-slate-300"
            style={{ background: 'transparent' }}
          />
          <span className="text-xs text-slate-500 font-medium">Not played</span>
        </div>
      </div>
    </div>
  );
}
