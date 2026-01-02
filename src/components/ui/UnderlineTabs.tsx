import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface UnderlineTabOption {
  value: string;
  label: string;
}

interface UnderlineTabsProps {
  options: UnderlineTabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Underline-style tabs matching Courses page design
 * - Active tab: darker text + thin orange underline
 * - Inactive: grey text, no background
 * - Animated sliding underline
 */
export function UnderlineTabs({ options, value, onChange, className = '' }: UnderlineTabsProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  // Update underline position when active tab changes
  useEffect(() => {
    const activeIndex = options.findIndex(opt => opt.value === value);
    const activeTabElement = tabsRef.current[activeIndex];
    
    if (activeTabElement && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeTabElement.getBoundingClientRect();
      setUnderlineStyle({ 
        left: tabRect.left - containerRect.left, 
        width: tabRect.width 
      });
    }
  }, [value, options]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      const activeIndex = options.findIndex(opt => opt.value === value);
      const activeTabElement = tabsRef.current[activeIndex];
      
      if (activeTabElement && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const tabRect = activeTabElement.getBoundingClientRect();
        setUnderlineStyle({ 
          left: tabRect.left - containerRect.left, 
          width: tabRect.width 
        });
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial calculation after mount
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [options, value]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex gap-1 overflow-x-auto scrollbar-hide",
        className
      )}
    >
      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => { tabsRef.current[index] = el; }}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            {option.label}
          </button>
        );
      })}

      {/* Animated orange underline */}
      <div 
        className="absolute bottom-0 h-0.5 bg-orange-500 transition-all duration-200 ease-out rounded-full"
        style={{
          left: underlineStyle.left,
          width: underlineStyle.width,
        }}
      />
    </div>
  );
}
