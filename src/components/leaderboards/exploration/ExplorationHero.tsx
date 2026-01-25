import { Globe } from 'lucide-react';

export function ExplorationHero() {
  return (
    <div className="relative overflow-hidden px-4 py-6">
      {/* Subtle globe watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <Globe className="w-64 h-64 text-teal-600" />
      </div>
      
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 mb-3">
          <Globe className="w-6 h-6 text-teal-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          Explore the World
        </h2>
        <p className="text-sm text-muted-foreground">
          Countries, regions and continents played
        </p>
      </div>
    </div>
  );
}
