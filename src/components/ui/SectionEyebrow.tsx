import { memo } from 'react';

interface SectionEyebrowProps {
  /** The caps label text (e.g. "DISPLAY NAME", "ALL FOLLOWERS"). */
  label: string;
  /** Optional inline count rendered alongside the label. */
  count?: number;
  /** Override the default slate-500 colour. Defaults to slate.
   *  - 'slate' (default): canonical neutral eyebrow.
   *  - 'amber': editorial brand moment (amber-on-amber-tint chrome).
   *  - 'danger': destructive-section eyebrow (#DC2626).
   */
  color?: 'slate' | 'amber' | 'danger';
  /** Optional className for layout wrapper customisation. */
  className?: string;
  /** Render a small amber asterisk after the label to indicate required. */
  required?: boolean;
}

const COLOR_MAP: Record<'slate' | 'amber' | 'danger', string> = {
  slate: '#64748B',
  amber: '#F7931E',
  danger: '#DC2626',
};

/**
 * Canonical eyebrow primitive. 9/800/slate-500/0.16em.
 * Optional count: 9/800/slate-400, no positive letter-spacing, tabular-nums.
 */
function SectionEyebrowInner({ label, count, color = 'slate', className, required }: SectionEyebrowProps) {
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
        {required && (
          <span
            aria-hidden="true"
            style={{ color: '#F7931E', marginLeft: 3, letterSpacing: 0 }}
          >
            *
          </span>
        )}
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
