import { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Search, X } from 'lucide-react';
import { MAP_CONFIG } from '@/config/maps';

// ─── Country list ─────────────────────────────────────────────────────────────
// Golf-primary markets first, then alphabetical.
// Values match exactly what is stored in golf_clubs.country in the DB.
const COUNTRIES = [
  'England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland',
  'United States', 'Australia', 'Canada', 'South Africa', 'New Zealand',
  'Austria', 'Belgium', 'Czech Republic', 'Denmark', 'Finland', 'France',
  'Germany', 'Greece', 'Hungary', 'Italy', 'Netherlands', 'Norway', 'Poland',
  'Portugal', 'Romania', 'Spain', 'Sweden', 'Switzerland', 'Turkey',
  'China', 'Hong Kong', 'India', 'Indonesia', 'Japan', 'Malaysia',
  'Philippines', 'Singapore', 'South Korea', 'Taiwan', 'Thailand',
  'Argentina', 'Brazil', 'Chile', 'Colombia', 'Mexico',
  'Bahrain', 'Egypt', 'Kenya', 'Morocco', 'Nigeria', 'Qatar',
  'Saudi Arabia', 'United Arab Emirates', 'Zimbabwe',
];

// Use the shared Mapbox token from env (VITE_MAPBOX_ACCESS_TOKEN)

function getMapboxCountryCode(country: string): string {
  const map: Record<string, string> = {
    'England': 'gb', 'Scotland': 'gb', 'Wales': 'gb', 'Northern Ireland': 'gb',
    'Ireland': 'ie', 'United States': 'us', 'Australia': 'au', 'Canada': 'ca',
    'South Africa': 'za', 'New Zealand': 'nz', 'Austria': 'at', 'Belgium': 'be',
    'Czech Republic': 'cz', 'Denmark': 'dk', 'Finland': 'fi', 'France': 'fr',
    'Germany': 'de', 'Greece': 'gr', 'Hungary': 'hu', 'Italy': 'it',
    'Netherlands': 'nl', 'Norway': 'no', 'Poland': 'pl', 'Portugal': 'pt',
    'Romania': 'ro', 'Spain': 'es', 'Sweden': 'se', 'Switzerland': 'ch',
    'Turkey': 'tr', 'China': 'cn', 'Hong Kong': 'hk', 'India': 'in',
    'Indonesia': 'id', 'Japan': 'jp', 'Malaysia': 'my', 'Philippines': 'ph',
    'Singapore': 'sg', 'South Korea': 'kr', 'Taiwan': 'tw', 'Thailand': 'th',
    'Argentina': 'ar', 'Brazil': 'br', 'Chile': 'cl', 'Colombia': 'co',
    'Mexico': 'mx', 'Bahrain': 'bh', 'Egypt': 'eg', 'Kenya': 'ke',
    'Morocco': 'ma', 'Nigeria': 'ng', 'Qatar': 'qa', 'Saudi Arabia': 'sa',
    'United Arab Emirates': 'ae', 'Zimbabwe': 'zw',
  };
  return map[country] ?? '';
}

interface Props {
  country: string;
  city: string;
  onCountryChange: (v: string) => void;
  onCityChange: (v: string) => void;
}

// ─── Country Picker ───────────────────────────────────────────────────────────
function CountryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    : COUNTRIES;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch(''); }}
        className="w-full bg-[#F8FAFC] border border-border/60 rounded-[10px] px-4 py-3 text-[15px] text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
        style={{ color: value ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
      >
        <span>{value || 'Select country'}</span>
        <ChevronDown
          size={16}
          className="text-muted-foreground flex-shrink-0 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 border border-border rounded-[12px] shadow-xl overflow-hidden"
          style={{ top: 'calc(100% + 6px)', maxHeight: 280, background: '#FFFFFF' }}
        >
          <div className="p-2 border-b border-border/60">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search countries..."
                style={{ color: '#0F172A' }}
                className="w-full bg-[#F8FAFC] rounded-[8px] pl-8 pr-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[hsl(38,92%,50%)]/40"
              />
            </div>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 224 }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">No countries found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); setSearch(''); }}
                  className="w-full text-left px-4 py-2.5 text-[14px] transition-colors"
                  style={{
                    background: c === value ? 'rgba(245,159,11,0.08)' : 'transparent',
                    color: c === value ? '#92400E' : '#0F172A',
                    fontWeight: c === value ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (c !== value) (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { if (c !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {c}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── City Search ──────────────────────────────────────────────────────────────
function CitySearch({ value, onChange, country }: { value: string; onChange: (v: string) => void; country: string }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const fetchCities = (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          access_token: MAP_CONFIG.TOKEN,
          types: 'place',
          limit: '6',
          language: 'en',
        });
        const cc = getMapboxCountryCode(country);
        if (cc) params.set('country', cc);
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?${params}`
        );
        const data = await res.json();
        const cities: string[] = (data.features ?? []).map((f: any) => f.text as string);
        setResults(cities);
        setOpen(cities.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleInput = (v: string) => {
    setQuery(v);
    onChange(v);
    fetchCities(v);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={country ? `City in ${country}` : 'Select a country first'}
          disabled={!country}
          className="w-full bg-[#F8FAFC] border border-border/60 rounded-[10px] pl-9 pr-9 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        )}
        {loading && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, border: '2px solid #F7931E', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 z-50 border border-border rounded-[12px] shadow-xl overflow-hidden"
          style={{ top: 'calc(100% + 6px)', background: '#FFFFFF' }}
        >
          {results.map(city => (
            <button
              key={city}
              type="button"
              onClick={() => { setQuery(city); onChange(city); setResults([]); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-[14px] transition-colors flex items-center gap-2"
              style={{ color: '#0F172A', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <MapPin size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
              <span style={{ color: '#0F172A' }}>{city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function LocationSection({ country, city, onCountryChange, onCityChange }: Props) {
  const handleCountryChange = (v: string) => {
    onCountryChange(v);
    // Clear city when country changes to avoid stale city/country mismatch
    if (v !== country) onCityChange('');
  };

  return (
    <div className="space-y-3">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 3, height: 10, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Location
        </span>
      </div>
      {/* Country first */}
      <CountryPicker value={country} onChange={handleCountryChange} />
      {/* City second — locked until country selected, biased to that country */}
      <CitySearch value={city} onChange={onCityChange} country={country} />
    </div>
  );
}
