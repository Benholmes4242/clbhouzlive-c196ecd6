/**
 * Brand colors for college golf programs.
 * Keys match normalized_name values in college_season_stats (lowercase, no separators).
 */

export interface CollegeBrandColors {
  primary: string;
  secondary: string;
}

const COLLEGE_BRAND_COLORS: Record<string, CollegeBrandColors> = {
  // === Power programs ===
  georgia:          { primary: '#BA0C2F', secondary: '#000000' },
  texas:            { primary: '#BF5700', secondary: '#333F48' },
  oklahoma:         { primary: '#841617', secondary: '#1A1A2E' },
  stanford:         { primary: '#8C1515', secondary: '#2E2D29' },
  alabama:          { primary: '#9E1B32', secondary: '#828A8F' },
  florida:          { primary: '#0021A5', secondary: '#FA4616' },
  lsu:              { primary: '#461D7C', secondary: '#FDD023' },
  wakeforest:       { primary: '#9E7E38', secondary: '#000000' },
  northcarolina:    { primary: '#7BAFD4', secondary: '#13294B' },
  arizonastate:     { primary: '#8C1D40', secondary: '#FFC627' },
  oklahomastate:    { primary: '#FF7300', secondary: '#000000' },
  usc:              { primary: '#990000', secondary: '#FFC72C' },

  // === Additional programs ===
  california:       { primary: '#003262', secondary: '#FDB515' },
  ucla:             { primary: '#2D68C4', secondary: '#F2A900' },
  duke:             { primary: '#003087', secondary: '#FFFFFF' },
  clemson:          { primary: '#F56600', secondary: '#522D80' },
  northwestern:     { primary: '#4E2A84', secondary: '#000000' },
  washington:       { primary: '#4B2E83', secondary: '#B7A57A' },
  tohokufukushi:    { primary: '#1A1A2E', secondary: '#2D2D44' },
  yonsei:           { primary: '#003876', secondary: '#FFFFFF' },
  sandiegostate:    { primary: '#A6192E', secondary: '#000000' },
  floridastate:     { primary: '#782F40', secondary: '#CEB888' },
  auburn:           { primary: '#0C2340', secondary: '#E87722' },
  virginia:         { primary: '#232D4B', secondary: '#F84C1E' },
  texasam:          { primary: '#500000', secondary: '#FFFFFF' },
  vanderbilt:       { primary: '#866D4B', secondary: '#000000' },
  pepperdine:       { primary: '#00205C', secondary: '#ED8B00' },
  illinois:         { primary: '#E84A27', secondary: '#13294B' },
  olemiss:          { primary: '#CE1126', secondary: '#14213D' },
  tennessee:        { primary: '#FF8200', secondary: '#58595B' },
  southcarolina:    { primary: '#73000A', secondary: '#000000' },
  arkansas:         { primary: '#9D2235', secondary: '#000000' },
  michigan:         { primary: '#00274C', secondary: '#FFCB05' },
  ohiostate:        { primary: '#BB0000', secondary: '#666666' },
  arizona:          { primary: '#CC0033', secondary: '#003366' },
  texastech:        { primary: '#CC0000', secondary: '#000000' },
  byu:              { primary: '#002E5D', secondary: '#FFFFFF' },
  kentucky:         { primary: '#0033A0', secondary: '#FFFFFF' },
  trinity:          { primary: '#5B2C82', secondary: '#FFFFFF' },
  georgiatech:      { primary: '#B3A369', secondary: '#003057' },
  oregon:           { primary: '#154733', secondary: '#FEE123' },
  smu:              { primary: '#CC0035', secondary: '#354CA1' },
  tcu:              { primary: '#4D1979', secondary: '#A3A9AC' },
  notredame:        { primary: '#0C2340', secondary: '#C99700' },
  baylor:           { primary: '#154734', secondary: '#FFB81C' },
  purdue:           { primary: '#CEB888', secondary: '#000000' },
  louisville:       { primary: '#AD0000', secondary: '#000000' },
  mississippistate: { primary: '#660000', secondary: '#FFFFFF' },
  kansas:           { primary: '#0051BA', secondary: '#E8000D' },
};

const DEFAULT_COLORS: CollegeBrandColors = { primary: '#1A1A2E', secondary: '#2D2D44' };

export function getCollegeColors(normalizedName: string): CollegeBrandColors {
  return COLLEGE_BRAND_COLORS[normalizedName] || DEFAULT_COLORS;
}

/**
 * Build a podium-style gradient. For light primary colors, uses secondary as the dominant base.
 */
export function getCollegePodiumGradient(normalizedName: string): string {
  const colors = getCollegeColors(normalizedName);
  return `linear-gradient(135deg, ${colors.primary}99 0%, ${colors.primary}80 50%, ${colors.secondary}66 100%)`;
}

/**
 * Very subtle accent background for cards (~4% opacity of primary).
 */
export function getCollegeAccentBg(normalizedName: string): string {
  const colors = getCollegeColors(normalizedName);
  return `${colors.primary}0A`;
}

/**
 * Subtle accent border for cards (~8% opacity of primary).
 */
export function getCollegeAccentBorder(normalizedName: string): string {
  const colors = getCollegeColors(normalizedName);
  return `${colors.primary}15`;
}

/**
 * CSS linear-gradient for hero/full-page use (legacy compat).
 */
export function getCollegeGradientCSS(normalizedName: string): string {
  const { primary, secondary } = getCollegeColors(normalizedName);
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
}
