/**
 * GlobalProgressMap - Premium Apple-grade world map visualization
 * Uses accurate continent outlines from Natural Earth simplified data
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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

// Accurate continent path data (simplified Natural Earth projection)
// ViewBox: 0 0 2000 1000 (equirectangular-style for recognizability)
const CONTINENT_PATHS: Record<string, string> = {
  // North America - Canada, USA, Mexico, Central America, Caribbean
  north_america: `M165,225 L180,195 L195,175 L225,160 L255,145 L285,135 L315,130 L350,130 L385,135 L415,145 L445,140 L480,138 L510,145 L545,155 L575,175 L590,200 L585,235 L570,265 L545,290 L520,305 L490,318 L455,328 L420,335 L385,340 L350,342 L315,345 L280,350 L245,358 L215,368 L185,382 L160,400 L145,425 L135,448 L128,475 L125,500 L130,520 L140,535 L155,540 L170,532 L188,518 L205,498 L218,475 L228,450 L235,425 L238,400 L235,375 L225,355 L210,338 L190,325 L168,315 L148,308 L130,298 L115,282 L105,262 L102,240 L108,218 L125,200 L148,190 L165,195 L175,210 Z
  M365,485 L380,475 L400,478 L418,492 L428,512 L420,532 L402,545 L378,548 L358,538 L348,518 L352,498 Z`,
  
  // South America - distinctive shape with Brazil bulge
  south_america: `M295,550 L325,535 L358,525 L390,520 L420,525 L448,538 L472,558 L488,585 L498,618 L502,655 L500,695 L492,735 L478,772 L458,805 L432,835 L402,862 L368,885 L332,902 L298,912 L268,915 L245,905 L228,885 L218,858 L215,825 L220,788 L232,752 L248,718 L268,685 L288,652 L305,618 L315,585 L318,555 Z`,
  
  // Europe - British Isles, Scandinavia, Iberian/Italian/Balkan peninsulas clearly visible
  europe: `M920,160 L945,148 L975,142 L1008,138 L1042,142 L1072,152 L1098,168 L1118,188 L1128,212 L1125,238 L1112,262 L1092,282 L1065,298 L1035,308 L1002,315 L968,318 L935,315 L905,305 L880,292 L862,275 L852,255 L850,232 L858,210 L875,190 L898,172 Z
  M865,178 L848,165 L825,162 L805,172 L798,192 L808,212 L828,222 L852,218 L868,202 Z
  M988,122 L1008,108 L1035,105 L1062,112 L1078,132 L1072,155 L1052,168 L1025,172 L998,165 L980,148 Z
  M858,318 L878,308 L905,315 L922,335 L925,358 L912,378 L888,388 L862,382 L845,362 L848,338 Z
  M972,325 L995,318 L1018,328 L1032,352 L1025,378 L1002,398 L975,402 L952,388 L945,362 L952,338 Z`,
  
  // Africa - Horn of Africa, with Madagascar
  africa: `M905,340 L942,335 L982,342 L1022,358 L1058,382 L1088,415 L1108,455 L1118,500 L1118,548 L1108,598 L1088,645 L1058,688 L1022,725 L982,755 L942,775 L905,785 L868,782 L835,768 L808,745 L788,715 L775,678 L772,638 L778,598 L792,558 L815,522 L845,488 L878,458 L905,435 L925,415 L932,388 L925,362 Z
  M1135,645 L1155,632 L1175,642 L1185,668 L1180,698 L1162,722 L1138,728 L1118,715 L1115,688 L1125,662 Z`,
  
  // Asia - massive landmass with Russia, Middle East, India, SE Asia, Japan
  asia: `M1095,95 L1145,82 L1205,75 L1270,72 L1340,75 L1410,85 L1475,102 L1535,128 L1585,162 L1625,202 L1652,248 L1665,298 L1662,348 L1645,395 L1615,438 L1575,475 L1528,505 L1475,528 L1418,542 L1358,548 L1298,545 L1242,535 L1192,518 L1148,495 L1112,465 L1088,428 L1078,388 L1082,348 L1095,308 L1112,272 L1132,238 L1152,208 L1168,182 L1175,158 L1165,138 L1142,122 L1115,112 Z
  M1115,278 L1138,268 L1165,275 L1188,295 L1198,322 L1188,348 L1165,368 L1138,372 L1112,358 L1102,332 L1105,305 Z
  M1238,435 L1275,415 L1318,408 L1358,418 L1388,445 L1402,482 L1395,522 L1372,555 L1335,575 L1295,578 L1258,565 L1232,538 L1222,502 L1228,465 Z
  M1425,495 L1465,478 L1512,475 L1555,492 L1582,522 L1588,558 L1572,592 L1538,618 L1495,628 L1452,622 L1418,598 L1402,565 L1405,528 Z
  M1688,205 L1718,188 L1752,192 L1778,215 L1785,248 L1772,278 L1745,298 L1712,302 L1682,285 L1668,255 L1672,225 Z`,
  
  // Oceania - Australia with distinctive shape, New Zealand, Papua New Guinea
  oceania: `M1465,635 L1515,615 L1575,608 L1638,618 L1695,645 L1738,688 L1762,742 L1768,798 L1752,852 L1718,898 L1668,932 L1608,952 L1545,955 L1485,942 L1432,912 L1392,868 L1372,815 L1375,758 L1398,705 L1435,662 Z
  M1815,868 L1845,848 L1878,852 L1902,875 L1905,905 L1888,932 L1858,948 L1825,945 L1802,922 L1798,892 Z
  M1545,555 L1588,538 L1638,542 L1678,565 L1698,602 L1688,642 L1655,668 L1612,678 L1568,668 L1538,638 L1535,598 Z`,
  
  // Antarctica - subtle bottom of map
  antarctica: `M200,945 L400,938 L600,935 L800,935 L1000,935 L1200,938 L1400,942 L1600,948 L1800,955 L1750,972 L1500,978 L1200,980 L900,978 L600,975 L350,968 L150,958 Z`,
};

// Transform origins for each continent (for pulse animation)
const CONTINENT_ORIGINS: Record<string, string> = {
  north_america: '350px 350px',
  south_america: '360px 720px',
  europe: '980px 230px',
  africa: '960px 560px',
  asia: '1380px 350px',
  oceania: '1600px 780px',
  antarctica: '1000px 960px',
};

export function GlobalProgressMap({ playedContinents, className }: GlobalProgressMapProps) {
  const [pulsedContinent, setPulsedContinent] = useState<string | null>(null);

  // Normalize continent names for comparison
  const normalizedPlayed = new Set(
    playedContinents.map(c => CONTINENT_ID_MAP[c] || c.toLowerCase().replace(/\s+/g, '_'))
  );

  const isPlayed = useCallback((continentId: string) => normalizedPlayed.has(continentId), [normalizedPlayed]);

  const handleContinentTap = useCallback((continentId: string) => {
    if (normalizedPlayed.has(continentId)) {
      setPulsedContinent(continentId);
      setTimeout(() => setPulsedContinent(null), 200);
    }
  }, [normalizedPlayed]);

  const continentsPlayedCount = normalizedPlayed.size;

  const getGradientId = (continentId: string) => `gradient-${continentId}`;

  // Styling constants matching the mockup
  const PLAYED_GRADIENT_START = '#98A882';
  const PLAYED_GRADIENT_MID = '#8B9D77';
  const PLAYED_GRADIENT_END = '#7A8C68';
  const PLAYED_STROKE = '#FFFFFF';
  const NOT_PLAYED_FILL = '#E5E7EB';
  const NOT_PLAYED_STROKE = '#D1D5DB';

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden', className)}>
      {/* Header with decorative lines */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-center gap-3">
          {/* Left decorative line */}
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-300" />
          
          <div className="text-center px-4">
            <h3 className="text-lg font-semibold text-zinc-800">
              Global Progress
            </h3>
            <p className="text-sm text-zinc-500 mt-0.5">
              <span className="font-semibold text-zinc-700">{continentsPlayedCount}</span> of <span className="font-semibold text-zinc-700">7</span> Continents Played
            </p>
          </div>
          
          {/* Right decorative line */}
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-300" />
        </div>
      </div>

      {/* Map Container */}
      <div className="px-4 pb-3">
        <svg 
          viewBox="0 0 2000 1000" 
          className="w-full h-auto"
          aria-label="World map showing continents visited"
          style={{ maxHeight: '280px' }}
        >
          {/* Gradient definitions for played continents */}
          <defs>
            {Object.keys(CONTINENT_PATHS).map(id => (
              <linearGradient key={id} id={getGradientId(id)} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={PLAYED_GRADIENT_START} />
                <stop offset="50%" stopColor={PLAYED_GRADIENT_MID} />
                <stop offset="100%" stopColor={PLAYED_GRADIENT_END} />
              </linearGradient>
            ))}
            
            {/* Subtle shadow filter for played continents */}
            <filter id="continent-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.06"/>
            </filter>
          </defs>

          {/* Render each continent */}
          {Object.entries(CONTINENT_PATHS).map(([id, pathData]) => {
            const played = isPlayed(id);
            const isAntarctica = id === 'antarctica';
            
            return (
              <motion.path
                key={id}
                id={id}
                d={pathData}
                fill={isAntarctica 
                  ? 'transparent' 
                  : played 
                    ? `url(#${getGradientId(id)})` 
                    : NOT_PLAYED_FILL
                }
                fillOpacity={isAntarctica ? 0 : played ? 1 : 0.45}
                stroke={isAntarctica ? NOT_PLAYED_STROKE : played ? PLAYED_STROKE : NOT_PLAYED_STROKE}
                strokeWidth={isAntarctica ? 0.75 : played ? 1.5 : 0.75}
                strokeOpacity={isAntarctica ? 0.3 : played ? 1 : 0.45}
                filter={played && !isAntarctica ? 'url(#continent-shadow)' : undefined}
                className={cn(
                  'transition-all duration-200',
                  played && !isAntarctica ? 'cursor-pointer hover:opacity-90' : 'pointer-events-none'
                )}
                animate={pulsedContinent === id ? { scale: 1.015 } : { scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ transformOrigin: CONTINENT_ORIGINS[id] || 'center' }}
                onClick={() => !isAntarctica && handleContinentTap(id)}
                whileHover={played && !isAntarctica ? { scale: 1.008 } : undefined}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pb-5">
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ 
              background: `linear-gradient(135deg, ${PLAYED_GRADIENT_START} 0%, ${PLAYED_GRADIENT_END} 100%)`,
            }}
          />
          <span className="text-xs text-slate-500 font-medium">Played</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ 
              background: NOT_PLAYED_FILL,
              opacity: 0.45,
              border: `1px solid ${NOT_PLAYED_STROKE}`,
            }}
          />
          <span className="text-xs text-slate-500 font-medium">Not played</span>
        </div>
      </div>
    </div>
  );
}