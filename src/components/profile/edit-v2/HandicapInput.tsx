interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function HandicapInput({ value, onChange }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.+]/g, '');
    onChange(raw);
  };

  return (
    <div>
      <label className="text-[13px] font-medium text-muted-foreground mb-1.5 block">
        Handicap Index
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="e.g. 8.4 or +1.2"
          className="w-full bg-muted border-0 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
        />
        {value && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
            HCP
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        Your World Handicap System index
      </p>
    </div>
  );
}
