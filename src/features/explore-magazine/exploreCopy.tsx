import type { StreamItem } from './streamItem';
import { standingOrdinal } from './ordinal';

/**
 * KICKER PARTS AND HEADLINES (BRIEF_EXPLORE_MAGAZINE §4c / §4d).
 *
 * SECOND PERSON IS CORRECT ON THIS PAGE. The person-neutral rule from Personal
 * Bests governs strings that render on OTHER members' cards. A consequence
 * headline is addressed to the viewer by definition ("your 71"), so "your" is
 * right here and "their" would be wrong. Do not "fix" it.
 *
 * INTERPUNCTS ARE NEVER IN A STRING. A kicker is a LIST OF PARTS and the card
 * joins them in JSX with {'\u00B7'}; locale files stay ASCII. The one non-ASCII
 * character composed in code is U+2212, the true minus, for a to-par figure.
 */

type T = (key: string, fallback?: string, vars?: Record<string, unknown>) => string;

export const MINUS = '\u2212';

/** "June 2025" in the viewer's locale. Null in, null out — a headline that
 *  cannot date a fact drops the clause rather than guessing a month. */
export function monthLabel(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(when);
  } catch {
    return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(when);
  }
}

/** "-6" is a hyphen; a score under par takes the true minus. */
export function toParLabel(toPar: number | null | undefined): string | null {
  if (toPar == null || !Number.isFinite(toPar)) return null;
  if (toPar === 0) return 'E';
  if (toPar < 0) return `${MINUS}${Math.abs(toPar)}`;
  return `+${toPar}`;
}

/**
 * ONE KICKER PER CARD, chosen by the §4c precedence: ownRound > courseRecord >
 * onYourList > atYourClub > aroundRegion > aroundWorld > backlog > plain type.
 * Phase A can honestly reach ownRound, courseRecord, onYourList and the plain
 * types; the ring kickers arrive with geography in Phase C.
 */
export function kickerParts(item: StreamItem, t: T): string[] {
  const course = item.subject?.course_name?.trim() || null;
  const withCourse = (label: string) => (course ? [label, course] : [label]);

  if (item.kind === 'round' && item.who?.is_viewer) {
    return withCourse(t('amateur.stream.kicker.ownRound', 'Your round'));
  }
  if (item.facts.is_course_record) {
    // The headline owns the event. The kicker keeps only the course so the
    // adjacent lines never repeat "course record" or sacrifice its name.
    return course ? [course] : [];
  }
  if (item.consequence?.kind === 'review_on_list' || item.consequence?.kind === 'list_new_low' || item.consequence?.kind === 'list_first') {
    return withCourse(t('amateur.stream.kicker.onYourList', 'On your list'));
  }
  /* NO "AT YOUR CLUB" PREFIX. The club's own name follows it and a member knows
     their own club, so the prefix states what the name already says — the same
     reasoning that removed "COURSE RECORD". The other ring prefixes STAY: a
     course name alone does not say why the card reached you. */
  if (item.ring === 'club') return course ? [course] : [];

  if (item.ring === 'county' && item.subject?.region) {
    return withCourse(t('amateur.stream.kicker.aroundRegion', 'Around {{region}}', { region: item.subject.region }));
  }
  /* PHASE C §3d — the country ring wears its NATION, which is the sub_country
     the shared resolver matched on, never the macro area. */
  if (item.ring === 'country' && item.subject?.sub_country) {
    return withCourse(
      t('amateur.stream.kicker.aroundCountry', 'Around {{country}}', { country: item.subject.sub_country }),
    );
  }
  if (item.ring === 'world') return withCourse(t('amateur.stream.kicker.aroundWorld', 'Around the world'));
  if (item.lane === 'backlog' && item.facts.play_date) {
    const month = new Date(item.facts.play_date).toLocaleDateString(undefined, { month: 'long' });
    return withCourse(t('amateur.stream.kicker.backlog', 'From {{month}}', { month }));
  }
  switch (item.kind) {
    case 'review':
      return withCourse(t('amateur.stream.kicker.review', 'Review'));
    case 'story':
      return [t('amateur.stream.kicker.news', 'News')];
    case 'clip':
      return [t('amateur.stream.kicker.clip', 'Clip')];
    case 'watch':
      return [t('amateur.stream.kicker.watch', 'Longer watch')];
    case 'moment':
      return withCourse(t('amateur.stream.kicker.moment', 'From the community'));
    case 'course':
      return withCourse(t('amateur.stream.kicker.course', 'Course'));
    default:
      return course ? [course] : [];
  }
}

/**
 * SPOKEN TO-PAR. The chip already carries the symbolic form (+2, U+2212 3), so a
 * headline speaks it: "three under", "level par", "two over". English spells the
 * figure; every other shipped locale takes the plain number, the settled rule
 * from the ordinal helper — an invented number-word system per locale is worse
 * than a digit.
 */
const EN_NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
];

export function spokenNumber(value: number, locale: string): string {
  if (locale.toLowerCase() !== 'en') return String(value);
  return EN_NUMBER_WORDS[value] ?? String(value);
}

export function spokenToPar(toPar: number | null | undefined, t: T, locale: string): string | null {
  if (toPar == null || !Number.isFinite(toPar)) return null;
  if (toPar === 0) return t('amateur.stream.topar.level', 'level par');
  const n = spokenNumber(Math.abs(toPar), locale);
  return toPar < 0
    ? t('amateur.stream.topar.under', '{{n}} under', { n })
    : t('amateur.stream.topar.over', '{{n}} over', { n });
}

/** The hole a single notable score happened on, read from the round's own hole
 *  rows. NEVER guessed: without hole detail the sentence drops the hole rather
 *  than naming one. */
function holeFor(holes: HoleRow[] | undefined, kind: 'ace' | 'albatross' | 'eagle'): number | null {
  if (!holes || holes.length === 0) return null;
  for (const h of holes) {
    if (h.strokes == null) continue;
    if (kind === 'ace' && h.strokes === 1) return h.holeNo;
    if (h.par == null) continue;
    const diff = h.strokes - h.par;
    if (kind === 'albatross' && diff === -3) return h.holeNo;
    if (kind === 'eagle' && diff === -2) return h.holeNo;
  }
  return null;
}

interface HoleRow { holeNo: number; par: number | null; strokes: number | null }

export interface HeadlineContext {
  /** The round's played holes, so a single notable score can name its hole. */
  holes?: HoleRow[];
  /** The viewer's own best gross at this course, read from their own rounds. */
  viewerBest?: number | null;
  /** Month the viewer's best was set, e.g. "June 2025". */
  viewerBestSince?: string | null;
}

/**
 * THE HEADLINE. Composed here from typed fields, never returned as prose by a
 * query, so six locales stay honest.
 *
 * TWO RULES GOVERN EVERY SENTENCE BELOW (and the locale file repeats them):
 *  (a) NEVER REPEAT THE KICKER, THE WHO-LINE OR THE CHIP. The kicker names the
 *      course and the ring, the who-line names the player and the date, the chip
 *      carries gross and to-par. Restating any of them spends two lines on
 *      nothing.
 *  (b) A FIGURE MEANS NOTHING WITHOUT WHAT IT IS MEASURED AGAINST. "75" is
 *      arbitrary; "75, three under" is an achievement. "8 of 18" is a
 *      coordinate; "the 8th best round anyone has played here" is a fact.
 *
 * A sentence whose figures are missing falls through to a shorter honest one
 * rather than printing a sentence with a hole in it.
 */
export function headlineFor(item: StreamItem, t: T, locale = 'en', ctx: HeadlineContext = {}): string {
  const course = item.subject?.course_name?.trim() || t('amateur.stream.aCourse', 'a course');

  if (item.kind === 'story') return item.facts.headline?.trim() || '';
  if (item.kind === 'review') {
    const quote = item.facts.first_sentence?.trim();
    return quote ? `\u201C${quote}\u201D` : '';
  }
  if (item.kind === 'clip' || item.kind === 'watch') return item.facts.headline?.trim() || course;
  if (item.kind === 'moment') return course;
  if (item.kind === 'course') return item.facts.headline?.trim() || course;

  /* ROUNDS — the consequence carries the sentence. */
  const gross = item.facts.gross;
  const topar = spokenToPar(item.facts.to_par, t, locale);
  const c = item.consequence;
  const ord = c?.n != null ? standingOrdinal(c.n, locale) : null;
  const isOwn = !!item.who?.is_viewer;
  const player = isOwn
    ? t('amateur.stream.you', 'You')
    : item.who?.display_name?.trim() || t('amateur.stream.aMember', 'A member');

  if (c?.kind === 'record_lost' && gross != null) {
    const best = ctx.viewerBest ?? null;
    if (best != null && ctx.viewerBestSince) {
      return t(
        'amateur.stream.headline.recordLostSince',
        '{{player}} took your course record with a {{gross}}. Your {{best}} had stood since {{month}}.',
        { player, gross, best, month: ctx.viewerBestSince },
      );
    }
    if (best != null) {
      return t(
        'amateur.stream.headline.recordLostBest',
        '{{player}} took your course record with a {{gross}}. Your best here is {{best}}.',
        { player, gross, best },
      );
    }
    return t('amateur.stream.headline.recordLost', '{{player}} took your course record with a {{gross}}.', {
      player,
      gross,
    });
  }
  /* THE RANK SENTENCE IS ABOUT THE MOVEMENT, not about the round. The kicker
     already carries the course, so the sentence never names it; the ordinal
     comes from the shared helper, so it reads "8th" and never a bare "8". */
  if (c?.kind === 'rank_down' && c.n != null && c.of != null && gross != null) {
    if (c.delta != null && c.delta > 0) {
      return t(
        'amateur.stream.headline.rankDownMoved',
        '{{player}} went round in {{gross}}. You are now {{ord}} of {{of}} here, down {{n}}.',
        { player, gross, ord, of: c.of, n: c.delta },
      );
    }
    return t(
      'amateur.stream.headline.rankDown',
      '{{player}} went round in {{gross}}. You are now {{ord}} of {{of}} here.',
      { player, gross, ord, of: c.of },
    );
  }
  if (c?.kind === 'rank_up' && c.n != null) {
    /* RANK_UP WITHOUT THE VIEWER'S OWN ROUND names NOBODY: nothing anyone
       played caused it - a score was corrected or removed. Rare by design. */
    if (!isOwn) {
      if (c.of != null && c.delta != null && c.delta > 0) {
        return t(
          'amateur.stream.headline.rankUpOthers',
          'You are now {{ord}} of {{of}} here, up {{n}}.',
          { ord, of: c.of, n: c.delta },
        );
      }
      if (c.of != null) {
        return t('amateur.stream.headline.rankUpOthersPlain', 'You are now {{ord}} of {{of}} here.', {
          ord,
          of: c.of,
        });
      }
    }
    if (gross != null && c.delta != null && c.delta > 0) {
      return t(
        'amateur.stream.headline.rankUpBy',
        'Your {{gross}} is the {{ord}} best round played here, up {{n}} places.',
        { gross, ord, n: c.delta },
      );
    }
    if (gross != null) {
      return t('amateur.stream.headline.rankUp', 'Your {{gross}} is the {{ord}} best round played here.', {
        gross,
        ord,
      });
    }
  }

  /* rank_hold IS RETIRED. Its whole content was that NOTHING CHANGED, the same
     fault as played_nochange's "unchanged" sentence below it: a card whose news
     is the absence of news, recurring every time a settled member posts at their
     home club. An unmoved own round is STILL A CARD — photo, chip, shape, dots —
     it simply carries the plain sentence. amateur.stream.headline.rankHold and
     amateur.stream.headline.playedNoChange are retired keys, kept in all six
     locale files for the Phase E sweep. */

  if ((item.facts.is_course_record || c?.kind === 'record_taken') && gross != null) {
    if (isOwn || c?.held_by_viewer) {
      return topar
        ? t('amateur.stream.headline.recordOwnToPar', 'You took the course record with a {{gross}}, {{topar}}.', {
            gross,
            topar,
          })
        : t('amateur.stream.headline.recordOwn', 'You took the course record with a {{gross}}.', { gross });
    }
    const best = ctx.viewerBest ?? null;
    if (topar && best != null) {
      return t(
        'amateur.stream.headline.recordTakenBest',
        '{{player}} took the course record with a {{gross}}, {{topar}}. Your best here is {{best}}.',
        { player, gross, topar, best },
      );
    }
    if (topar) {
      return t(
        'amateur.stream.headline.recordTakenToPar',
        '{{player}} took the course record with a {{gross}}, {{topar}}.',
        { player, gross, topar },
      );
    }
    return t('amateur.stream.headline.recordTaken', '{{player}} took the course record with a {{gross}}.', {
      player,
      gross,
    });
  }

  /* ONE NOTABLE SCORE NAMES ITS HOLE when the round's own hole rows say which.
     THE ACE'S "their first" SENTENCE IS NOT BUILT: it needs the player's whole
     hole-in-one history, which is not on this card and cannot be read per card,
     and an invented "first" on a second ace is exactly the false claim this page
     exists to avoid. */
  if (item.facts.holes_in_one && item.facts.holes_in_one > 0) {
    const hole = holeFor(ctx.holes, 'ace');
    return hole != null
      ? t('amateur.stream.headline.aceHole', 'A hole in one on the {{ordHole}}.', {
          ordHole: standingOrdinal(hole, locale),
        })
      : t('amateur.stream.headline.ace', 'A hole in one.');
  }
  if (item.facts.albatrosses && item.facts.albatrosses > 0) {
    const hole = holeFor(ctx.holes, 'albatross');
    if (hole != null && gross != null) {
      return t('amateur.stream.headline.albatrossHole', 'An albatross on the {{ordHole}}, in a round of {{gross}}.', {
        ordHole: standingOrdinal(hole, locale),
        gross,
      });
    }
    return gross != null
      ? t('amateur.stream.headline.albatrossRound', 'An albatross, in a round of {{gross}}.', { gross })
      : t('amateur.stream.headline.albatross', 'An albatross.');
  }
  if (item.facts.eagles && item.facts.eagles > 0 && gross != null) {
    const hole = holeFor(ctx.holes, 'eagle');
    return hole != null
      ? t('amateur.stream.headline.eagleHole', 'An eagle on the {{ordHole}}, in a round of {{gross}}.', {
          ordHole: standingOrdinal(hole, locale),
          gross,
        })
      : t('amateur.stream.headline.eagle', 'An eagle, in a round of {{gross}}.', { gross });
  }
  if ((c?.kind === 'list_new_low' || c?.kind === 'list_first') && gross != null) {
    return t(
      'amateur.stream.headline.listFirst',
      '{{player}} went round in {{gross}} \u2014 the lowest anyone has played here.',
      { player, gross },
    );
  }
  if (item.facts.clean_card && gross != null) {
    return t('amateur.stream.headline.bogeyFree', 'Not a single bogey, in a round of {{gross}}.', { gross });
  }
  if (item.facts.birdies != null && item.facts.birdies >= 5 && gross != null) {
    return t('amateur.stream.headline.birdieHaul', '{{count}} birdies in a round of {{gross}}.', {
      count: spokenNumber(item.facts.birdies, locale),
      gross,
    });
  }
  if (c?.kind === 'played_nochange' && c.n != null && c.of != null && gross != null && isOwn) {
    return t(
      'amateur.stream.headline.playedNoChange',
      '{{player}} went round in {{gross}}. Your {{ord}} of {{of}} here is unchanged.',
      { player, gross, ord, of: c.of },
    );
  }
  if (gross != null && topar) {
    return t('amateur.stream.headline.roundToPar', '{{player}} went round in {{gross}}, {{topar}}.', {
      player,
      gross,
      topar,
    });
  }
  if (gross != null) {
    /* DELIBERATELY THE SHORTEST LINE ON THE PAGE. The chip already says +16;
       there is genuinely nothing to add, which is not the same fault as a
       sentence missing a fact. */
    return t('amateur.stream.headline.round', '{{player}} went round in {{gross}}.', { player, gross });
  }
  return t('amateur.stream.headline.played', 'Played.');
}

/** Relative day for the who-line's sub: "Tue" inside a week, "Sun 7 Sep" up to
 *  60 days, "Jun 2025" beyond. */
export function relativeDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 6) return then.toLocaleDateString(undefined, { weekday: 'short' });
  if (days <= 60) return then.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return then.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}
