/**
 * Game Filter Bottom Sheet
 * Generic bottom sheet for filter options
 */

import { BottomSheet } from '@/components/ui/BottomSheet';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';

type FilterOption = {
  label: string;
  value: string;
};

type GameFilterBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  options: FilterOption[];
  onSelect: (value: string) => void;
  selectedValue?: string;
};

export function GameFilterBottomSheet({
  open,
  onClose,
  title,
  options,
  onSelect,
  selectedValue,
}: GameFilterBottomSheetProps) {
  const handleSelect = (value: string) => {
    haptic('medium');
    onSelect(value);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} zIndexBase={10000}>
      <div className="p-6 pb-8">
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-white/16" />
        </div>

        {/* Title */}
        <h2 className="text-[20px] font-semibold text-white mb-4 text-center">
          {title}
        </h2>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <TapButton
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`
                w-full rounded-2xl py-3 text-[15px] font-medium transition-all
                ${selectedValue === option.value
                  ? 'bg-white/12 text-white border border-white/20'
                  : 'bg-white/6 text-white/80 border border-transparent'
                }
              `}
            >
              {option.label}
            </TapButton>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
