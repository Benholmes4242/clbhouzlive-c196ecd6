import type { TFunction } from 'i18next';

import type { HeroCard, HeroContext, HeroMetric, HeroWindow } from './heroCards';

/**
 * THE HERO'S WORDS (BRIEF_EXPLORE_ROTATING_HERO §3, §4).
 *
 * EVERY STRING IS A KEY WITH NUMBERS PASSED IN — the context line is generated
 * from the data, never assembled from fragments of English, so the six locales
 * all get a sentence instead of a template with a hole in it.
 *
 * THE POOL IS ALWAYS NAMED (ruling, 10 Sep 2026). A member with a two-person
 * circle can be shown a card about somebody they do not follow, because the
 * ladder widened to everyone for that window. Without the pool clause the hero
 * looks like it picked a stranger for no reason, so the clause is not optional
 * and is not conditional on the rule: it is appended to whatever the rule said.
 */

const METRIC_KEY: Record<HeroMetric, string> = {
  gross: 'lowestGross',
  net: 'lowestNet',
  stableford: 'bestStableford',
  vsHandicap: 'vsHandicap',
  birdies: 'mostBirdies',
  eagles: 'mostEagles',
  rounds: 'mostRounds',
  courses: 'mostCourses',
};

const METRIC_FALLBACK: Record<HeroMetric, string> = {
  gross: 'LOWEST GROSS',
  net: 'LOWEST NET',
  stableford: 'BEST STABLEFORD',
  vsHandicap: 'BEST VS HANDICAP',
  birdies: 'MOST BIRDIES',
  eagles: 'MOST EAGLES',
  rounds: 'MOST ROUNDS',
  courses: 'MOST COURSES',
};

const WINDOW_FALLBACK: Record<HeroWindow, string> = {
  14: '14 DAYS',
  30: '30 DAYS',
  90: '90 DAYS',
};

const SPAN_FALLBACK: Record<HeroWindow, string> = {
  14: 'this fortnight',
  30: 'this month',
  90: 'this quarter',
};

const SPAN_NOUN_FALLBACK: Record<HeroWindow, string> = {
  14: 'fortnight',
  30: 'month',
  90: 'quarter',
};

/** §3 THE KICKER ALWAYS NAMES THE WINDOW (§7) — "LOWEST GROSS . 14 DAYS". */
export function heroKicker(t: TFunction, metric: HeroMetric, window: HeroWindow): string {
  const metricLabel = t(`amateur.hero.metric.${METRIC_KEY[metric]}`, METRIC_FALLBACK[metric]);
  const windowLabel = t(`amateur.hero.window.d${window}`, WINDOW_FALLBACK[window]);
  return `${metricLabel} / ${windowLabel}`;
}

/**
 * The unit under the figure. NULL means the figure carries its own unit — the
 * to-par beneath a gross, which is drawn in the true-minus red by the caller and
 * is not a word.
 */
export function heroUnit(t: TFunction, metric: HeroMetric): string | null {
  switch (metric) {
    case 'gross':
      return null;
    case 'net':
      return t('amateur.hero.unit.net', 'net');
    case 'stableford':
      return t('amateur.hero.unit.points', 'points');
    case 'vsHandicap':
      return t('amateur.hero.unit.underPar', 'under par');
    case 'birdies':
      return t('amateur.hero.unit.birdies', 'birdies');
    case 'eagles':
      return t('amateur.hero.unit.eagles', 'eagles');
    case 'rounds':
      return t('amateur.hero.unit.rounds', 'rounds');
    case 'courses':
      return t('amateur.hero.unit.courses', 'courses');
    default:
      return null;
  }
}

/** The pool clause. Long form when it stands alone, short when a rule precedes it. */
function poolClause(t: TFunction, ctx: HeroContext, window: HeroWindow, alone: boolean): string {
  const span = t(`amateur.hero.span.d${window}`, SPAN_FALLBACK[window]);
  if (ctx.pool === 'circle') {
    return alone
      ? t('amateur.hero.context.poolCircleLong', 'Best of {{rounds}} rounds in your circle {{span}}.', {
          rounds: ctx.poolRounds,
          span,
        })
      : t('amateur.hero.context.poolCircleShort', 'Best of {{rounds}} in your circle.', {
          rounds: ctx.poolRounds,
        });
  }
  return alone
    ? t('amateur.hero.context.poolEveryoneLong', 'Best of {{rounds}} rounds across clbhouz {{span}}.', {
        rounds: ctx.poolRounds,
        span,
      })
    : t('amateur.hero.context.poolEveryoneShort', 'Best of {{rounds}} across clbhouz.', {
        rounds: ctx.poolRounds,
      });
}

/** §4 THE CONTEXT LINE. A rule sentence where there is one, then the pool. */
export function heroContextLine(t: TFunction, card: HeroCard): string {
  const ctx = card.context;
  let rule: string | null = null;
  if (ctx.rule === 'clear' && ctx.margin != null) {
    rule = t('amateur.hero.context.clear', '{{margin}} clear of the next best.', {
      margin: ctx.margin,
    });
  } else if (ctx.rule === 'offGross' && ctx.hcp != null && ctx.gross != null) {
    rule = t('amateur.hero.context.offGross', 'Off {{hcp}}, gross {{gross}}.', {
      hcp: ctx.hcp,
      gross: ctx.gross,
    });
  } else if (ctx.rule === 'nobody' && ctx.runnerUp != null) {
    rule = t('amateur.hero.context.nobody', 'Nobody else made more than {{runnerUp}}.', {
      runnerUp: ctx.runnerUp,
    });
  } else if (ctx.rule === 'busiest') {
    rule =
      ctx.pool === 'circle'
        ? t('amateur.hero.context.busiestCircle', 'The busiest {{span}} in your circle.', {
            span: t(`amateur.hero.spanNoun.d${card.window}`, SPAN_NOUN_FALLBACK[card.window]),
          })
        : null;
  }

  const pool = poolClause(t, ctx, card.window, rule == null);
  return rule == null ? pool : `${rule} ${pool}`;
}

/**
 * §2.2 THE SPREAD, AGGREGATE CARDS ONLY. An aggregate figure is made of many
 * rounds, so the line under the name says how many rounds and how many courses
 * it took — the shape band cannot stand in for it, because there is no single
 * scorecard to draw.
 *
 * A COUNT OF ONE IS STILL SAID PROPERLY: i18next plurals do the singular, so the
 * line never reads "1 rounds". Returns null when there is no spread to state,
 * which only happens on a single-round card.
 */
export function heroSpreadLine(t: TFunction, card: HeroCard): string | null {
  if (!card.spread) return null;
  const rounds = t('amateur.hero.spread.rounds', '{{count}} rounds', { count: card.spread.rounds });
  /* A ROUND WITH NEITHER A COURSE ID NOR A NAME COUNTS TOWARDS NO COURSE, so the
     course clause is dropped rather than printed as a zero. */
  if (card.spread.courses <= 0) {
    return t('amateur.hero.spread.roundsOnly', 'Across {{rounds}}.', { rounds });
  }
  const courses = t('amateur.hero.spread.courses', '{{count}} courses', {
    count: card.spread.courses,
  });
  return t('amateur.hero.spread.both', 'Across {{rounds}}, {{courses}}.', { rounds, courses });
}
