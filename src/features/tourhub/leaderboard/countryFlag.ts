/**
 * countryFlag — turns an sr_players.country_code (3-letter) OR
 * sr_players.country (full name, e.g. "SOUTH KOREA") into an emoji flag.
 *
 * Reality check (distinct scan of sr_players today):
 *   country_code is universally NULL on this project. Every row exposes
 *   only country as an uppercase name. Board rows pass whichever is
 *   present down as `country_code`, so this util has to accept BOTH.
 *
 * Strategy:
 *   1. Normalize (uppercase, trim, collapse whitespace).
 *   2. Look up in a unified map (3-letter IOC/FIFA codes AND full names).
 *   3. Map the resulting ISO alpha-2 to Regional Indicator emojis.
 *
 * Special home-nation flags (tag sequences — iOS renders these):
 *   ENG / ENGLAND       -> St George
 *   SCO / SCOTLAND      -> Scottish saltire
 *   WAL / WALES         -> Welsh dragon
 *
 * NIR / NORTHERN IRELAND has NO emoji flag -> returns null (caller
 * falls back to the code/name text). This is the one honest exception.
 *
 * Unmapped -> null (caller renders text; never blank, never wrong).
 */

// Home-nation emoji tag sequences (RGI on iOS/macOS/newer Android).
const ENG_FLAG = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}';
const SCO_FLAG = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}';
const WAL_FLAG = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}';

// Deliberately null — no RGI emoji exists.
const NIR_FLAG = null;

// 3-letter and full-name -> ISO alpha-2 (or a literal emoji for the
// home nations). Keys are uppercased. Duplicates for defensive aliases.
const MAP: Record<string, string> = {
  // ==== North America ====
  USA: 'US', US: 'US', 'UNITED STATES': 'US', 'UNITED STATES OF AMERICA': 'US',
  CAN: 'CA', CANADA: 'CA',
  MEX: 'MX', MEXICO: 'MX',
  PUR: 'PR', PRI: 'PR', 'PUERTO RICO': 'PR',
  DOM: 'DO', 'DOMINICAN REPUBLIC': 'DO',
  CRC: 'CR', 'COSTA RICA': 'CR',
  PAN: 'PA', PANAMA: 'PA',
  BAH: 'BS', BAHAMAS: 'BS',
  BER: 'BM', BERMUDA: 'BM',
  BAR: 'BB', BARBADOS: 'BB',
  CAY: 'KY', 'CAYMAN ISLANDS': 'KY',

  // ==== South America ====
  ARG: 'AR', ARGENTINA: 'AR',
  BRA: 'BR', BRAZIL: 'BR',
  CHI: 'CL', CHL: 'CL', CHILE: 'CL',
  COL: 'CO', COLOMBIA: 'CO',
  VEN: 'VE', VENEZUELA: 'VE',
  PER: 'PE', PERU: 'PE',
  PAR: 'PY', PARAGUAY: 'PY',

  // ==== Europe ====
  ENG: '__ENG__', ENGLAND: '__ENG__',
  SCO: '__SCO__', SCOTLAND: '__SCO__',
  WAL: '__WAL__', WALES: '__WAL__',
  NIR: '__NIR__', 'NORTHERN IRELAND': '__NIR__',
  GBR: 'GB', 'GREAT BRITAIN': 'GB', 'UNITED KINGDOM': 'GB',
  IRL: 'IE', IRELAND: 'IE',
  FRA: 'FR', FRANCE: 'FR',
  GER: 'DE', DEU: 'DE', GERMANY: 'DE',
  ESP: 'ES', SPAIN: 'ES',
  ITA: 'IT', ITALY: 'IT',
  SWE: 'SE', SWEDEN: 'SE',
  NOR: 'NO', NORWAY: 'NO',
  DEN: 'DK', DNK: 'DK', DENMARK: 'DK',
  NED: 'NL', NLD: 'NL', NETHERLANDS: 'NL', HOLLAND: 'NL',
  BEL: 'BE', BELGIUM: 'BE',
  AUT: 'AT', AUSTRIA: 'AT',
  SUI: 'CH', CHE: 'CH', SWITZERLAND: 'CH',
  FIN: 'FI', FINLAND: 'FI',
  POL: 'PL', POLAND: 'PL',
  CZE: 'CZ', 'CZECH REPUBLIC': 'CZ', CZECHIA: 'CZ',
  POR: 'PT', PRT: 'PT', PORTUGAL: 'PT',
  SVK: 'SK', SLOVAKIA: 'SK',
  SVN: 'SI', SLOVENIA: 'SI',
  EST: 'EE', ESTONIA: 'EE',
  UKR: 'UA', UKRAINE: 'UA',
  RUS: 'RU', RUSSIA: 'RU',
  ALB: 'AL', ALBANIA: 'AL',
  ARM: 'AM', ARMENIA: 'AM',
  TUR: 'TR', TURKEY: 'TR',
  ISR: 'IL', ISRAEL: 'IL',

  // ==== Asia ====
  KOR: 'KR', 'SOUTH KOREA': 'KR', 'KOREA REPUBLIC': 'KR',
  JPN: 'JP', JAPAN: 'JP',
  CHN: 'CN', CHINA: 'CN',
  TPE: 'TW', TWN: 'TW', 'CHINESE TAIPEI': 'TW', TAIWAN: 'TW',
  HKG: 'HK', 'HONG KONG': 'HK',
  IND: 'IN', INDIA: 'IN',
  THA: 'TH', THAILAND: 'TH',
  PHI: 'PH', PHL: 'PH', PHILIPPINES: 'PH',
  MAS: 'MY', MYS: 'MY', MALAYSIA: 'MY',
  SGP: 'SG', SIN: 'SG', SINGAPORE: 'SG',
  BAN: 'BD', BGD: 'BD', BANGLADESH: 'BD',
  PAK: 'PK', PAKISTAN: 'PK',
  SRI: 'LK', LKA: 'LK', 'SRI LANKA': 'LK',

  // ==== Middle East ====
  BRN: 'BH', BAHRAIN: 'BH',
  UAE: 'AE', ARE: 'AE', 'UNITED ARAB EMIRATES': 'AE',
  QAT: 'QA', QATAR: 'QA',
  KSA: 'SA', SAU: 'SA', 'SAUDI ARABIA': 'SA',

  // ==== Africa ====
  RSA: 'ZA', ZAF: 'ZA', 'SOUTH AFRICA': 'ZA',
  KEN: 'KE', KENYA: 'KE',
  ZIM: 'ZW', ZWE: 'ZW', ZIMBABWE: 'ZW',
  UGA: 'UG', UGANDA: 'UG',
  MAR: 'MA', MOROCCO: 'MA',
  MRI: 'MU', MUS: 'MU', MAURITIUS: 'MU',
  NGA: 'NG', NIGERIA: 'NG',
  RWA: 'RW', RWANDA: 'RW',
  MWI: 'MW', MALAWI: 'MW',

  // ==== Oceania ====
  AUS: 'AU', AUSTRALIA: 'AU',
  NZL: 'NZ', 'NEW ZEALAND': 'NZ',
  FIJ: 'FJ', FJI: 'FJ', FIJI: 'FJ',
  SAM: 'WS', WSM: 'WS', SAMOA: 'WS',
};

function toRegionalIndicator(alpha2: string): string {
  const a = alpha2.toUpperCase();
  if (a.length !== 2) return '';
  const A = 0x1f1e6;
  const base = 'A'.charCodeAt(0);
  return (
    String.fromCodePoint(A + (a.charCodeAt(0) - base)) +
    String.fromCodePoint(A + (a.charCodeAt(1) - base))
  );
}

export function countryFlag(code: string | null | undefined): string | null {
  if (!code) return null;
  const key = code.trim().toUpperCase().replace(/\s+/g, ' ');
  if (!key) return null;

  const mapped = MAP[key];
  if (!mapped) return null;

  if (mapped === '__ENG__') return ENG_FLAG;
  if (mapped === '__SCO__') return SCO_FLAG;
  if (mapped === '__WAL__') return WAL_FLAG;
  if (mapped === '__NIR__') return NIR_FLAG;

  return toRegionalIndicator(mapped);
}
