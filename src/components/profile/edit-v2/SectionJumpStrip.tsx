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
              "text-xs whitespace-nowrap px-3 py-1.5 rounded-full transition-all",
              activeSection === section.id
                ? "bg-slate-900 text-white font-medium"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {section.label}
          </button>
          {index < sections.length - 1 && (
            <span className="text-slate-300 text-xs">·</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
