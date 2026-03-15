import { MapPin } from 'lucide-react';

interface Props {
  country: string;
  city: string;
  onCountryChange: (v: string) => void;
  onCityChange: (v: string) => void;
}

export function LocationSection({ country, city, onCountryChange, onCityChange }: Props) {
  return (
    <div className="space-y-3">
      <label className="text-[13px] font-medium text-muted-foreground block">Location</label>
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City"
          className="w-full bg-muted border-0 rounded-xl pl-9 pr-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
        />
      </div>
      <input
        type="text"
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
        placeholder="Country"
        className="w-full bg-muted border-0 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
      />
    </div>
  );
}
