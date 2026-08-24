import { forwardRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { S } from '../lib/tokens';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSubmit?: () => void;
  placeholder?: string;
}

/**
 * CANONICAL DARK FIELD TREATMENT (MICRO_BRIEF_CANONICAL_FIELD_TREATMENT),
 * applied to the overlay's own input: REST bg 6% / border 10%, FOCUS bg 10% /
 * border 28%, text 96%, placeholder 38%.
 *
 * SHAPE: rounded-sq-sm (14). The earlier pill shape — "this is a full-screen
 * overlay whose entire job is one input" — is OVERTURNED by
 * BRIEF_FIELD_SHAPE_AND_SIZE_CANON. A text input is a text input wherever it
 * sits: a member moving between Discover, auth and this overlay must meet ONE
 * control, not three variants of one. HEIGHT 44 is the canonical search-bar
 * height (a field that filters as you type, with no submit button).
 * The Cancel control and the clear button stay rounded-full — they are
 * circular controls, not fields.
 */

export const SearchField = forwardRef<HTMLInputElement, Props>(function SearchField(
  { value, onChange, onCancel, onSubmit, placeholder = 'Search clbhouz' },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="w-full md:max-w-[560px] flex items-center gap-3 px-4 pb-3"
      style={{
        paddingTop: 'max(var(--safe-top, env(safe-area-inset-top, 0px)), 8px)',
        borderBottom: `1px solid ${S.HAIRLINE}`,
      }}
    >
      <div
        className="flex-1 flex items-center gap-2 px-3 rounded-sq-sm"
        style={{
          height: 44,
          background: focused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${focused ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.10)'}`,
          transition: 'background 140ms ease, border-color 140ms ease',
        }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: S.QUIET }} />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSubmit) onSubmit();
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[rgba(255,255,255,0.38)]"
          style={{ color: 'rgba(255,255,255,0.96)' }}
          autoComplete="off"
          spellCheck="false"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] -mr-3"
            aria-label="Clear"
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.14)' }}
            >
              <X className="w-[12px] h-[12px]" style={{ color: S.INK }} strokeWidth={2.5} />
            </div>
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 text-[15px] font-bold min-h-[44px] px-1"
        style={{ color: S.INK }}
      >
        Cancel
      </button>
    </div>
  );
});
