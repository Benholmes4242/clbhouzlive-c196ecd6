import React, { useState, useRef, useEffect } from 'react';

export interface HudDropdownOption {
  label: string;
  value: string;
}

interface HudDropdownProps {
  /** current value */
  value: string;
  /** options for the dropdown */
  options: HudDropdownOption[];
  /** called when user selects an option */
  onChange: (value: string) => void;

  /** Optional label override for the trigger pill */
  label?: string;
  /** Optional icon on the left of the pill (e.g. filter icon) */
  iconLeft?: React.ReactNode;

  className?: string;
}

/**
 * Apple-style pill trigger + dark popover dropdown.
 * Used across Hub for consistent filters/sorts.
 */
export function HudDropdown({
  value,
  options,
  onChange,
  label,
  iconLeft,
  className = '',
}: HudDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const selected = options.find(o => o.value === value);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="
          w-full h-[34px] px-3 rounded-[10px] 
          border border-white/10 
          bg-white/[0.06] 
          backdrop-blur-md 
          flex items-center justify-between 
          text-[14px] font-medium 
          transition-all duration-[120ms] 
          focus:outline-none focus:ring-2 focus:ring-white/20 
          hover:bg-white/[0.10] 
          active:scale-[0.98]
        "
        style={{ color: 'var(--hub-text-body)' }}
      >
        {iconLeft && <span className="text-white/60 mr-1.5">{iconLeft}</span>}
        <span className="flex-1 text-left">{label ?? selected?.label ?? 'Select'}</span>
        <svg 
          className={`w-3.5 h-3.5 text-white/60 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover list */}
      {open && (
        <div
          className="
            absolute left-0 mt-1.5
            min-w-[220px]
            rounded-[14px]
            bg-[rgba(32,37,41,0.96)]
            border border-white/6
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            py-1
            z-[999]
            animate-fade-in
          "
        >
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onPointerDown={e => {
                // Use pointerDown to beat blur / overlay taps
                e.preventDefault();
                e.stopPropagation();
                onChange(option.value);
                setOpen(false);
              }}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg
                text-sm transition
                ${option.value === value ? 'bg-white/18 text-white font-medium' : 'text-white/85 hover:bg-white/10'}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
