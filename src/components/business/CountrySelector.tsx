import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Country data with UI labels, ISO codes, and groupings
const COUNTRY_GROUPS = [
  {
    label: "Great Britain & Ireland",
    countries: [
      { name: "England", code: "GB" },
      { name: "Scotland", code: "GB" },
      { name: "Wales", code: "GB" },
      { name: "Northern Ireland", code: "GB" },
      { name: "Ireland", code: "IE" },
    ]
  },
  {
    label: "Rest of World",
    countries: [
      { name: "United States", code: "US" },
      { name: "Canada", code: "CA" },
      { name: "United Arab Emirates", code: "AE" },
      { name: "Saudi Arabia", code: "SA" },
      { name: "South Africa", code: "ZA" },
      { name: "Australia", code: "AU" },
      { name: "New Zealand", code: "NZ" },
    ]
  },
  {
    label: "Europe",
    countries: [
      { name: "Albania", code: "AL" },
      { name: "Andorra", code: "AD" },
      { name: "Austria", code: "AT" },
      { name: "Belarus", code: "BY" },
      { name: "Belgium", code: "BE" },
      { name: "Bosnia and Herzegovina", code: "BA" },
      { name: "Bulgaria", code: "BG" },
      { name: "Croatia", code: "HR" },
      { name: "Cyprus", code: "CY" },
      { name: "Czech Republic", code: "CZ" },
      { name: "Denmark", code: "DK" },
      { name: "Estonia", code: "EE" },
      { name: "Finland", code: "FI" },
      { name: "France", code: "FR" },
      { name: "Germany", code: "DE" },
      { name: "Greece", code: "GR" },
      { name: "Hungary", code: "HU" },
      { name: "Iceland", code: "IS" },
      { name: "Italy", code: "IT" },
      { name: "Kosovo", code: "XK" },
      { name: "Latvia", code: "LV" },
      { name: "Liechtenstein", code: "LI" },
      { name: "Lithuania", code: "LT" },
      { name: "Luxembourg", code: "LU" },
      { name: "Malta", code: "MT" },
      { name: "Moldova", code: "MD" },
      { name: "Monaco", code: "MC" },
      { name: "Montenegro", code: "ME" },
      { name: "Netherlands", code: "NL" },
      { name: "North Macedonia", code: "MK" },
      { name: "Norway", code: "NO" },
      { name: "Poland", code: "PL" },
      { name: "Portugal", code: "PT" },
      { name: "Romania", code: "RO" },
      { name: "San Marino", code: "SM" },
      { name: "Serbia", code: "RS" },
      { name: "Slovakia", code: "SK" },
      { name: "Slovenia", code: "SI" },
      { name: "Spain", code: "ES" },
      { name: "Sweden", code: "SE" },
      { name: "Switzerland", code: "CH" },
      { name: "Turkey", code: "TR" },
      { name: "Ukraine", code: "UA" },
      { name: "Vatican City", code: "VA" },
    ]
  }
];

// Flat list for lookup
const ALL_COUNTRIES = COUNTRY_GROUPS.flatMap(g => g.countries);

// Get country name from stored value (handles both name and code)
export function getCountryDisplayName(value: string | null): string {
  if (!value) return '';
  // First try to find by name (for GB&I split)
  const byName = ALL_COUNTRIES.find(c => c.name === value);
  if (byName) return byName.name;
  
  // Then try by code (legacy support)
  const byCode = ALL_COUNTRIES.find(c => c.code === value);
  if (byCode) return byCode.name;
  
  return value;
}

// Get ISO code for Mapbox API
export function getCountryCode(value: string | null): string {
  if (!value) return '';
  // First try to find by name (for GB&I split)
  const byName = ALL_COUNTRIES.find(c => c.name === value);
  if (byName) return byName.code;
  
  // Then try by code
  const byCode = ALL_COUNTRIES.find(c => c.code === value);
  if (byCode) return byCode.code;
  
  // Return as-is if it looks like an ISO code
  if (value.length === 2) return value.toUpperCase();
  
  return '';
}

interface CountrySelectorProps {
  value: string | null;
  onChange: (name: string) => void; // Returns country name (e.g., "England")
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

  // Get selected country display name
  const displayValue = getCountryDisplayName(value);

  // Filter countries based on search
  const filteredGroups = searchQuery
    ? COUNTRY_GROUPS.map(group => ({
        ...group,
        countries: group.countries.filter(c =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(g => g.countries.length > 0)
    : COUNTRY_GROUPS;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (countryName: string) => {
    onChange(countryName);
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
          "w-full h-10 px-3 rounded-sq-sm border bg-background text-left flex items-center justify-between transition-colors",
          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn(
          "text-sm",
          !displayValue && "text-muted-foreground"
        )}>
          {displayValue || 'Select country'}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-sq-md border bg-background shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country…"
                className="w-full h-8 pl-8 pr-3 text-sm rounded-sq-xs border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Grouped country list */}
          <div className="max-h-60 overflow-auto py-1">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                    {group.label}
                  </div>
                  {group.countries.map((country) => (
                    <button
                      key={`${country.name}-${country.code}`}
                      type="button"
                      onClick={() => handleSelect(country.name)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-muted transition-colors",
                        value === country.name && "bg-muted"
                      )}
                    >
                      <span>{country.name}</span>
                      {value === country.name && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground text-center">
                No countries found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
