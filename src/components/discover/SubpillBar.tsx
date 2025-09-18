import React from 'react';
import { cn } from "@/lib/utils";
import { useDiscoverQuery } from "@/utils/useDiscoverQuery";

export default function SubpillBar() {
  const { sub, setSub, allowedSubpills } = useDiscoverQuery();

  return (
    <div
      className="w-full sticky top-[var(--discover-subpills-top,0px)] z-[18] bg-transparent"
      aria-label="Sub filters"
    >
      <div className="px-1 md:container md:mx-auto md:px-0">
        <div 
          className="flex gap-2 overflow-x-auto scrollbar-hide py-2"
          role="tablist" 
          aria-orientation="horizontal"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth'
          }}
        >
          {allowedSubpills.map((label) => (
            <button
              key={label}
              role="tab"
              aria-selected={sub === label}
              onClick={() => setSub(label)}
              className={cn(
                "pill",
                sub === label && "pill--active"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}