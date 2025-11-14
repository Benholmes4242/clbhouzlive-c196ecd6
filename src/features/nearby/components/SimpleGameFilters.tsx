/**
 * Simple Game Filters Bar
 * When / Distance / Sort filter buttons
 */

import { Calendar, MapPin, ArrowUpDown } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import clsx from 'clsx';

type SimpleGameFiltersProps = {
  whenLabel: string;
  distanceLabel: string;
  sortLabel: string;
  onWhenClick: () => void;
  onDistanceClick: () => void;
  onSortClick: () => void;
  showDistance?: boolean;
  whenActive?: boolean;
  distanceActive?: boolean;
  sortActive?: boolean;
};

export function SimpleGameFilters({
  whenLabel,
  distanceLabel,
  sortLabel,
  onWhenClick,
  onDistanceClick,
  onSortClick,
  showDistance = true,
  whenActive = false,
  distanceActive = false,
  sortActive = false,
}: SimpleGameFiltersProps) {
  const handleClick = (callback: () => void) => {
    haptic('light');
    callback();
  };

  const buttonClass = (isActive: boolean) =>
    clsx(
      'flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[13px] transition-all',
      isActive
        ? 'border-white/28 bg-white/10 text-white'
        : 'border-white/10 bg-white/4 text-white/70'
    );

  return (
    <div className="flex w-full gap-2">
      <TapButton
        className={buttonClass(whenActive)}
        onClick={() => handleClick(onWhenClick)}
      >
        <Calendar size={14} />
        <span>{whenLabel}</span>
      </TapButton>

      {showDistance && (
        <TapButton
          className={buttonClass(distanceActive)}
          onClick={() => handleClick(onDistanceClick)}
        >
          <MapPin size={14} />
          <span>{distanceLabel}</span>
        </TapButton>
      )}

      <TapButton
        className={buttonClass(sortActive)}
        onClick={() => handleClick(onSortClick)}
      >
        <ArrowUpDown size={14} />
        <span>{sortLabel}</span>
      </TapButton>
    </div>
  );
}
