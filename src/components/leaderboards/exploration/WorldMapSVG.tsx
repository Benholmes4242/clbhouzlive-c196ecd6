import { cn } from '@/lib/utils';

interface WorldMapSVGProps {
  highlightedContinents: string[];
  className?: string;
}

/**
 * Simplified world map SVG with 7 continent shapes
 * Highlights continents the user has played in
 */
export function WorldMapSVG({ highlightedContinents, className }: WorldMapSVGProps) {
  const isHighlighted = (continent: string) => 
    highlightedContinents.includes(continent);

  const highlightColor = '#14B8A6'; // Teal-500
  const defaultColor = '#E2E8F0'; // Slate-200

  return (
    <svg 
      viewBox="0 0 800 400" 
      className={cn('w-full h-auto', className)}
      aria-label="World map showing continents visited"
    >
      {/* Glow filter for highlighted continents */}
      <defs>
        <filter id="continent-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* North America */}
      <path
        d="M80,60 L120,45 L180,50 L220,70 L240,100 L230,140 L200,170 L160,180 L120,170 L80,150 L60,120 L50,90 Z"
        fill={isHighlighted('North America') ? highlightColor : defaultColor}
        filter={isHighlighted('North America') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
      {/* Central America / Caribbean connection */}
      <path
        d="M160,180 L170,200 L165,220 L150,230 L140,220 L145,200 Z"
        fill={isHighlighted('North America') ? highlightColor : defaultColor}
        filter={isHighlighted('North America') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />

      {/* South America */}
      <path
        d="M150,230 L180,240 L200,270 L210,320 L190,360 L160,370 L130,350 L120,300 L130,260 L140,240 Z"
        fill={isHighlighted('South America') ? highlightColor : defaultColor}
        filter={isHighlighted('South America') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />

      {/* Europe */}
      <path
        d="M380,50 L420,45 L450,55 L470,70 L480,95 L470,120 L440,130 L400,125 L370,110 L360,85 L365,60 Z"
        fill={isHighlighted('Europe') ? highlightColor : defaultColor}
        filter={isHighlighted('Europe') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
      {/* UK/Ireland */}
      <path
        d="M350,65 L365,60 L370,75 L360,85 L350,80 Z"
        fill={isHighlighted('Europe') ? highlightColor : defaultColor}
        filter={isHighlighted('Europe') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
      {/* Scandinavia */}
      <path
        d="M420,30 L440,25 L455,35 L450,55 L430,50 L420,40 Z"
        fill={isHighlighted('Europe') ? highlightColor : defaultColor}
        filter={isHighlighted('Europe') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />

      {/* Africa */}
      <path
        d="M380,140 L430,135 L470,150 L490,190 L480,250 L450,300 L400,320 L360,300 L340,260 L350,200 L360,160 Z"
        fill={isHighlighted('Africa') ? highlightColor : defaultColor}
        filter={isHighlighted('Africa') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
      {/* Madagascar */}
      <path
        d="M500,280 L510,275 L515,300 L505,310 L495,300 Z"
        fill={isHighlighted('Africa') ? highlightColor : defaultColor}
        filter={isHighlighted('Africa') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />

      {/* Asia */}
      <path
        d="M490,50 L550,40 L620,45 L680,60 L720,90 L730,140 L710,180 L660,200 L600,210 L540,200 L490,170 L480,130 L485,90 Z"
        fill={isHighlighted('Asia') ? highlightColor : defaultColor}
        filter={isHighlighted('Asia') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
      {/* Middle East connection */}
      <path
        d="M480,130 L510,125 L530,140 L520,160 L490,170 L480,150 Z"
        fill={isHighlighted('Asia') ? highlightColor : defaultColor}
        filter={isHighlighted('Asia') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
      {/* India */}
      <path
        d="M560,180 L590,175 L610,200 L600,240 L570,250 L550,230 L545,200 Z"
        fill={isHighlighted('Asia') ? highlightColor : defaultColor}
        filter={isHighlighted('Asia') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
      {/* Southeast Asia */}
      <path
        d="M620,210 L660,200 L680,220 L670,250 L640,260 L610,250 L615,225 Z"
        fill={isHighlighted('Asia') ? highlightColor : defaultColor}
        filter={isHighlighted('Asia') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
      {/* Japan */}
      <path
        d="M730,100 L745,95 L755,110 L750,130 L735,135 L725,120 Z"
        fill={isHighlighted('Asia') ? highlightColor : defaultColor}
        filter={isHighlighted('Asia') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />

      {/* Oceania / Australia */}
      <path
        d="M640,280 L700,270 L740,290 L750,330 L730,360 L680,370 L630,355 L620,320 L625,295 Z"
        fill={isHighlighted('Oceania') ? highlightColor : defaultColor}
        filter={isHighlighted('Oceania') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
      {/* New Zealand */}
      <path
        d="M770,340 L780,335 L785,350 L780,365 L770,360 Z"
        fill={isHighlighted('Oceania') ? highlightColor : defaultColor}
        filter={isHighlighted('Oceania') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
      {/* Papua New Guinea / Indonesia islands */}
      <path
        d="M680,260 L710,255 L720,270 L710,280 L685,275 Z"
        fill={isHighlighted('Oceania') ? highlightColor : defaultColor}
        filter={isHighlighted('Oceania') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />

      {/* Antarctica (simplified) */}
      <path
        d="M200,385 L350,380 L500,382 L600,385 L650,390 L600,395 L400,398 L200,395 L150,390 Z"
        fill={isHighlighted('Antarctica') ? highlightColor : defaultColor}
        filter={isHighlighted('Antarctica') ? 'url(#continent-glow)' : undefined}
        className="transition-colors duration-300"
      />
    </svg>
  );
}
