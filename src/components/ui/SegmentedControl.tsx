import React from 'react';

export type SegmentOption<T extends string> = {
  id: T;
  label: string;
};

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  const activeIndexRaw = options.findIndex((o) => o.id === value);
  const segmentCount = options.length || 1;
  const segmentWidth = 100 / segmentCount;

  // Safety: if value not found, fall back to first segment
  const activeIndex = activeIndexRaw < 0 ? 0 : activeIndexRaw;

  // Horizontal inset inside each segment (in rem) - creates comfortable margin
  const pillInsetRem = 0.25; // 4px

  return (
    <div
      className={`
        relative mx-auto flex h-9 max-w-[360px] items-center
        rounded-full bg-slate-100/90 px-2 py-1
        shadow-[0_1px_0_rgba(0,0,0,0.04)] overflow-hidden
        ${className}
      `}
      role="tablist"
    >
      {/* Sliding active pill */}
      <div
        className="absolute top-1.5 bottom-1.5 rounded-full bg-white
                   shadow-[0_2px_7px_rgba(0,0,0,0.12)]
                   transition-transform duration-200 ease-out"
        style={{
          width: `calc(${segmentWidth}% - ${pillInsetRem * 2}rem)`,
          transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * pillInsetRem * 2}rem))`,
          left: `${pillInsetRem}rem`,
        }}
      />

      {/* Tab labels */}
      {options.map((option) => {
        const isActive = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`
              relative z-10 flex-1 flex items-center justify-center
              px-3 text-sm font-medium transition-colors duration-200
              ${isActive ? 'text-slate-900' : 'text-slate-600'}
            `}
            aria-pressed={isActive}
            role="tab"
            aria-selected={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
