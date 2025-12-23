import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthPrimaryButton } from '@/components/auth-v2';
import type { OnboardingData } from '@/pages/OnboardingV2';

interface OnboardingCountryProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  saveProgress: (updates: Partial<OnboardingData>) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

// Popular golf countries (shown at top)
const POPULAR_COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
];

// Full country list
const ALL_COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
];

/**
 * B2 - Country Step
 * Search + select country with popular options at top
 */
const OnboardingCountry: React.FC<OnboardingCountryProps> = ({
  data,
  updateData,
  saveProgress,
  onNext,
}) => {
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return ALL_COUNTRIES;
    const term = search.toLowerCase();
    return ALL_COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term)
    );
  }, [search]);

  const handleSelect = (country: typeof ALL_COUNTRIES[0]) => {
    updateData({ countryCode: country.code, countryName: country.name });
  };

  const handleNext = async () => {
    await saveProgress({ countryCode: data.countryCode, countryName: data.countryName });
    onNext();
  };

  const canContinue = !!data.countryCode;

  return (
    <div className="flex-1 flex flex-col px-6 pt-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Select your country
        </h1>
        <p className="text-white/50">
          This helps us show you relevant courses and golfers.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Search countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
        />
      </div>

      {/* Country List */}
      <div className="flex-1 overflow-y-auto -mx-6 px-6">
        {/* Popular (only when not searching) */}
        {!search.trim() && (
          <div className="mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Most popular</p>
            <div className="space-y-1">
              {POPULAR_COUNTRIES.map((country) => (
                <CountryRow
                  key={country.code}
                  country={country}
                  isSelected={data.countryCode === country.code}
                  onSelect={() => handleSelect(country)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All / Filtered */}
        <div>
          {!search.trim() && (
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">All countries</p>
          )}
          
          {filteredCountries.length > 0 ? (
            <div className="space-y-1">
              {filteredCountries.map((country) => (
                <CountryRow
                  key={country.code}
                  country={country}
                  isSelected={data.countryCode === country.code}
                  onSelect={() => handleSelect(country)}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-white/50">No matches — try a different spelling.</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="py-6">
        <AuthPrimaryButton onClick={handleNext} disabled={!canContinue}>
          Next
        </AuthPrimaryButton>
      </div>
    </div>
  );
};

const CountryRow: React.FC<{
  country: { code: string; name: string; flag: string };
  isSelected: boolean;
  onSelect: () => void;
}> = ({ country, isSelected, onSelect }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onSelect}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      isSelected ? 'bg-white/10' : 'hover:bg-white/5'
    }`}
  >
    <span className="text-2xl">{country.flag}</span>
    <span className="flex-1 text-left text-white">{country.name}</span>
    {isSelected && <Check className="w-5 h-5 text-green-400" />}
  </motion.button>
);

export default OnboardingCountry;
