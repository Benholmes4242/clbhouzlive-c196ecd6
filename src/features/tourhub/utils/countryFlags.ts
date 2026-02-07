/**
 * Country flag utilities for Tour Hub
 * 
 * Converts IOC/ISO-3 country codes to emoji flags.
 * Comprehensive mapping covering all PGA Tour countries.
 */

/** IOC-3 → ISO-2 mapping for all PGA Tour countries */
const IOC_TO_ISO: Record<string, string> = {
  'USA': 'US', 'GBR': 'GB', 'AUS': 'AU', 'CAN': 'CA', 'RSA': 'ZA',
  'KOR': 'KR', 'JPN': 'JP', 'SWE': 'SE', 'NOR': 'NO', 'ESP': 'ES',
  'FRA': 'FR', 'GER': 'DE', 'IRL': 'IE', 'ENG': 'GB', 'SCO': 'GB',
  'WAL': 'GB', 'ITA': 'IT', 'MEX': 'MX', 'ARG': 'AR', 'COL': 'CO',
  'CHI': 'CL', 'BRA': 'BR', 'IND': 'IN', 'CHN': 'CN', 'THA': 'TH',
  'TPE': 'TW', 'PHI': 'PH', 'NZL': 'NZ', 'FIJ': 'FJ', 'DEN': 'DK',
  'FIN': 'FI', 'BEL': 'BE', 'NED': 'NL', 'AUT': 'AT', 'SUI': 'CH',
  'POR': 'PT', 'POL': 'PL', 'CZE': 'CZ', 'VEN': 'VE', 'PAR': 'PY',
  'URU': 'UY', 'PUR': 'PR', 'ZIM': 'ZW',
};

/**
 * Convert 3-letter country code (IOC/ISO-3) to emoji flag.
 * Falls back to best-effort 2-letter conversion if code not in map.
 */
export function countryCodeToFlag(code: string | null | undefined): string {
  if (!code) return '';
  const iso = IOC_TO_ISO[code.toUpperCase()] || code.slice(0, 2).toUpperCase();
  return iso
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

/**
 * Title-case a country name string.
 * e.g. "UNITED STATES" → "United States"
 */
export function titleCaseCountry(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
