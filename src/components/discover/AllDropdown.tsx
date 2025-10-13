import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { LengthKey } from '@/components/videos/VideoChipRail';

interface AllDropdownProps {
  activeDuration: LengthKey;
  onChangeDuration: (key: LengthKey) => void;
}

const DURATION_OPTIONS: { key: LengthKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'under4', label: 'Under 4 mins' },
  { key: '4to20', label: '4–20 mins' },
  { key: 'over20', label: 'Over 20 mins' },
];

const AllDropdown: React.FC<AllDropdownProps> = ({
  activeDuration,
  onChangeDuration,
}) => {
  const [open, setOpen] = React.useState(false);
  const activeOption = DURATION_OPTIONS.find(opt => opt.key === activeDuration) || DURATION_OPTIONS[0];

  const handleSelect = (key: LengthKey) => {
    onChangeDuration(key);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 h-11 px-3 rounded-full text-sm font-medium bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-200/80 transition-colors shadow-sm"
          aria-label="Filter by duration"
          aria-expanded={open}
        >
          <span>{activeOption.label}</span>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="start" 
        className="w-48 p-1 rounded-xl shadow-lg ring-1 ring-black/5 bg-white z-50"
        sideOffset={8}
      >
        <div role="menu" aria-label="Duration filters">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.key}
              role="menuitemradio"
              aria-checked={option.key === activeDuration}
              onClick={() => handleSelect(option.key)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <span className={option.key === activeDuration ? 'font-medium' : ''}>
                {option.label}
              </span>
              {option.key === activeDuration && (
                <Check className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AllDropdown;
