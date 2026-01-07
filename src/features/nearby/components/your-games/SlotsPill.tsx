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

  return (
    <span
      className={[
        "shrink-0 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[12px] text-white/85 will-change-transform transition-transform",
        bump ? "pill-bump" : "",
        className || ""
      ].join(" ")}
      aria-label={`${filled} of ${slotsTotal} spots filled`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={bump ? "count-flip" : ""}>
        {filled}/{slotsTotal} filled
      </span>
    </span>
  );
};
