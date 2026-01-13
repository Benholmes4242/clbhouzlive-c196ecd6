/**
 * PlayersFromFilter - Country-based player filter dropdown
 * Matches CourseExplorer region/sub-region dropdown style
 */

import React, { useState } from 'react';
import { Globe, MapPin, Search, Check, X, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle 
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type PlayersFromValue = 'worldwide' | 'my-country' | string; // string = specific country code

interface PlayersFromFilterProps {
  value: PlayersFromValue;
  onChange: (value: PlayersFromValue) => void;
  userCountry?: string | null;
  className?: string;
}

// Common countries (can be expanded)
const POPULAR_COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'IE', name: 'Ireland' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'DK', name: 'Denmark' },
];

// All countries for search
const ALL_COUNTRIES = [
  ...POPULAR_COUNTRIES,
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'EG', name: 'Egypt' },
  { code: 'FI', name: 'Finland' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IL', name: 'Israel' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NO', name: 'Norway' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'VN', name: 'Vietnam' },
].sort((a, b) => a.name.localeCompare(b.name));

function getCountryName(code: string): string {
  const country = ALL_COUNTRIES.find(c => c.code === code);
  return country?.name || code;
}

function getDisplayLabel(value: PlayersFromValue, userCountry?: string | null): string {
  if (value === 'worldwide') return 'Worldwide';
  if (value === 'my-country' && userCountry) {
    return getCountryName(userCountry);
  }
  return getCountryName(value);
}

// Country Bottom Sheet Component (iOS-style) for search
interface CountryBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  countries: typeof ALL_COUNTRIES;
  selectedCode: string;
  onSelect: (code: string) => void;
}

function CountryBottomSheet({
  open,
  onOpenChange,
  searchQuery,
  onSearchChange,
  countries,
  selectedCode,
  onSelect,
}: CountryBottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center">Select Country</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[50vh] px-2">
          <div className="px-2 pb-6 space-y-0.5">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => onSelect(country.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                  'hover:bg-muted/60 transition-colors active:scale-[0.98]',
                  selectedCode === country.code && 'bg-muted'
                )}
              >
                <span className="text-sm font-medium">{country.name}</span>
                {selectedCode === country.code && (
                  <Check className="w-4 h-4 text-primary ml-auto" />
                )}
              </button>
            ))}
            {countries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No countries found
              </p>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}

export function PlayersFromFilter({
  value,
  onChange,
  userCountry,
  className,
}: PlayersFromFilterProps) {
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = ALL_COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (code: string) => {
    onChange(code);
    setCountrySearchOpen(false);
    setSearchQuery('');
  };

  const isActive = value !== 'worldwide';

  return (
    <>
      <Select 
        value={value} 
        onValueChange={(v) => {
          if (v === 'search') {
            setCountrySearchOpen(true);
          } else {
            onChange(v as PlayersFromValue);
          }
        }}
      >
        <SelectTrigger 
          className={cn(
            'h-11 w-full rounded-sq-sm bg-white justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/60 focus-visible:border-slate-300 data-[state=open]:ring-0 transition-all duration-150',
            isActive
              ? 'border-primary/40 ring-1 ring-primary/20 text-foreground'
              : 'border-slate-200',
            className
          )}
          aria-label="Select golfer location"
        >
          <div className="flex items-center">
            <Globe className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <SelectValue placeholder="Worldwide">
              {getDisplayLabel(value, userCountry)}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white border-slate-200 z-50 rounded-sq-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
          <SelectItem value="worldwide">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Worldwide
            </div>
          </SelectItem>
          {userCountry && (
            <SelectItem value="my-country">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {getCountryName(userCountry)}
              </div>
            </SelectItem>
          )}
          {POPULAR_COUNTRIES.slice(0, 10).map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
          <SelectItem value="search">
            <div className="flex items-center gap-2 text-slate-500">
              <Search className="w-4 h-4" />
              Search all countries...
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Country Search Bottom Sheet */}
      <CountryBottomSheet
        open={countrySearchOpen}
        onOpenChange={setCountrySearchOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        countries={filteredCountries}
        selectedCode={value}
        onSelect={handleCountrySelect}
      />
    </>
  );
}

export { getCountryName, ALL_COUNTRIES };
