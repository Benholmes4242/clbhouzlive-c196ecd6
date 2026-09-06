/**
 * THE DISCOVER BOARD'S FILTER MODEL (BRIEF_DISCOVER_FILTER_LED_BOARD).
 *
 * ONE OBJECT, AND IT IS THE RPC'S ARGUMENT LIST. Every key here is a parameter
 * of public.get_board_page / public.get_board_facets, in the RPC's own
 * vocabulary, so nothing is translated on the way to SQL and no second set of
 * names can drift from it (S1.6).
 *
 * THE FIXED LISTS LIVE HERE (S2.4). scope, window, band, competition, the three
 * courses set-options and the seven boards are HARDCODED CLIENT-SIDE; the RPC
 * supplies only their COUNTS, and an option missing from the facet result means
 * ZERO — the row still renders, greyed and unselectable. course, region_country
 * and region_sub are OPEN LISTS and are enumerated from the facet result alone:
 * 23,295 courses exist and 254 have ever carried a round, so a catalogue-led
 * list with the remainder greyed is not an option.
 */

export type RankingBoardKey =
  | 'gross'
  | 'topar'
  | 'net'
  | 'stableford'
  | 'improved'
  | 'birdies'
  | 'recent';

/**
 * BRIEF_DISCOVER_BOARD_FEAT_BOARDS B1 — A FEAT IS A BOARD, NOT A FILTER AXIS.
 * p_feat no longer exists; these four are BOARD VALUES the RPC ranks itself.
 */
export type FeatBoardKey = 'ace' | 'albatross' | 'eagle' | 'clean_card';

export type BoardKey = RankingBoardKey | FeatBoardKey;

/** B1.2 — the RANKINGS section: seven boards that rank members. */
/* BRIEF_RETIRE_GROSS_BOARD S1.3 — 'gross' IS RETIRED-BUT-VALID. The key still
   parses out of storage and still resolves in the RPC; it is simply never
   OFFERED. The surviving scoring board is 'topar', which ranks on gross-to-par
   and carries the vernacular label "Lowest gross" (Amendment B1.1). */
/* BRIEF_FILTER_SHEET_ORDER_AND_BANDS S1.1 — MOST RECENT LEADS. It is the board
   the day's first session lands on, so it is the one a member returns to the
   drawer looking for. PICKER ORDER ONLY (S1.5): the rotation weighting, the
   handicap default and every entry mode read their own lists. */
export const RANKING_BOARD_KEYS: RankingBoardKey[] = [
  'recent',
  'topar',
  'net',
  'stableford',
  'improved',
  'birdies',
];

/**
 * B1.2 — the FEATS section: four boards that LIST EVENTS. Plural labels, date
 * order, no deduping, and greyed most of the time (B1.6) because production
 * holds five aces and one albatross across 3,412 rounds.
 */
export const FEAT_BOARD_KEYS: FeatBoardKey[] = ['ace', 'albatross', 'eagle', 'clean_card'];

export const isFeatBoard = (board: BoardKey): board is FeatBoardKey =>
  (FEAT_BOARD_KEYS as string[]).includes(board);

/** All offered boards, in picker order (ten: 'gross' is retired). */
export const BOARD_KEYS: BoardKey[] = [...RANKING_BOARD_KEYS, ...FEAT_BOARD_KEYS];

export type ScopeKey = 'everyone' | 'circle' | 'club' | 'you';
/** B3 — the COMPETITION axis, new and fully populated in production. */
export type CompetitionKey = 'any' | 'competition' | 'social';
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
export type RegionKind = 'country' | 'sub_country';

export interface BoardFilters {
  scope: ScopeKey;
  window: WindowKey;
  regionKind: RegionKind | null;
  regionValue: string | null;
  courses: CoursesKey;
  courseId: string | null;
  band: BandKey;
  competition: CompetitionKey;
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
  competition: 'any',
};

/**
 * S2.4 — A STORED 'near' MUST NOT STRAND ANYONE. A retired band is unselectable,
 * so a filter state still carrying it would show a filtered board with no chip
 * lit and no way out but Reset. Every restored or externally supplied filter
 * state passes through here and resolves 'near' to 'any'; the applied filter
 * line then reads real state and cannot print "Near yours" (S2.5).
 */
export function normalizeFilters(f: BoardFilters): BoardFilters {
  return f.band === 'near' ? { ...f, band: 'any' } : f;
}

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
  /* B2 — "JUST YOU" IS GONE. A single-row leaderboard is not a leaderboard, and
     a member's own history is better served on their profile. p_scope='you'
     still resolves in the RPC; we simply stop offering it. */
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
/* S2.1/S2.3 — 'near' IS RETIRED-BUT-VALID. The named bands already say exactly
   which range they cover, which "Near yours" never did, so the axis offers eight
   chips. BandKey still accepts 'near', its i18n key stays, and the SQL band
   predicate is untouched; it is simply never OFFERED. */
export const BAND_OPTIONS: FixedOption<BandKey>[] = [
  { key: 'any', i18n: 'discover.filterBoard.band.all', label: 'All handicaps' },
  { key: 'plus', i18n: 'discover.filterBoard.band.plus', label: 'Plus' },
  { key: 'b0', i18n: 'discover.filterBoard.band.b0', label: 'Scratch to 4.9' },
  { key: 'b5', i18n: 'discover.filterBoard.band.b5', label: '5 to 9.9' },
  { key: 'b10', i18n: 'discover.filterBoard.band.b10', label: '10 to 14.9' },
  { key: 'b15', i18n: 'discover.filterBoard.band.b15', label: '15 to 19.9' },
  { key: 'b20', i18n: 'discover.filterBoard.band.b20', label: '20 to 27.9' },
  { key: 'b28', i18n: 'discover.filterBoard.band.b28', label: '28 and above' },
];

/**
 * B3.2 — THE COMPETITION AXIS. THE THREE COUNTS DO NOT SUM TO THE TOTAL and must
 * never be drawn as a split: on a members board a member with both a competition
 * and a social round is counted in BOTH. Plain counts on rows, like every axis.
 */
export const COMPETITION_OPTIONS: FixedOption<CompetitionKey>[] = [
  { key: 'any', i18n: 'discover.filterBoard.competition.any', label: 'Any round' },
  { key: 'competition', i18n: 'discover.filterBoard.competition.competition', label: 'Competition' },
  { key: 'social', i18n: 'discover.filterBoard.competition.social', label: 'Social' },
];

export const BOARD_LABELS: Record<BoardKey, { i18n: string; label: string }> = {
  /* Retired (S1.3): never offered, kept so a stored key still labels. */
  gross: { i18n: 'discover.filterBoard.board.gross', label: 'Lowest gross' },
  /* B1.1 — the KEY stays 'topar'; the LABEL is the vernacular one. */
  topar: { i18n: 'discover.filterBoard.board.topar', label: 'Lowest gross' },
  net: { i18n: 'discover.filterBoard.board.net', label: 'Lowest net' },
  stableford: { i18n: 'discover.filterBoard.board.stableford', label: 'Stableford' },
  improved: { i18n: 'discover.filterBoard.board.improved', label: 'Most improved' },
  birdies: { i18n: 'discover.filterBoard.board.birdies', label: 'Most birdies' },
  recent: { i18n: 'discover.filterBoard.board.recent', label: 'Most recent' },
  /* PLURAL: each is a list of EVENTS rather than a ranking of members (B1.2). */
  ace: { i18n: 'discover.filterBoard.board.ace', label: 'Holes in one' },
  albatross: { i18n: 'discover.filterBoard.board.albatross', label: 'Albatrosses' },
  eagle: { i18n: 'discover.filterBoard.board.eagle', label: 'Eagles' },
  clean_card: { i18n: 'discover.filterBoard.board.cleanCard', label: 'Bogey-free rounds' },
};

/**
 * True where the board counts ROUNDS rather than MEMBERS (S3.2). B1.4 — all four
 * feat boards read "rounds", never "members", because a member with two aces
 * holds two rows.
 */
export const boardCountsRounds = (board: BoardKey) =>
  board === 'recent' || isFeatBoard(board);

export function filtersAreDefault(f: BoardFilters): boolean {
  return (
    f.scope === DEFAULT_FILTERS.scope &&
    f.window === DEFAULT_FILTERS.window &&
    f.regionKind == null &&
    f.courses === 'any' &&
    f.courseId == null &&
    f.band === 'any' &&
    f.competition === 'any'
  );
}

/**
 * BRIEF_SCORES_TWO_HALVES S3.2 — THE TEN MEMBER BOARDS, VISIBLE.
 *
 * The rail is how a member DISCOVERS that Stableford or Bogey-free exist; the
 * filter sheet's own picker order (S1.1 above) is a different surface and is
 * left alone. 'gross' stays retired (S1.3), so the requested "Lowest gross" and
 * "To par" are ONE board — 'topar' ranks on gross-to-par under the vernacular
 * label. Albatrosses takes the freed tenth place rather than offering the same
 * board twice under two names.
 */
export const SCORES_MEMBER_BOARD_KEYS: BoardKey[] = [
  'topar',
  'net',
  'stableford',
  'birdies',
  'improved',
  'recent',
  'ace',
  'eagle',
  'clean_card',
  'albatross',
];

/**
 * S5 — THE SIX COURSE BOARDS. Each is an ORDER inside public.get_board_courses
 * (p_sort), which orders AND limits on the same axis, so a board never ranks the
 * survivors of a most-played cut.
 */
export const COURSE_BOARD_KEYS = ['played', 'hardest', 'easiest', 'low', 'new', 'rated'] as const;
export type CourseBoardKey = (typeof COURSE_BOARD_KEYS)[number];

export const COURSE_BOARD_LABELS: Record<CourseBoardKey, { i18n: string; label: string }> = {
  played: { i18n: 'discover.courseBoard.played', label: 'Most played' },
  hardest: { i18n: 'discover.courseBoard.hardest', label: 'Hardest' },
  easiest: { i18n: 'discover.courseBoard.easiest', label: 'Easiest' },
  low: { i18n: 'discover.courseBoard.low', label: 'Lowest round' },
  new: { i18n: 'discover.courseBoard.new', label: 'New this window' },
  rated: { i18n: 'discover.courseBoard.rated', label: 'Best rated' },
};
