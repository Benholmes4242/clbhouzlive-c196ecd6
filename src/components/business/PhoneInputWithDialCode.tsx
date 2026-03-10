import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface PhoneValue {
  dialCode: string;
  localNumber: string;
  fullNumber: string;
}

interface PhoneInputWithDialCodeProps {
  value?: PhoneValue | null;
  onChange: (value: PhoneValue | null) => void;
  className?: string;
  disabled?: boolean;
}

// Common country dial codes
const COUNTRY_DIAL_CODES = [
  { code: '+44', label: 'United Kingdom (+44)', flag: '🇬🇧' },
  { code: '+1', label: 'United States / Canada (+1)', flag: '🇺🇸' },
  { code: '+353', label: 'Ireland (+353)', flag: '🇮🇪' },
  { code: '+61', label: 'Australia (+61)', flag: '🇦🇺' },
  { code: '+64', label: 'New Zealand (+64)', flag: '🇳🇿' },
  { code: '+27', label: 'South Africa (+27)', flag: '🇿🇦' },
  { code: '+971', label: 'United Arab Emirates (+971)', flag: '🇦🇪' },
  { code: '+966', label: 'Saudi Arabia (+966)', flag: '🇸🇦' },
  { code: '+974', label: 'Qatar (+974)', flag: '🇶🇦' },
  { code: '+65', label: 'Singapore (+65)', flag: '🇸🇬' },
  { code: '+852', label: 'Hong Kong (+852)', flag: '🇭🇰' },
  { code: '+81', label: 'Japan (+81)', flag: '🇯🇵' },
  { code: '+82', label: 'South Korea (+82)', flag: '🇰🇷' },
  { code: '+86', label: 'China (+86)', flag: '🇨🇳' },
  { code: '+91', label: 'India (+91)', flag: '🇮🇳' },
  { code: '+33', label: 'France (+33)', flag: '🇫🇷' },
  { code: '+49', label: 'Germany (+49)', flag: '🇩🇪' },
  { code: '+39', label: 'Italy (+39)', flag: '🇮🇹' },
  { code: '+34', label: 'Spain (+34)', flag: '🇪🇸' },
  { code: '+351', label: 'Portugal (+351)', flag: '🇵🇹' },
  { code: '+31', label: 'Netherlands (+31)', flag: '🇳🇱' },
  { code: '+32', label: 'Belgium (+32)', flag: '🇧🇪' },
  { code: '+41', label: 'Switzerland (+41)', flag: '🇨🇭' },
  { code: '+43', label: 'Austria (+43)', flag: '🇦🇹' },
  { code: '+46', label: 'Sweden (+46)', flag: '🇸🇪' },
  { code: '+47', label: 'Norway (+47)', flag: '🇳🇴' },
  { code: '+45', label: 'Denmark (+45)', flag: '🇩🇰' },
  { code: '+358', label: 'Finland (+358)', flag: '🇫🇮' },
  { code: '+48', label: 'Poland (+48)', flag: '🇵🇱' },
  { code: '+420', label: 'Czech Republic (+420)', flag: '🇨🇿' },
  { code: '+30', label: 'Greece (+30)', flag: '🇬🇷' },
  { code: '+90', label: 'Turkey (+90)', flag: '🇹🇷' },
  { code: '+7', label: 'Russia (+7)', flag: '🇷🇺' },
  { code: '+55', label: 'Brazil (+55)', flag: '🇧🇷' },
  { code: '+52', label: 'Mexico (+52)', flag: '🇲🇽' },
  { code: '+54', label: 'Argentina (+54)', flag: '🇦🇷' },
  { code: '+56', label: 'Chile (+56)', flag: '🇨🇱' },
  { code: '+57', label: 'Colombia (+57)', flag: '🇨🇴' },
  { code: '+20', label: 'Egypt (+20)', flag: '🇪🇬' },
  { code: '+234', label: 'Nigeria (+234)', flag: '🇳🇬' },
  { code: '+254', label: 'Kenya (+254)', flag: '🇰🇪' },
  { code: '+212', label: 'Morocco (+212)', flag: '🇲🇦' },
  { code: '+60', label: 'Malaysia (+60)', flag: '🇲🇾' },
  { code: '+66', label: 'Thailand (+66)', flag: '🇹🇭' },
  { code: '+62', label: 'Indonesia (+62)', flag: '🇮🇩' },
  { code: '+63', label: 'Philippines (+63)', flag: '🇵🇭' },
  { code: '+84', label: 'Vietnam (+84)', flag: '🇻🇳' },
].sort((a, b) => a.label.localeCompare(b.label));

// Sanitize phone number - keep only digits, spaces, and hyphens
const sanitizePhoneNumber = (value: string): string => {
  return value.replace(/[^\d\s\-]/g, '');
};

// Strip all non-digits for storage
const stripToDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const PhoneInputWithDialCode: React.FC<PhoneInputWithDialCodeProps> = ({
  value,
  onChange,
  className,
  disabled = false,
}) => {
  const dialCode = value?.dialCode || '';
  const localNumber = value?.localNumber || '';

  const handleDialCodeChange = (newDialCode: string) => {
    const stripped = stripToDigits(localNumber);
    onChange({
      dialCode: newDialCode,
      localNumber: stripped,
      fullNumber: stripped ? `${newDialCode}${stripped}` : '',
    });
  };

  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePhoneNumber(e.target.value);
    const stripped = stripToDigits(sanitized);
    onChange({
      dialCode,
      localNumber: sanitized,
      fullNumber: stripped ? `${dialCode}${stripped}` : '',
    });
  };

  const selectedCountry = COUNTRY_DIAL_CODES.find(c => c.code === dialCode);

  return (
    <div className={cn('flex gap-2', className)}>
      <Select value={dialCode} onValueChange={handleDialCodeChange} disabled={disabled}>
        <SelectTrigger className="w-[110px] h-10 shrink-0 overflow-hidden">
          <span className="flex items-center gap-1.5 text-clip">
            <span className="text-base">{selectedCountry?.flag || '🌐'}</span>
            <span className="text-sm"> {dialCode}</span>
          </span>
        </SelectTrigger>
        <SelectContent className="max-h-[240px]">
          {COUNTRY_DIAL_CODES.map((country) => (
            <SelectItem key={country.code} value={country.code} className="py-2">
              <span className="flex items-center gap-2">
                <span className="text-base">{country.flag}</span>
                <span className="text-sm"> {country.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={localNumber}
        onChange={handleLocalNumberChange}
        placeholder="Phone number"
        className="h-10 flex-1"
        disabled={disabled}
      />
    </div>
  );
};

export default PhoneInputWithDialCode;
