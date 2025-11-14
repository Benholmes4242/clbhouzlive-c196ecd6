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
          inline-flex items-center gap-1.5
          px-3.5 py-2
          rounded-full
          bg-white/4
          border border-white/8
          text-sm text-white/80
          backdrop-blur-md
          active:bg-white/8
        "
      >
        {iconLeft && <span className="text-white/60">{iconLeft}</span>}
        <span>{label ?? selected?.label ?? 'Select'}</span>
        <span className="ml-0.5 text-xs text-white/50">⌄</span>
      </button>

      {/* Popover list */}
      {open && (
        <div
          className="
            absolute left-0 mt-1.5 w-56
            rounded-2xl
            bg-black/88
            text-sm text-white/90
            shadow-[0_18px_40px_rgba(0,0,0,0.55)]
            overflow-hidden
            z-50
            backdrop-blur-xl
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
                w-full text-left px-3.5 py-2.5
                ${option.value === value ? 'bg-white/10 font-medium' : 'bg-transparent hover:bg-white/5'}
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
