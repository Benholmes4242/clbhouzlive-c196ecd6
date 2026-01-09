import React from 'react';
import { useBumpOnChange } from '@/hooks/useBumpOnChange';

type Props = {
  slotsOpen: number;
  slotsTotal: number;
  className?: string;
};

export const SlotsPill: React.FC<Props> = ({ slotsOpen, slotsTotal, className }) => {
  const bump = useBumpOnChange(`${slotsOpen}/${slotsTotal}`, 450);
  const filled = Math.max(0, slotsTotal - slotsOpen);
  const isFull = slotsOpen === 0;

  return (
    <span
      className={[
        "shrink-0 px-3 py-1 rounded-full border text-[12px] text-white will-change-transform transition-transform",
        isFull 
          ? "bg-orange-500/20 border-orange-400/30" 
          : "bg-green-500/20 border-green-400/30",
        bump ? "pill-bump" : "",
        className || ""
      ].join(" ")}
      aria-label={`${filled} of ${slotsTotal} spots filled`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={bump ? "count-flip" : ""}>
        {filled}/{slotsTotal}
      </span>
    </span>
  );
};
