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
        "shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold will-change-transform transition-transform",
        bump ? "pill-bump" : "",
        className || ""
      ].join(" ")}
      style={{
        background: isFull ? 'rgba(247, 158, 27, 0.15)' : 'rgba(16, 185, 129, 0.15)',
        border: isFull ? '1px solid rgba(247, 158, 27, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
        color: isFull ? '#F79E1B' : '#10B981',
      }}
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
