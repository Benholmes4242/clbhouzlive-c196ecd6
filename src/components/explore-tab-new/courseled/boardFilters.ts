/**
 * THE DISCOVER BOARD'S FILTER MODEL (BRIEF_DISCOVER_FILTER_LED_BOARD).
 *
 * ONE OBJECT, AND IT IS THE RPC'S ARGUMENT LIST. Every key here is a parameter
 * of public.get_board_page / public.get_board_facets, in the RPC's own
 * vocabulary, so nothing is translated on the way to SQL and no second set of
 * names can drift from it (S1.6).
 *
 * THE FIXED LISTS LIVE HERE (S2.4). scope, window, band, feat, the three
 * courses set-options and the seven boards are HARDCODED CLIENT-SIDE; the RPC
 * supplies only their COUNTS, and an option missing from the facet result means
 * ZERO — the row still renders, greyed and unselectable. course, region_country
 * and region_sub are OPEN LISTS and are enumerated from the facet result alone:
 * 23,295 courses exist and 254 have ever carried a round, so a catalogue-led
 * list with the remainder greyed is not an option.
 */

export type BoardKey =
  | 'gross'
  | 'topar'
  | 'net'
  | 'stableford'
  | 'improved'
  | 'birdies'
  | 'recent';

/** S4 — seven boards, always all seven present in the picker (S4.3). */
export const BOARD_KEYS: BoardKey[] = [
  'gross',
  'topar',
  'net',
  'stableford',
  'improved',
  'birdies',
  'recent',
];

export type ScopeKey = 'everyone' | 'circle' | 'club' | 'you';
export type WindowKey = '14' | '30' | '90' | 'year' | 'all';
export type CoursesKey = 'any' | 'top100' | 'played' | 'one';
export type BandKey =
  | 'any'
  | 'near'
  | 'plus'
  | 'b0'
  | 'b5'
  | 'b10'
  | 'b15'
  | 'b20'
  | 'b28';
export type FeatKey =
  | 'any'
  | 'ace'
  | 'albatross'
  | 'eagle'
  | 'clean_card'
  | 'beat_par'
  | 'sub_80';
export type RegionKind = 'country' | 'sub_country';

export interface BoardFilters {
  scope: ScopeKey;
  window: WindowKey;
  regionKind: RegionKind | null;
  regionValue: string | null;
  courses: CoursesKey;
  courseId: string | null;
  band: BandKey;
  feat: FeatKey;
}

/**
 * S1.4 — GOLF_WEEK_DAYS STOPPED BEING THE WINDOW. It is now only the DEFAULT
 * window value, and the window itself is a member's choice.
 */
export const DEFAULT_WINDOW_DAYS = 14;

export const DEFAULT_FILTERS: BoardFilters = {
  scope: 'everyone',
  window: '14',
  regionKind: null,
  regionValue: null,
  courses: 'any',
  courseId: null,
  band: 'any',
  feat: 'any',
};

export interface FixedOption<K extends string> {
  key: K;
  /** i18n key. */
  i18n: string;
  /** ASCII-only English fallback. */
  label: string;
}

/** S3.3 — WHO. Four rows, each with a count. */
export const SCOPE_OPTIONS: FixedOption<ScopeKey>[] = [
  { key: 'everyone', i18n: 'discover.filterBoard.scope.everyone', label: 'Everyone' },
  { key: 'circle', i18n: 'discover.filterBoard.scope.circle', label: 'Your circle' },
  { key: 'club', i18n: 'discover.filterBoard.scope.club', label: 'Your club' },
  { key: 'you', i18n: 'discover.filterBoard.scope.you', label: 'Just you' },
];

/** S3.5 — When. 'year' IS THE CALENDAR YEAR, from 1 January (the RPC's own cutoff). */
export const WINDOW_OPTIONS: FixedOption<WindowKey>[] = [
  { key: '14', i18n: 'discover.filterBoard.window.d14', label: 'Last 14 days' },
  { key: '30', i18n: 'discover.filterBoard.window.d30', label: 'Last 30 days' },
  { key: '90', i18n: 'discover.filterBoard.window.d90', label: 'Last 90 days' },
  { key: 'year', i18n: 'discover.filterBoard.window.year', label: 'This year' },
  { key: 'all', i18n: 'discover.filterBoard.window.all', label: 'All time' },
];

/** The window's short form, for the hero rail and the applied line. */
export const WINDOW_SHORT: Record<WindowKey, { i18n: string; label: string }> = {
  '14': { i18n: 'discover.filterBoard.windowShort.d14', label: '14 DAYS' },
  '30': { i18n: 'discover.filterBoard.windowShort.d30', label: '30 DAYS' },
  '90': { i18n: 'discover.filterBoard.windowShort.d90', label: '90 DAYS' },
  year: { i18n: 'discover.filterBoard.windowShort.year', label: 'THIS YEAR' },
  all: { i18n: 'discover.filterBoard.windowShort.all', label: 'ALL TIME' },
};

/** S3.5 — the three courses SET options. Individual courses are an open list. */
export const COURSES_SET_OPTIONS: FixedOption<Exclude<CoursesKey, 'one'>>[] = [
  { key: 'any', i18n: 'discover.filterBoard.courses.any', label: 'All courses' },
  { key: 'top100', i18n: 'discover.filterBoard.courses.top100', label: 'Top 100' },
  { key: 'played', i18n: 'discover.filterBoard.courses.played', label: 'Courses you have played' },
];

/**
 * S3.5 — THE CLUB ANALYTICS BANDS. The boundaries are the app's one handicap
 * vocabulary and ARE NOT TO BE ADJUSTED here or anywhere else.
 */
export const BAND_OPTIONS: FixedOption<BandKey>[] = [
  { key: 'any', i18n: 'discover.filterBoard.band.all', label: 'All handicaps' },
  { key: 'near', i18n: 'discover.filterBoard.band.near', label: 'Near yours' },
  { key: 'plus', i18n: 'discover.filterBoard.band.plus', label: 'Plus' },
  { key: 'b0', i18n: 'discover.filterBoard.band.b0', label: 'Scratch to 4.9' },
  { key: 'b5', i18n: 'discover.filterBoard.band.b5', label: '5 to 9.9' },
  { key: 'b10', i18n: 'discover.filterBoard.band.b10', label: '10 to 14.9' },
  { key: 'b15', i18n: 'discover.filterBoard.band.b15', label: '15 to 19.9' },
  { key: 'b20', i18n: 'discover.filterBoard.band.b20', label: '20 to 27.9' },
  { key: 'b28', i18n: 'discover.filterBoard.band.b28', label: '28 and above' },
];

/**
 * BRIEF_FILTERS_SHEET_CASE_AND_FEATS S4 — THE FEATS ROW IS GONE FROM THE FILTER
 * PANEL. These labels remain because the FEAT AXIS still exists in the RPC and
 * in the applied line, and because the two RARE FEATS below are expressed
 * through it. eagle / clean_card / beat_par / sub_80 are ORPHANED UI-side: no
 * surface can select them any more. The RPC parameter, the pool columns and the
 * indexes are untouched (S4 keep-the-data rule).
 */
export const FEAT_OPTIONS: FixedOption<FeatKey>[] = [
  { key: 'any', i18n: 'discover.filterBoard.feat.any', label: 'Any' },
  { key: 'ace', i18n: 'discover.filterBoard.feat.ace', label: 'Hole in one' },
  { key: 'albatross', i18n: 'discover.filterBoard.feat.albatross', label: 'Albatross' },
  { key: 'eagle', i18n: 'discover.filterBoard.feat.eagle', label: 'Eagle' },
  { key: 'clean_card', i18n: 'discover.filterBoard.feat.cleanCard', label: 'Bogey-free round' },
  { key: 'beat_par', i18n: 'discover.filterBoard.feat.beatPar', label: 'Under par' },
  { key: 'sub_80', i18n: 'discover.filterBoard.feat.sub80', label: 'Broke 80' },
];

/**
 * S5 — THE TWO RARE FEATS ARE NOT BOARDS. They live at the foot of WHICH BOARD
 * under their own section label and each renders as a ROLL OF HONOUR: the
 * members who have recorded one, most recent first, with no position column and
 * no ranking figure. A "most albatrosses" column would be a list of 1s.
 *
 * MECHANICALLY they are the `recent` board (which orders by date) with the feat
 * axis set, so nothing new is asked of the database.
 */
export type RollKey = Extract<FeatKey, 'ace' | 'albatross'>;

export const ROLL_KEYS: RollKey[] = ['ace', 'albatross'];

export const ROLL_LABELS: Record<RollKey, { i18n: string; label: string }> = {
  ace: { i18n: 'discover.filterBoard.feat.ace', label: 'Hole in one' },
  albatross: { i18n: 'discover.filterBoard.feat.albatross', label: 'Albatross' },
};

/** True where the surface is a dated roll of honour rather than a ranked board. */
export const isRollFeat = (feat: FeatKey): feat is RollKey =>
  feat === 'ace' || feat === 'albatross';


export const BOARD_LABELS: Record<BoardKey, { i18n: string; label: string }> = {
  gross: { i18n: 'discover.filterBoard.board.gross', label: 'Lowest gross' },
  topar: { i18n: 'discover.filterBoard.board.topar', label: 'Best to par' },
  net: { i18n: 'discover.filterBoard.board.net', label: 'Lowest net' },
  stableford: { i18n: 'discover.filterBoard.board.stableford', label: 'Stableford' },
  improved: { i18n: 'discover.filterBoard.board.improved', label: 'Most improved' },
  birdies: { i18n: 'discover.filterBoard.board.birdies', label: 'Most birdies' },
  recent: { i18n: 'discover.filterBoard.board.recent', label: 'Most recent' },
};

/** True where the board counts ROUNDS rather than MEMBERS (S3.2). */
export const boardCountsRounds = (board: BoardKey) => board === 'recent';

export function filtersAreDefault(f: BoardFilters): boolean {
  return (
    f.scope === DEFAULT_FILTERS.scope &&
    f.window === DEFAULT_FILTERS.window &&
    f.regionKind == null &&
    f.courses === 'any' &&
    f.courseId == null &&
    f.band === 'any' &&
    f.feat === 'any'
  );
}
