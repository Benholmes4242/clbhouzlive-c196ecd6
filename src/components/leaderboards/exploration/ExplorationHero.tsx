import { Globe } from 'lucide-react';

export function ExplorationHero() {
  return (
    <div className="relative w-full h-[160px] overflow-hidden -mx-0">
      {/* World map texture background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
        <svg viewBox="0 0 800 400" className="w-[500px] h-auto text-teal-600">
          {/* Simplified world outline */}
          <path
            d="M80,60 L120,45 L180,50 L220,70 L240,100 L230,140 L200,170 L160,180 L120,170 L80,150 L60,120 L50,90 Z"
            fill="currentColor"
          />
          <path
            d="M150,230 L180,240 L200,270 L210,320 L190,360 L160,370 L130,350 L120,300 L130,260 L140,240 Z"
            fill="currentColor"
          />
          <path
            d="M380,50 L420,45 L450,55 L470,70 L480,95 L470,120 L440,130 L400,125 L370,110 L360,85 L365,60 Z"
            fill="currentColor"
          />
          <path
            d="M380,140 L430,135 L470,150 L490,190 L480,250 L450,300 L400,320 L360,300 L340,260 L350,200 L360,160 Z"
            fill="currentColor"
          />
          <path
            d="M490,50 L550,40 L620,45 L680,60 L720,90 L730,140 L710,180 L660,200 L600,210 L540,200 L490,170 L480,130 L485,90 Z"
            fill="currentColor"
          />
          <path
            d="M640,280 L700,270 L740,290 L750,330 L730,360 L680,370 L630,355 L620,320 L625,295 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Animated flight path arcs */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <defs>
          <style>
            {`
              @keyframes dash {
                to {
                  stroke-dashoffset: -100;
                }
              }
              .flight-path {
                animation: dash 25s linear infinite;
              }
              @media (prefers-reduced-motion: reduce) {
                .flight-path {
                  animation: none;
                }
              }
            `}
          </style>
        </defs>
        {/* Arc 1 - Europe to North America */}
        <path
          d="M70,80 Q180,30 290,90"
          stroke="currentColor"
          strokeDasharray="4 12"
          fill="none"
          strokeWidth="1.5"
          className="flight-path text-teal-400/20"
        />
        {/* Arc 2 - Asia to Europe */}
        <path
          d="M310,70 Q250,20 180,60"
          stroke="currentColor"
          strokeDasharray="4 12"
          fill="none"
          strokeWidth="1.5"
          className="flight-path text-teal-400/15"
          style={{ animationDelay: '-8s' }}
        />
        {/* Arc 3 - South to North */}
        <path
          d="M140,140 Q190,80 250,50"
          stroke="currentColor"
          strokeDasharray="4 12"
          fill="none"
          strokeWidth="1.5"
          className="flight-path text-teal-400/15"
          style={{ animationDelay: '-16s' }}
        />
        {/* Arc 4 - Long haul */}
        <path
          d="M50,100 Q200,20 350,80"
          stroke="currentColor"
          strokeDasharray="4 12"
          fill="none"
          strokeWidth="1.5"
          className="flight-path text-teal-400/12"
          style={{ animationDelay: '-12s' }}
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {/* Globe Icon with glow */}
        <div className="relative mb-3">
          {/* Glow */}
          <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-xl" />
          {/* Icon container */}
          <div className="relative w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
            <Globe className="w-6 h-6 text-teal-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-900">
          Explore the World
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-slate-500">
          Countries and continents played
        </p>
      </div>
    </div>
  );
}