import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export const SearchField = forwardRef<HTMLInputElement, Props>(function SearchField(
  { value, onChange, onCancel, onSubmit, placeholder = 'Search clbhouz' },
  ref,
) {
  return (
    <div
      className="w-full md:max-w-[560px] flex items-center gap-3 px-4 pb-3"
      style={{
        paddingTop: 'max(var(--safe-top, env(safe-area-inset-top, 0px)), 8px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="flex-1 flex items-center gap-2 px-3 rounded-full"
        style={{
          height: 44,
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: '#94A3B8' }} />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSubmit) onSubmit();
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
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
              style={{ width: 24, height: 24, background: 'rgba(0,0,0,0.08)' }}
            >
              <X className="w-[12px] h-[12px]" style={{ color: '#64748b' }} strokeWidth={2.5} />
            </div>
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 text-[14px] font-bold min-h-[44px] px-1"
        style={{ color: '#0F172A' }}
      >
        Cancel
      </button>
    </div>
  );
});
