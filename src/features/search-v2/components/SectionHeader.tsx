import { ChevronRight } from 'lucide-react';

interface Props {
  label: string;
  onSeeAll?: () => void;
}

const AMBER = '#F7931E';

export function SectionHeader({ label, onSeeAll }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '16px 16px 12px',
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          color: AMBER,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#0F172A',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          See all
          <ChevronRight size={12} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}
