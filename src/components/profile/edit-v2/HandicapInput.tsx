import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegToggle } from './SegToggle';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function HandicapInput({ value, onChange }: Props) {
  const [isPlusHandicap, setIsPlusHandicap] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Initialise toggle and input from external value
  useEffect(() => {
    if (value.startsWith('+')) {
      setIsPlusHandicap(true);
      setInputValue(value.slice(1));
    } else {
      setIsPlusHandicap(false);
      setInputValue(value);
    }
  }, []); // only on mount; canonical form string never has leading `-`

  const handleToggle = (plus: boolean) => {
    setIsPlusHandicap(plus);
    if (inputValue) {
      onChange(plus ? `+${inputValue}` : inputValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setInputValue(raw);
    onChange(isPlusHandicap ? (raw ? `+${raw}` : '') : raw);
  };

  const displayPreview = (() => {
    if (!inputValue) return null;
    const num = parseFloat(inputValue);
    if (isNaN(num)) return null;
    return isPlusHandicap ? `+${num.toFixed(1)}` : num.toFixed(1);
  })();

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <SectionHeader tier="standard" kicker="Handicap Index" />
      </div>

      {/* Standard / Plus toggle */}
      <div className="mb-3">
        <SegToggle
          fill
          value={isPlusHandicap ? 'plus' : 'standard'}
          onChange={(v) => handleToggle(v === 'plus')}
          options={[
            { value: 'standard', label: 'Standard', hint: '0–54' },
            { value: 'plus', label: 'Plus', hint: '+0.1–+10' },
          ]}
        />
      </div>

      {/* Value input */}
      <div className="relative">
        {isPlusHandicap && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">+</span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          placeholder={isPlusHandicap ? '1.2' : 'e.g. 8.4'}
          className={cn(
            'w-full bg-[#F8FAFC] border border-border/60 rounded-[11px] py-3 text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors',
            isPlusHandicap ? 'pl-9 pr-4' : 'px-4'
          )}
        />
      </div>

      {displayPreview && (
        <p className="text-xs text-muted-foreground mt-1.5">
          Will display as: <span className="font-semibold text-foreground">{displayPreview}</span>
        </p>
      )}
      <p className="text-[11px] text-muted-foreground/70 mt-1">
        Your World Handicap System index
      </p>
    </div>
  );
}
