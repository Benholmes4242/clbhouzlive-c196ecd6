import { memo, type ReactNode } from 'react';
import { Kicker } from './Kicker';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  kicker?: string;
  kickerColor?: 'amber' | 'emerald' | 'slate';
  title: string;
  sub?: string;
  action?: { label: string; onClick: () => void };
  paddingTop?: number;
  paddingBottom?: number;
  /** Optional left-aligned section mark (icon/glyph), e.g. ClipsMark, VideosMark. */
  mark?: ReactNode;
}

/**
 * Pro Shop primitive — quiet single-line section header (Option A).
 * Content leads, header recedes. No kicker, mark, or subhead by default.
 * Used at the top of every rail in the Watch tab.
 */
function SectionHeaderInner({
  // kicker suppressed — quiet-label pass (Option A). Props retained so callers don't break.
  // kicker,
  // kickerColor = 'slate',
  title,
  // sub suppressed — quiet-label pass.
  // sub,
  action,
  paddingTop = 18,
  paddingBottom = 9,
  // mark suppressed — quiet-label pass. Props retained so callers don't break.
  // mark,
}: SectionHeaderProps) {
  const textColumn = (
    <div style={{ minWidth: 0, flex: 1 }}>
      {/* Kicker intentionally suppressed for quiet-label layout */}
      <h2
        style={{
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: '#0F172A',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {/* Subhead intentionally suppressed for quiet-label layout */}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: `${paddingTop}px 16px 9px`,
      }}
    >
      {/* Mark icon intentionally suppressed for quiet-label layout */}
      {textColumn}

      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="active:scale-[0.97] transition-transform"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '-0.005em',
            color: '#64748B',
            background: 'transparent',
            border: 'none',
            minHeight: 44,
            padding: '12px 0 12px 16px',
            margin: '-10px -12px -12px 0',
            flexShrink: 0,
          }}
        >
          {action.label}
          <ChevronRight size={12} strokeWidth={2.4} />
        </button>
      ) : null}
    </div>
  );
}

export const SectionHeader = memo(SectionHeaderInner);
