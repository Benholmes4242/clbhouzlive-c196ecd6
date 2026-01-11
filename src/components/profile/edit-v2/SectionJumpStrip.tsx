import React from 'react';
import { cn } from '@/lib/utils';
import '@/styles/discover-tabs.css';

interface Section {
  id: string;
  label: string;
}

interface SectionJumpStripProps {
  sections: Section[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

/**
 * SectionJumpStrip - Tab-style navigation matching Discover page
 * Uses underline active state with orange accent like Explore, Top 100, Friends tabs
 */
export const SectionJumpStrip: React.FC<SectionJumpStripProps> = ({
  sections,
  activeSection,
  onSectionClick,
}) => {
  return (
    <div 
      className="discover-header relative w-full"
      role="tablist"
      aria-label="Profile sections"
    >
      <div className="discover-tabs flex w-full items-center justify-center">
        <div className="flex">
          {sections.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSectionClick(section.id)}
                className={cn(
                  "discover-tab px-4 py-[10px] text-center relative z-10 text-[14px] font-medium leading-tight",
                  "transition-all duration-[120ms] ease-out",
                  "active:scale-[0.97] motion-reduce:active:scale-100",
                  isActive 
                    ? "active text-foreground" 
                    : "text-muted-foreground hover:text-foreground/80 motion-reduce:transition-none"
                )}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
