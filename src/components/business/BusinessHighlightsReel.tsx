import React from 'react';
import { GraduationCap, Tag, Calendar, Building2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessHighlightsReelProps {
  businessId: string;
  isOwner: boolean;
  className?: string;
}

// Default highlight categories for businesses
const HIGHLIGHT_CATEGORIES = [
  { id: 'coaching', label: 'Coaching', icon: GraduationCap, color: 'from-blue-400 to-blue-600' },
  { id: 'offers', label: 'Offers', icon: Tag, color: 'from-orange-400 to-orange-600' },
  { id: 'events', label: 'Events', icon: Calendar, color: 'from-purple-400 to-purple-600' },
  { id: 'clubhouse', label: 'Clubhouse', icon: Building2, color: 'from-emerald-400 to-emerald-600' },
];

export function BusinessHighlightsReel({ 
  businessId, 
  isOwner,
  className 
}: BusinessHighlightsReelProps) {
  // TODO: Fetch actual highlight collections from database
  // For now, show placeholder circles

  const handleHighlightClick = (categoryId: string) => {
    // TODO: Open highlight reel modal/sheet
    console.log('Open highlight:', categoryId);
  };

  const handleAddHighlight = () => {
    // TODO: Open add highlight flow
    console.log('Add new highlight');
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-4 px-4 overflow-x-auto scrollbar-hide py-2">
        {HIGHLIGHT_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => handleHighlightClick(category.id)}
              className="flex flex-col items-center gap-1.5 group"
            >
              {/* Circle with gradient border */}
              <div className={cn(
                "w-16 h-16 rounded-full p-[2px] bg-gradient-to-br",
                category.color
              )}>
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center group-hover:bg-muted/50 transition-colors">
                  <Icon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
              {/* Label */}
              <span className="text-[11px] text-muted-foreground font-medium">
                {category.label}
              </span>
            </button>
          );
        })}

        {/* Add button for owners */}
        {isOwner && (
          <button
            onClick={handleAddHighlight}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center group-hover:border-foreground/30 transition-colors">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              New
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
