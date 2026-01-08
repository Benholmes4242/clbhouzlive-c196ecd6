/**
 * PlayersFromFilter - Country-based player filter
 * Allows filtering leaderboard by player's home country
 */

import React, { useState } from 'react';
import { Globe, MapPin, ChevronDown, Search, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// Country Bottom Sheet Component (iOS-style)
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
  // Handle outside interaction explicitly to prevent freeze
  const handleClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Drawer 
      open={open} 
      onOpenChange={onOpenChange}
      dismissible
      modal
    >
      <DrawerContent 
        className="max-h-[85vh]"
        onPointerDownOutside={handleClose}
        onInteractOutside={handleClose}
        onEscapeKeyDown={handleClose}
      >
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

  const getDisplayLabel = () => {
    if (value === 'worldwide') return 'Worldwide';
    if (value === 'my-country') return userCountry ? getCountryName(userCountry) : 'My Country';
    return getCountryName(value);
  };

  const filteredCountries = ALL_COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (code: string) => {
    onChange(code);
    setCountrySearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 px-0.5">
          Golfers based in
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'bg-muted/40 hover:bg-muted/60 transition-colors',
                'text-xs font-medium text-muted-foreground hover:text-foreground',
                'border border-border/40',
                className
              )}
            >
              {value === 'worldwide' ? (
                <Globe className="w-3.5 h-3.5" />
              ) : (
                <MapPin className="w-3.5 h-3.5" />
              )}
              <span className="font-semibold text-foreground">{getDisplayLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Filter golfers by home club country
            </div>
            <DropdownMenuItem
              onClick={() => onChange('worldwide')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>Worldwide</span>
              {value === 'worldwide' && (
                <Check className="w-4 h-4 text-primary ml-auto" />
              )}
            </DropdownMenuItem>

          {userCountry && (
            <DropdownMenuItem
              onClick={() => onChange('my-country')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>My Country ({getCountryName(userCountry)})</span>
              {value === 'my-country' && (
                <Check className="w-4 h-4 text-primary ml-auto" />
              )}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setCountrySearchOpen(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <span>Choose Country...</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
