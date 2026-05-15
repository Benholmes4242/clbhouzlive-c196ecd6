import { memo } from 'react';

interface SectionEyebrowProps {
  /** The caps label text (e.g. "DISPLAY NAME", "ALL FOLLOWERS"). */
  label: string;
  /** Optional inline count rendered alongside the label. */
  count?: number;
  /** Override the default slate-500 colour. Defaults to slate. */
  color?: 'slate' | 'amber';
  /** Optional className for layout wrapper customisation. */
  className?: string;
}

const COLOR_MAP: Record<'slate' | 'amber', string> = {
  slate: '#64748B',
  amber: '#F7931E',
};

/**
 * Canonical eyebrow primitive. 9/800/slate-500/0.16em.
 * Optional count: 9/800/slate-400, no positive letter-spacing, tabular-nums.
 */
function SectionEyebrowInner({ label, count, color = 'slate', className }: SectionEyebrowProps) {
  const labelColor = COLOR_MAP[color];
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: labelColor,
          fontFeatureSettings: '"kern" 1, "liga" 1',
        }}
      >
        {label}
      </span>
      {count != null && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#94A3B8',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export const SectionEyebrow = memo(SectionEyebrowInner);
export default SectionEyebrow;
