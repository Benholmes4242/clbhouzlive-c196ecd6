import { Globe } from 'lucide-react';

export function ExplorationHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 mt-8">
      {/* World map texture background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none">
        <svg viewBox="0 0 800 400" className="w-[500px] h-auto text-emerald-700">
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

      {/* Content */}
      <div className="relative z-10 px-6 py-8 text-center">
        {/* Globe Icon */}
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
          <Globe className="w-6 h-6 text-emerald-600" />
        </div>

        {/* Title and Subtitle */}
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Explore the World
        </h2>
        <p className="text-sm text-gray-500">
          Countries and continents played
        </p>
      </div>
    </div>
  );
}