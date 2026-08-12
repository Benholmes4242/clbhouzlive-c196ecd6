import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COUNTRIES, findCountryByName } from '@/constants/countries';
import { MiniFlag } from '@/components/profile/handicap/whs/connect/MiniFlag';

// Get country display name from stored value (name or ISO code).
export function getCountryDisplayName(value: string | null): string {
  if (!value) return '';
  const byName = findCountryByName(value);
  if (byName) return byName.name;
  const byCode = COUNTRIES.find(c => c.code === value.toUpperCase());
  return byCode?.name || value;
}

// Get ISO code for Mapbox API.
export function getCountryCode(value: string | null): string {
  if (!value) return '';
  const byName = findCountryByName(value);
  if (byName) return byName.code;
  if (value.length === 2) return value.toUpperCase();
  return '';
}

interface CountrySelectorProps {
  value: string | null;
  onChange: (name: string) => void;
  disabled?: boolean;
  className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const displayValue = getCountryDisplayName(value);
  const selected = findCountryByName(value);

  const filtered = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    const q = searchQuery.toLowerCase();
    return COUNTRIES.filter(
      c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

  const pick = (name: string) => {
    onChange(name);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full h-11 px-3 rounded-[10px] text-left flex items-center justify-between transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[rgba(15,23,42,0.20)]',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        style={{
          background: '#F8FAFC',
          border: '1px solid rgba(15,23,42,0.08)',
        }}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <MiniFlag iso={selected.code} />
          ) : (
            <span
              style={{
                width: 32, height: 22, borderRadius: 3,
                background: 'rgba(15,23,42,0.06)', flexShrink: 0,
              }}
            />
          )}
          <span
            className="text-[15px] truncate"
            style={{ color: displayValue ? '#0F172A' : '#94A3B8' }}
          >
            {displayValue || 'Select country'}
          </span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted-foreground transition-transform flex-shrink-0', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full rounded-[12px] shadow-lg overflow-hidden"
          style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.08)' }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country..."
                className="w-full h-9 pl-8 pr-3 text-sm rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[rgba(15,23,42,0.20)]"
                style={{
                  background: '#F8FAFC',
                  border: '1px solid rgba(15,23,42,0.08)',
                }}
              />
            </div>
          </div>

          <div className="max-h-72 overflow-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => pick(c.name)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-muted transition-colors',
                    value === c.name && 'bg-muted',
                  )}
                >
                  <MiniFlag iso={c.code} />
                  <span className="flex-1 truncate text-[14px]">{c.name}</span>
                  <span className="text-[12px] text-muted-foreground tabular-nums lining-nums">{c.dialCode}</span>
                  {value === c.name && <Check className="h-4 w-4 text-[#F7931E]" />}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground text-center">No countries found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
