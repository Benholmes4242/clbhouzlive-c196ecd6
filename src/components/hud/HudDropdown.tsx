import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find(o => o.value === value);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen(v => !v);
  };

  const handleClose = () => setOpen(false);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger pill */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
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
        aria-haspopup="listbox"
        aria-expanded={open}
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

      {/* Portal menu with scrim */}
      {open && anchorRect && createPortal(
        <>
          {/* Scrim */}
          <div
            onClick={handleClose}
            className="fixed inset-0 z-[998] bg-black/20"
          />
          {/* Menu */}
          <div
            role="listbox"
            aria-label="Filter options"
            aria-modal="true"
            className="fixed z-[999] rounded-[14px] bg-[rgba(32,37,41,0.96)] border border-white/6 shadow-[0_10px_30px_rgba(0,0,0,0.35)] py-1 animate-fade-in"
            style={{
              left: anchorRect.left,
              top: anchorRect.bottom + 6,
              minWidth: Math.max(220, anchorRect.width),
            }}
          >
            {options.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    handleClose();
                  }}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg
                    text-sm transition
                    ${isSelected ? 'bg-white/18 text-white font-medium' : 'text-white/85 hover:bg-white/10'}
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
