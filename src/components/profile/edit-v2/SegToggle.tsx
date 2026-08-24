import { Check } from 'lucide-react';

const SF_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export interface SegOption {
  value: string;
  label: string;
  hint?: string;
}

interface SegToggleProps {
  options: SegOption[];
  value: string;
  onChange: (v: string) => void;
  /** true = flex-1 equal widths (handicap), false/undefined = hug content (gender) */
  fill?: boolean;
}

export function SegToggle({ options, value, onChange, fill }: SegToggleProps) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="transition-all active:scale-[0.98]"
            style={{
              flex: fill ? 1 : '0 0 auto',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 11,
              cursor: 'pointer',
              fontFamily: SF_STACK,
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              /* DARK INVERSION: selected = light chip, unselected = quiet well.
                 Same inversion FilterChips took. Check glyph inherits colour.
                 borderRadius 11 is chip-row geometry — NOT the 14px field canon. */
              color: active ? '#15171F' : 'rgba(248,250,252,0.62)',
              background: active ? '#F8FAFC' : 'rgba(255,255,255,0.06)',
              border: active
                ? 'none'
                : '1px solid rgba(255,255,255,0.10)',
            }}
          >
            {active && <Check size={13} strokeWidth={3} />}
            <span>{o.label}</span>
            {o.hint && (
              <span style={{ fontFamily: SF_STACK, fontWeight: 500, color: active ? 'rgba(21,23,31,0.55)' : 'rgba(248,250,252,0.42)', fontSize: 12 }}>
                {o.hint}
              </span>
            )}

          </button>
        );
      })}
    </div>
  );
}
