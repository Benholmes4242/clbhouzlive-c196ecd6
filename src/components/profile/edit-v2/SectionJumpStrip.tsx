import React from 'react';
import { Camera, User, MapPin, FileText, Shield, Check } from 'lucide-react';
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
  completedSections?: string[];
}

const sectionIcons: Record<string, React.ElementType> = {
  photos: Camera,
  basic: User,
  golf: MapPin,
  bio: FileText,
  privacy: Shield,
};

/**
 * SectionJumpStrip - Tab-style navigation with icons
 * Uses underline active state with orange accent
 * Updated with design system colors
 */
export const SectionJumpStrip: React.FC<SectionJumpStripProps> = ({
  sections,
  activeSection,
  onSectionClick,
  completedSections = [],
}) => {
  return (
    <div 
      className="discover-header relative w-full bg-[#F8FAFC]"
      role="tablist"
      aria-label="Profile sections"
    >
      <div className="discover-tabs flex w-full items-center justify-center">
        <div className="flex gap-1">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            const isComplete = completedSections.includes(section.id);
            const Icon = sectionIcons[section.id];

            return (
              <button
                key={section.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSectionClick(section.id)}
                className={cn(
                  "discover-tab flex items-center gap-1.5 px-3 py-[10px] text-center relative z-10 text-[13px] font-medium leading-tight",
                  "transition-all duration-[120ms] ease-out",
                  "active:scale-[0.97] motion-reduce:active:scale-100",
                  isActive 
                    ? "active text-[#1e293b]" 
                    : "text-[#64748b] hover:text-[#1e293b]/80 motion-reduce:transition-none"
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{section.label}</span>
                {isComplete && !isActive && (
                  <Check className="w-3 h-3 text-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
