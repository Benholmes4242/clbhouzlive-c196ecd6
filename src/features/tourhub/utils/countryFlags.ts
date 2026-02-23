/**
 * Country flag utilities for Tour Hub
 * 
 * Converts country names, IOC/ISO-3 codes, and ISO-2 codes to emoji flags.
 * Comprehensive mapping covering all PGA Tour / Sportradar countries.
 */

/** Full country name → ISO-2 mapping (Sportradar stores uppercase names) */
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  'UNITED STATES': 'US',
  'UNITED STATES OF AMERICA': 'US',
  'ENGLAND': 'GB',
  'SCOTLAND': 'GB',
  'WALES': 'GB',
  'NORTHERN IRELAND': 'GB',
  'GREAT BRITAIN': 'GB',
  'GERMANY': 'DE',
  'AUSTRIA': 'AT',
  'AUSTRALIA': 'AU',
  'CANADA': 'CA',
  'COLOMBIA': 'CO',
  'SOUTH KOREA': 'KR',
  'KOREA': 'KR',
  'KOREA REPUBLIC': 'KR',
  'JAPAN': 'JP',
  'CHINA': 'CN',
  'CHINESE TAIPEI': 'TW',
  'TAIWAN': 'TW',
  'FRANCE': 'FR',
  'SPAIN': 'ES',
  'ITALY': 'IT',
  'SWEDEN': 'SE',
  'NORWAY': 'NO',
  'DENMARK': 'DK',
  'FINLAND': 'FI',
  'NETHERLANDS': 'NL',
  'BELGIUM': 'BE',
  'SWITZERLAND': 'CH',
  'IRELAND': 'IE',
  'SOUTH AFRICA': 'ZA',
  'ZIMBABWE': 'ZW',
  'MEXICO': 'MX',
  'BRAZIL': 'BR',
  'ARGENTINA': 'AR',
  'CHILE': 'CL',
  'VENEZUELA': 'VE',
  'PERU': 'PE',
  'INDIA': 'IN',
  'THAILAND': 'TH',
  'PHILIPPINES': 'PH',
  'MALAYSIA': 'MY',
  'SINGAPORE': 'SG',
  'INDONESIA': 'ID',
  'NEW ZEALAND': 'NZ',
  'FIJI': 'FJ',
  'PORTUGAL': 'PT',
  'CZECH REPUBLIC': 'CZ',
  'CZECHIA': 'CZ',
  'POLAND': 'PL',
  'HUNGARY': 'HU',
  'ROMANIA': 'RO',
  'GREECE': 'GR',
  'TURKEY': 'TR',
  'ISRAEL': 'IL',
  'QATAR': 'QA',
  'BAHRAIN': 'BH',
  'SAUDI ARABIA': 'SA',
  'UNITED ARAB EMIRATES': 'AE',
  'KENYA': 'KE',
  'NIGERIA': 'NG',
  'EGYPT': 'EG',
  'MOROCCO': 'MA',
  'PANAMA': 'PA',
  'COSTA RICA': 'CR',
  'PUERTO RICO': 'PR',
  'BERMUDA': 'BM',
  'PARAGUAY': 'PY',
  'URUGUAY': 'UY',
  'ECUADOR': 'EC',
  'HONDURAS': 'HN',
  'GUATEMALA': 'GT',
  'DOMINICAN REPUBLIC': 'DO',
  'JAMAICA': 'JM',
  'TRINIDAD AND TOBAGO': 'TT',
  'ICELAND': 'IS',
  'LATVIA': 'LV',
  'LITHUANIA': 'LT',
  'ESTONIA': 'EE',
  'SLOVAKIA': 'SK',
  'SLOVENIA': 'SI',
  'CROATIA': 'HR',
  'SERBIA': 'RS',
  'BULGARIA': 'BG',
  'UKRAINE': 'UA',
  'RUSSIA': 'RU',
  'GEORGIA': 'GE',
  'ARMENIA': 'AM',
  'KAZAKHSTAN': 'KZ',
  'UZBEKISTAN': 'UZ',
  'PAKISTAN': 'PK',
  'SRI LANKA': 'LK',
  'BANGLADESH': 'BD',
  'NEPAL': 'NP',
  'VIETNAM': 'VN',
  'CAMBODIA': 'KH',
  'MYANMAR': 'MM',
  'BOTSWANA': 'BW',
  'ZAMBIA': 'ZM',
  'TANZANIA': 'TZ',
  'UGANDA': 'UG',
  'ETHIOPIA': 'ET',
  'TUNISIA': 'TN',
  'ALGERIA': 'DZ',
  'LUXEMBOURG': 'LU',
  'MAURITIUS': 'MU',
  'NAMIBIA': 'NA',
  'MOZAMBIQUE': 'MZ',
  'IVORY COAST': 'CI',
  "COTE D'IVOIRE": 'CI',
  'CAMEROON': 'CM',
  'GHANA': 'GH',
  'SENEGAL': 'SN',
  'HONG KONG': 'HK',
  'MACAU': 'MO',
  'MONGOLIA': 'MN',
  'PAPUA NEW GUINEA': 'PG',
  'SAMOA': 'WS',
  'TONGA': 'TO',
  'GUAM': 'GU',
  'MALTA': 'MT',
  'CYPRUS': 'CY',
  'BOLIVIA': 'BO',
  'CUBA': 'CU',
  'EL SALVADOR': 'SV',
  'NICARAGUA': 'NI',
  'SURINAME': 'SR',
  'LEBANON': 'LB',
  'JORDAN': 'JO',
  'IRAQ': 'IQ',
  'IRAN': 'IR',
  'KUWAIT': 'KW',
  'OMAN': 'OM',
  'YEMEN': 'YE',
  'AFGHANISTAN': 'AF',
};

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

/** Convert ISO-2 code to regional indicator emoji */
function isoToEmoji(iso: string): string {
  return String.fromCodePoint(
    ...[...iso].map(c => 127397 + c.charCodeAt(0))
  );
}

/**
 * Convert a country identifier (full name, IOC-3, or ISO-2) to an emoji flag.
 * Returns empty string if no match found.
 */
export function countryCodeToFlag(code: string | null | undefined): string {
  if (!code) return '';

  const upper = code.toUpperCase().trim();

  // 1. Full country name → ISO-2
  const fromName = COUNTRY_NAME_TO_ISO[upper];
  if (fromName) return isoToEmoji(fromName);

  // 2. IOC-3 → ISO-2 (e.g., "USA" → "US")
  const fromIOC = IOC_TO_ISO[upper];
  if (fromIOC) return isoToEmoji(fromIOC);

  // 3. If exactly 2 characters, assume ISO-2 and convert directly
  if (upper.length === 2) return isoToEmoji(upper);

  // 4. No match — return empty string
  return '';
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
