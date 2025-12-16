import React, { useRef, useEffect, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update indicator position when active section changes
  useEffect(() => {
    const activeButton = buttonRefs.current[activeSection];
    const container = containerRef.current;
    
    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [activeSection]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1"
    >
      {/* Animated background indicator */}
      <div
        className="absolute top-1 h-[calc(100%-8px)] bg-foreground rounded-sq-pill pointer-events-none"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          transition: 'width 220ms ease-out, left 220ms ease-out',
          willChange: 'left, width',
        }}
      />

      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          <button
            ref={(el) => {
              buttonRefs.current[section.id] = el;
            }}
            type="button"
            onClick={() => onSectionClick(section.id)}
            className={cn(
              'relative z-10 text-xs whitespace-nowrap px-3 py-1.5 rounded-sq-pill transition-colors duration-200',
              activeSection === section.id
                ? 'text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {section.label}
          </button>
          {index < sections.length - 1 && (
            <span className="relative z-10 text-muted-foreground/40 text-xs">·</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
