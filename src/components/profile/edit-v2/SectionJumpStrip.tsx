import React from 'react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  label: string;
}

interface SectionJumpStripProps {
  sections: Section[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export const SectionJumpStrip: React.FC<SectionJumpStripProps> = ({
  sections,
  activeSection,
  onSectionClick,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          <button
            type="button"
            onClick={() => onSectionClick(section.id)}
            className={cn(
              "text-xs whitespace-nowrap px-2.5 py-1 rounded-sq-pill transition-all",
              activeSection === section.id
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {section.label}
          </button>
          {index < sections.length - 1 && (
            <span className="text-muted-foreground/30 text-xs">·</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
