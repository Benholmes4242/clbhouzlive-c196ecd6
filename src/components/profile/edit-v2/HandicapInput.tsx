import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    } else if (value.startsWith('-')) {
      setIsPlusHandicap(true);
      setInputValue(value.slice(1));
    } else {
      setIsPlusHandicap(false);
      setInputValue(value);
    }
  }, []); // only on mount

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
      <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2 block">
        Handicap Index
      </label>

      {/* Standard / Plus toggle */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => handleToggle(false)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all min-h-[44px] active:scale-[0.98]',
            !isPlusHandicap
              ? 'border-amber-500 bg-amber-500/5 text-foreground'
              : 'border-border text-muted-foreground'
          )}
        >
          <span className="text-sm font-semibold">Standard</span>
          <span className="text-[10px] opacity-60">(0 – 54)</span>
        </button>
        <button
          type="button"
          onClick={() => handleToggle(true)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all min-h-[44px] active:scale-[0.98]',
            isPlusHandicap
              ? 'border-amber-500 bg-amber-500/5 text-foreground'
              : 'border-border text-muted-foreground'
          )}
        >
          <Plus size={14} />
          <span className="text-sm font-semibold">Plus</span>
          <span className="text-[10px] opacity-60">(+0.1 – +10)</span>
        </button>
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
            'w-full bg-[#F8FAFC] border border-border/60 rounded-[10px] py-3 text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors',
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
