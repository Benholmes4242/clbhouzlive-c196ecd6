import { FIELD_INPUT_CLASS, FIELD_INPUT_STYLE } from '@/components/manage/fieldTreatment';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS as FIELD_PLACEHOLDER_CLASS_CANON } from '@/lib/tokens/field';
import { cn } from '@/lib/utils';
import { COUNTRIES } from '@/constants/countries';
import { MiniFlag } from '@/components/profile/handicap/whs/connect/MiniFlag';

export interface PhoneValue {
  dialCode: string;
  localNumber: string;
  fullNumber: string;
}

interface Props {
  value?: PhoneValue | null;
  onChange: (value: PhoneValue | null) => void;
  className?: string;
  disabled?: boolean;
  defaultCountryIso?: string | null;
}

const sanitizePhoneNumber = (v: string) => v.replace(/[^\d\s\-]/g, '');
const stripToDigits = (v: string) => v.replace(/\D/g, '');

export const PhoneInputWithDialCode: React.FC<Props> = ({
  value,
  onChange,
  className,
  disabled = false,
  defaultCountryIso,
}) => {
  const dialCode = value?.dialCode || '';
  const localNumber = value?.localNumber || '';

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Match by dial code + take first country (US/CA share +1, etc.)
  const selected = useMemo(
    () => COUNTRIES.find(c => c.dialCode === dialCode),
    [dialCode],
  );

  const filtered = useMemo(() => {
    if (!query) return COUNTRIES;
    const q = query.toLowerCase();
    return COUNTRIES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!defaultCountryIso) return;
    if (dialCode) return;
    if (localNumber) return;
    const found = COUNTRIES.find(c => c.code === defaultCountryIso);
    if (!found) return;
    onChange({ dialCode: found.dialCode, localNumber: '', fullNumber: '' });
  }, [defaultCountryIso]);

  const setDial = (newDialCode: string) => {
    const stripped = stripToDigits(localNumber);
    onChange({
      dialCode: newDialCode,
      localNumber: stripped,
      fullNumber: stripped ? `${newDialCode}${stripped}` : '',
    });
    setOpen(false);
    setQuery('');
  };

  const setLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePhoneNumber(e.target.value);
    const stripped = stripToDigits(sanitized);
    onChange({
      dialCode,
      localNumber: sanitized,
      fullNumber: stripped && dialCode ? `${dialCode}${stripped}` : '',
    });
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <div ref={wrapRef} className="relative shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={`${FIELD_INPUT_CLASS} h-11 pl-2.5 pr-2 rounded-[10px] flex items-center gap-1.5`}
          // GEOMETRY: radius 10 for the dial-code control paired with the number.
          style={{ ...FIELD_INPUT_STYLE, padding: 0, paddingLeft: 10, paddingRight: 8, borderRadius: 10, minWidth: 96 }}
        >
          {selected ? (
            <MiniFlag iso={selected.code} />
          ) : (
            <span
              style={{
                width: 32, height: 22, borderRadius: 3,
                background: 'rgba(255,255,255,0.10)', flexShrink: 0,
              }}
            />
          )}
          <span
            className="text-[13px] tabular-nums whitespace-nowrap"
            style={{ color: dialCode ? A.INK : A.MUTE }}
          >
            {dialCode || '+--'}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform ml-0.5', open && 'rotate-180')} />
        </button>

        {open && (
          <div
            className="absolute z-50 mt-1 rounded-[12px] shadow-lg overflow-hidden"
            /* A floating panel is not a field: A.PANEL with an A.BORDER
               hairline, never the field fill. */
            style={{
              background: A.PANEL,
              border: `1px solid ${A.BORDER}`,
              width: 300,
              maxWidth: '80vw',
            }}
          >
            <div className="p-2 border-b" style={{ borderColor: A.BORDER }}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country or code..."
                  /* FIELD CANON (lib/tokens/field.ts). HEIGHT EXCEPTION (36px,
                     h-9): floating dial-code panel above a scrolling list. */
                  className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS_CANON} w-full h-9 pl-8 pr-3 text-sm`}
                  // Bare input inside a painted wrapper: paint and radius nulled.
                  style={{ ...FIELD_INPUT_STYLE, background: undefined, borderRadius: undefined, padding: 0, paddingLeft: 32, paddingRight: 12, fontSize: 14 }}
                />
              </div>
            </div>
            <div className="max-h-72 overflow-auto py-1">
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDial(c.dialCode)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-muted transition-colors',
                      dialCode === c.dialCode && 'bg-muted',
                    )}
                  >
                    <MiniFlag iso={c.code} />
                    <span className="flex-1 truncate text-[14px]">{c.name}</span>
                    <span className="text-[12px] text-muted-foreground tabular-nums lining-nums">{c.dialCode}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-muted-foreground text-center">No results</p>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        type="tel"
        value={localNumber}
        onChange={setLocal}
        placeholder="Phone number"
        disabled={disabled}
        /* FIELD CANON (lib/tokens/field.ts). Height 44 (h-11), radius 14. */
        className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS_CANON} flex-1 min-w-0 h-11 px-3.5 text-[15px]`}
        // Bare input inside a painted wrapper: paint and radius nulled.
        style={{ ...FIELD_INPUT_STYLE, background: undefined, borderRadius: undefined, padding: 0, paddingLeft: 14, paddingRight: 14, fontSize: 15 }}
      />
    </div>
  );
};

export default PhoneInputWithDialCode;
