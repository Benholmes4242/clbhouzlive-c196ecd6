import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

/**
 * THE ROTATING HERO'S CARD LIBRARY AND ITS FLOORS
 * (BRIEF_EXPLORE_ROTATING_HERO §1, §4, §5, §6).
 *
 * A CARD IS A METRIC CROSSED WITH A WINDOW — eight metrics by three windows,
 * twenty-four combinations, and MOST OF THEM FAIL on any given day. That is the
 * design, not a fault: the floors in §5 exist to keep a coin toss off the top of
 * the page.
 *
 * THIS FILE IS PURE. It takes the rounds the page already holds plus the net map
 * gam_round_net supplies, and returns the qualifying cards. It fetches nothing,
 * derives no net, and can be reasoned about without rendering a hero.
 *
 * NET IS THE DATABASE'S NUMBER (Ben's ruling, 10 Sep 2026). `netByScore` comes
 * from public.gam_round_net through useRoundNetScores — the SAME source the
 * Lowest net board reads. There is deliberately NO course-handicap arithmetic
 * here: a second copy of the WHS formula in the client is how the two drift. A
 * round with no net score does not qualify for the two net-bearing metrics and
 * is never substituted with gross.
 *
 * WHY TIES ARE CHECKED ON ROWS, NOT MEMBERS (§5a). Two members sharing the
 * figure is the case the brief names. Two rounds by the SAME member sharing it
 * also disqualifies a single-round card, because the card names ONE round and
 * has no honest way to choose between them.
 */

export type HeroMetric =
  /* SINGLE-ROUND — one scorecard behind the figure. */
  | 'gross'
  | 'net'
  | 'stableford'
  | 'vsHandicap'
  /* AGGREGATE — many rounds behind the figure, so no shape (§2.2). */
  | 'birdies'
  | 'eagles'
  | 'rounds'
  | 'courses';

export type HeroWindow = 14 | 30 | 90;

export const HERO_WINDOWS: HeroWindow[] = [14, 30, 90];

export const SINGLE_ROUND_METRICS: HeroMetric[] = ['gross', 'net', 'stableford', 'vsHandicap'];
export const AGGREGATE_METRICS: HeroMetric[] = ['birdies', 'eagles', 'rounds', 'courses'];

export const isAggregate = (m: HeroMetric) => (AGGREGATE_METRICS as string[]).includes(m);

/**
 * §5b THE FIGURE FLOORS. Single-round cards have none — a lowest gross is a
 * lowest gross. Eagles keeps its floor of 2 knowing it will almost never
 * qualify (only 12 rounds in 90 days carry an eagle): that is the floor working,
 * and it will be worth seeing on the day somebody makes three.
 */
export const FIGURE_FLOORS: Partial<Record<HeroMetric, number>> = {
  birdies: 6,
  eagles: 2,
  rounds: 5,
  courses: 4,
};

/** §5c THE POOL IS REAL — a lowest gross from a pool of two is a coin toss. */
export const POOL_MIN_ROUNDS = 5;
export const POOL_MIN_MEMBERS = 3;

export type HeroPool = 'circle' | 'everyone';

/** §4 the context line: a KEY plus its numbers, never free text. */
export interface HeroContext {
  /**
   * clear   — "{{n}} clear of the next best" (single-round margin)
   * nobody  — "Nobody else made more than {{n}}" (aggregate runner-up)
   * offGross— "Off {{hcp}}, gross {{gross}}" (win against handicap)
   * pool    — "Best of {{rounds}} rounds this fortnight / month / quarter"
   * busiest — "The busiest fortnight in your circle" (rounds/courses, no rival)
   */
  rule: 'clear' | 'nobody' | 'offGross' | 'pool' | 'busiest';
  margin?: number;
  runnerUp?: number;
  hcp?: number;
  gross?: number;
  /**
   * THE REAL NUMBER OF ROUNDS IN THE WINDOW, not the number fetched and not an
   * array length after a client-side filter. It is the length of the window
   * slice of the pool read, which is only the same thing while the read is not
   * truncated — hence `poolTruncated`, which takes the card out rather than
   * letting a cap masquerade as a count.
   */
  poolRounds: number;
  poolMembers: number;
  /** Which pool the ladder settled on. The context line MUST say it. */
  pool: HeroPool;
}


export interface HeroCard {
  /** `${metric}-${window}` — the rotation's exclusion key (§6). */
  id: string;
  metric: HeroMetric;
  window: HeroWindow;
  pool: HeroPool;
  /** The number in the 34px figure. */
  figure: number;
  member: {
    user_id: string;
    display_name: string;
    profile_photo_url: string | null;
  };
  /** Present on single-round cards ONLY — it is the round the card names. */
  round: CircleRoundRow | null;
  /** Aggregate spread: "Across 6 rounds, 4 courses" (§2.2). */
  spread: { rounds: number; courses: number } | null;
  context: HeroContext;
}

const DAY_MS = 86_400_000;

/** Rounds inside the window, by play_date (the same date the boards rank on). */
function inWindow(rows: readonly CircleRoundRow[], window: HeroWindow, now: number): CircleRoundRow[] {
  const from = new Date(now - window * DAY_MS).toISOString().slice(0, 10);
  return rows.filter((r) => !!r.play_date && r.play_date >= from);
}

/** §5c — the pool behind EVERY card in this window. */
function poolShape(rows: readonly CircleRoundRow[]) {
  const members = new Set<string>();
  for (const r of rows) members.add(r.user_id);
  return { poolRounds: rows.length, poolMembers: members.size };
}

const poolIsReal = (p: { poolRounds: number; poolMembers: number }) =>
  p.poolRounds >= POOL_MIN_ROUNDS && p.poolMembers >= POOL_MIN_MEMBERS;

/** The value a single-round metric ranks on, or null when the round cannot carry it. */
function singleValue(
  metric: HeroMetric,
  row: CircleRoundRow,
  netByScore: ReadonlyMap<string, { net: number }>,
): number | null {
  const net = row.score_id ? netByScore.get(row.score_id)?.net ?? null : null;
  switch (metric) {
    case 'gross':
      return row.gross ?? null;
    case 'net':
      return net;
    case 'stableford':
      return row.stableford_points ?? null;
    case 'vsHandicap':
      /* BIGGEST WIN AGAINST HANDICAP = how far the DATABASE'S net finished under
         the course par. Both terms are read, never computed: net from
         gam_round_net, par from the round row. */
      return net != null && row.course_par != null ? row.course_par - net : null;
    default:
      return null;
  }
}

/** Lower is better for gross and net; higher is better for the rest. */
const lowerWins = (metric: HeroMetric) => metric === 'gross' || metric === 'net';

function buildSingleRoundCard(
  metric: HeroMetric,
  window: HeroWindow,
  rows: readonly CircleRoundRow[],
  netByScore: ReadonlyMap<string, { net: number }>,
  pool: HeroPool,
  shape: { poolRounds: number; poolMembers: number },
): HeroCard | null {
  const scored: Array<{ row: CircleRoundRow; value: number }> = [];
  for (const row of rows) {
    const value = singleValue(metric, row, netByScore);
    if (value != null && Number.isFinite(value)) scored.push({ row, value });
  }
  if (scored.length === 0) return null;

  scored.sort((a, b) => (lowerWins(metric) ? a.value - b.value : b.value - a.value));
  const best = scored[0];
  /* §5a A CLEAR LEADER. A shared best figure — by two members OR by two rounds —
     takes the card out of the rotation entirely. */
  if (scored.length > 1 && scored[1].value === best.value) return null;

  const runnerUp = scored[1]?.value ?? null;
  const margin = runnerUp == null ? null : Math.abs(runnerUp - best.value);

  let context: HeroContext;
  if (metric === 'vsHandicap' && best.row.hcp_at_time != null && best.row.gross != null) {
    context = {
      rule: 'offGross',
      hcp: best.row.hcp_at_time,
      gross: best.row.gross,
      ...shape,
    };
  } else if (margin != null && margin > 0) {
    context = { rule: 'clear', margin, runnerUp, ...shape };
  } else {
    context = { rule: 'pool', ...shape };
  }

  return {
    id: `${metric}-${window}`,
    metric,
    window,
    pool,
    figure: best.value,
    member: {
      user_id: best.row.user_id,
      display_name: best.row.display_name,
      profile_photo_url: best.row.profile_photo_url,
    },
    round: best.row,
    spread: null,
    context,
  };
}

function buildAggregateCard(
  metric: HeroMetric,
  window: HeroWindow,
  rows: readonly CircleRoundRow[],
  pool: HeroPool,
  shape: { poolRounds: number; poolMembers: number },
): HeroCard | null {
  interface Tally {
    row: CircleRoundRow;
    figure: number;
    rounds: number;
    courses: Set<string>;
  }
  const byMember = new Map<string, Tally>();

  for (const row of rows) {
    const key = row.user_id;
    const tally =
      byMember.get(key) ??
      ({ row, figure: 0, rounds: 0, courses: new Set<string>() } as Tally);
    tally.rounds += 1;
    /* A course with no catalogue id still counts ONCE by its name; a round with
       neither cannot contribute to a course count and does not pretend to. */
    const courseKey = row.course_id ?? (row.course_name ? `name:${row.course_name}` : null);
    if (courseKey) tally.courses.add(courseKey);
    if (metric === 'birdies') tally.figure += row.birdies ?? 0;
    else if (metric === 'eagles') tally.figure += row.eagles ?? 0;
    byMember.set(key, tally);
  }

  const ranked = [...byMember.values()]
    .map((t) => ({
      ...t,
      figure:
        metric === 'rounds' ? t.rounds : metric === 'courses' ? t.courses.size : t.figure,
    }))
    .sort((a, b) => b.figure - a.figure);

  const best = ranked[0];
  if (!best || best.figure <= 0) return null;
  /* §5a — a tied top is a coin toss, not a hero. */
  if (ranked.length > 1 && ranked[1].figure === best.figure) return null;
  /* §5b — the figure clears its own floor. */
  const floor = FIGURE_FLOORS[metric];
  if (floor != null && best.figure < floor) return null;

  const runnerUp = ranked[1]?.figure ?? null;
  const context: HeroContext =
    runnerUp != null && runnerUp > 0
      ? { rule: 'nobody', runnerUp, margin: best.figure - runnerUp, ...shape }
      : metric === 'rounds' || metric === 'courses'
        ? { rule: 'busiest', ...shape }
        : { rule: 'pool', ...shape };

  return {
    id: `${metric}-${window}`,
    metric,
    window,
    pool,
    figure: best.figure,
    member: {
      user_id: best.row.user_id,
      display_name: best.row.display_name,
      profile_photo_url: best.row.profile_photo_url,
    },
    round: null,
    spread: { rounds: best.rounds, courses: best.courses.size },
    context,
  };
}

/**
 * EVERY QUALIFYING CARD, in a stable order (metric family then window). The
 * caller picks one; the COUNT is instrumented (§10) because it is the only way
 * to learn later whether the rotation was genuinely varied.
 */
export function buildHeroCards({
  rows,
  netByScore,
  pool,
  now = Date.now(),
}: {
  rows: readonly CircleRoundRow[];
  netByScore: ReadonlyMap<string, { net: number }>;
  pool: HeroPool;
  now?: number;
}): HeroCard[] {
  const out: HeroCard[] = [];
  for (const window of HERO_WINDOWS) {
    const windowRows = inWindow(rows, window, now);
    const shape = poolShape(windowRows);
    if (!poolIsReal(shape)) continue;
    for (const metric of SINGLE_ROUND_METRICS) {
      const card = buildSingleRoundCard(metric, window, windowRows, netByScore, pool, shape);
      if (card) out.push(card);
    }
    for (const metric of AGGREGATE_METRICS) {
      const card = buildAggregateCard(metric, window, windowRows, pool, shape);
      if (card) out.push(card);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ §6 ----
 * ROTATION IS PER SESSION, NOT PER MOUNT. A member who taps a card into the
 * scorecard and comes back must be handed the card they were reading — the tap
 * cannot be allowed to move the thing underneath it.
 *
 * SESSION, KEYED CLEANLY: sessionStorage holds this session's chosen card id,
 * localStorage holds the PREVIOUS session's, so the choice rule can exclude it.
 * Day-keying was the brief's fallback and is not needed.
 */
export const HERO_PICK_SESSION_KEY = 'clbhouz.amateur.hero.pick.v1';
export const HERO_PICK_LAST_KEY = 'clbhouz.amateur.hero.last.v1';

const read = (store: Storage | undefined, key: string): string | null => {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
};
const write = (store: Storage | undefined, key: string, value: string) => {
  try {
    store?.setItem(key, value);
  } catch {
    /* Private mode. The hero still renders; it simply re-draws next mount. */
  }
};

/**
 * Pick this session's card. Held for the session; NEVER the same card twice in a
 * row for that member across sessions (§6 choice rule).
 */
export function pickSessionCard(cards: readonly HeroCard[]): HeroCard | null {
  if (cards.length === 0) return null;
  const session = typeof window === 'undefined' ? undefined : window.sessionStorage;
  const local = typeof window === 'undefined' ? undefined : window.localStorage;

  const held = read(session, HERO_PICK_SESSION_KEY);
  const heldCard = held ? cards.find((c) => c.id === held) : undefined;
  if (heldCard) return heldCard;

  const last = read(local, HERO_PICK_LAST_KEY);
  const eligible = cards.length > 1 ? cards.filter((c) => c.id !== last) : cards;
  const pool = eligible.length > 0 ? eligible : cards;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  write(session, HERO_PICK_SESSION_KEY, chosen.id);
  write(local, HERO_PICK_LAST_KEY, chosen.id);
  return chosen;
}
