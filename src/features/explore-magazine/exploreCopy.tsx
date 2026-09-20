import type { StreamItem } from './streamItem';
import { indefiniteArticleForScore, standingOrdinal } from './ordinal';
import { topRoundFeats, type ExploreRoundFeat } from './roundFeatCollection';

/**
 * KICKER PARTS AND HEADLINES (BRIEF_EXPLORE_MAGAZINE §4c / §4d).
 *
 * SECOND PERSON IS CORRECT ON THIS PAGE. The person-neutral rule from Personal
 * Bests governs strings that render on OTHER members' cards. A consequence
 * headline is addressed to the viewer by definition ("your 71"), so "your" is
 * right here and "their" would be wrong. Do not "fix" it.
 *
 * A kicker separates its scope from its course structurally. The card decides
 * whether those fields occupy one or two lines; copy never inserts punctuation
 * between them. The one non-ASCII character composed in code is U+2212, the
 * true minus, for a to-par figure.
 */

type T = {
  (key: string, fallback?: string, vars?: Record<string, unknown>): string;
  (key: string, options: Record<string, unknown>): string;
};

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
export interface KickerParts {
  scope: string | null;
  course: string | null;
}

export function kickerParts(item: StreamItem, t: T): KickerParts {
  const course = item.subject?.course_name?.trim() || null;
  const withCourse = (scope: string | null): KickerParts => ({ scope, course });

  if (item.kind === 'round' && item.who?.is_viewer) {
    return withCourse(t('amateur.stream.kicker.ownRound', 'Your round'));
  }
  if (item.facts.is_course_record) {
    // The headline owns the event. The kicker keeps only the course so the
    // adjacent lines never repeat "course record" or sacrifice its name.
    return withCourse(null);
  }
  if (item.consequence?.kind === 'review_on_list' || item.consequence?.kind === 'list_new_low' || item.consequence?.kind === 'list_first') {
    return withCourse(t('amateur.stream.kicker.onYourList', 'On your list'));
  }
  /* NO "AT YOUR CLUB" PREFIX. The club's own name follows it and a member knows
     their own club, so the prefix states what the name already says — the same
     reasoning that removed "COURSE RECORD". The other ring prefixes STAY: a
     course name alone does not say why the card reached you. */
  if (item.ring === 'club') return withCourse(null);

  if (item.ring === 'county' && item.subject?.region) {
    return withCourse(t('amateur.stream.kicker.aroundRegion', '{{region}}', { region: item.subject.region }));
  }
  /* PHASE C §3d — the country ring wears its NATION, which is the sub_country
     the shared resolver matched on, never the macro area. */
  if (item.ring === 'country' && item.subject?.sub_country) {
    return withCourse(
      t('amateur.stream.kicker.aroundCountry', '{{country}}', { country: item.subject.sub_country }),
    );
  }
  if (item.ring === 'world') return withCourse(t('amateur.stream.kicker.aroundWorld', 'World'));
  if (item.lane === 'backlog' && item.facts.play_date) {
    const month = new Date(item.facts.play_date).toLocaleDateString(undefined, { month: 'long' });
    return withCourse(t('amateur.stream.kicker.backlog', 'From {{month}}', { month }));
  }
  switch (item.kind) {
    /* NO "REVIEW ·" PREFIX (BRIEF_EXPLORE_TWO_SHAPES §3). Text on the photograph
       plus a rating chip already say this is a review, so the prefix spent the
       kicker's one line restating the shape. The kicker is the COURSE NAME. The
       ring prefixes stay: a course name alone does not say why the card reached
       you. amateur.stream.kicker.review is retired. */
    case 'story':
      return { scope: t('amateur.stream.kicker.news', 'News'), course: null };
    case 'clip':
      return { scope: t('amateur.stream.kicker.clip', 'Clip'), course: null };
    case 'watch':
      return { scope: t('amateur.stream.kicker.watch', 'Longer watch'), course: null };
    case 'moment':
      return withCourse(t('amateur.stream.kicker.moment', 'From the community'));
    case 'course':
      return withCourse(t('amateur.stream.kicker.course', 'Course'));
    default:
      return withCourse(null);
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
  /* BASE LANGUAGE, NOT THE FULL TAG — the same fault the ordinal helper carried:
     "en-GB" is English and must speak the figure. en-XA is not English. */
  const tag = locale.toLowerCase();
  if (tag.split('-')[0] !== 'en' || tag.startsWith('en-xa')) return String(value);
  return EN_NUMBER_WORDS[value] ?? String(value);
}

/**
 * SENTENCE CASE FOR A WORD THAT OPENS A SENTENCE (BRIEF_EXPLORE_SECOND_PASS §4a).
 *
 * Applied ONLY to a spoken number or another interpolated WORD that lands first
 * in a template — "six birdies" becomes "Six birdies". It is NEVER applied to a
 * player name: a username carries its own casing and "danny.akers1" must never
 * become "Danny.akers1", which is why this helper is called at the one call site
 * that interpolates a number word and nowhere near {{player}}.
 */
export function capitaliseFirst(value: string): string {
  return value.length === 0 ? value : value[0].toLocaleUpperCase() + value.slice(1);
}


export function spokenToPar(toPar: number | null | undefined, t: T, locale: string): string | null {
  if (toPar == null || !Number.isFinite(toPar)) return null;
  if (toPar === 0) return t('amateur.stream.topar.level', 'level par');
  const n = spokenNumber(Math.abs(toPar), locale);
  return toPar < 0
    ? t('amateur.stream.topar.under', '{{n}} under par', { n })
    : t('amateur.stream.topar.over', '{{n}} over par', { n });
}

/** The hole a single notable score happened on, read from the round's own hole
 *  rows. NEVER guessed: without hole detail the sentence drops the hole rather
 *  than naming one. */
function holeFor(holes: HoleRow[] | undefined, kind: 'ace' | 'albatross' | 'eagle'): number | null {
  if (!holes || holes.length === 0) return null;
  const hits: number[] = [];
  for (const h of holes) {
    if (h.strokes == null) continue;
    if (kind === 'ace') {
      if (h.strokes === 1) hits.push(h.holeNo);
      continue;
    }
    if (h.par == null) continue;
    const diff = h.strokes - h.par;
    if (kind === 'albatross' && diff === -3) hits.push(h.holeNo);
    if (kind === 'eagle' && diff === -2) hits.push(h.holeNo);
  }
  return hits.length === 1 ? hits[0] : null;
}

function featPhrase(feat: ExploreRoundFeat, t: T, locale: string): string {
  const spokenCount = spokenNumber(feat.count, locale);
  switch (feat.kind) {
    case 'ace':
      return t('amateur.stream.headline.featAce', { count: feat.count, spokenCount, defaultValue_one: 'a hole in one', defaultValue_other: '{{spokenCount}} holes in one' });
    case 'albatross':
      return t('amateur.stream.headline.featAlbatross', { count: feat.count, spokenCount, defaultValue_one: 'an albatross', defaultValue_other: '{{spokenCount}} albatrosses' });
    case 'eagle':
      return t('amateur.stream.headline.featEagle', { count: feat.count, spokenCount, defaultValue_one: 'an eagle', defaultValue_other: '{{spokenCount}} eagles' });
    case 'birdies':
      return t('amateur.stream.headline.featBirdies', { count: feat.count, spokenCount, defaultValue_one: '{{spokenCount}} birdie', defaultValue_other: '{{spokenCount}} birdies' });
    case 'clean':
      return t('amateur.stream.headline.featClean', { count: 1, spokenCount: 'one', defaultValue_one: 'a bogey-free card', defaultValue_other: 'bogey-free cards' });
  }
}

function joinedFeatPhrase(feats: ExploreRoundFeat[], t: T, locale: string): string {
  const phrases = feats.map((feat) => featPhrase(feat, t, locale));
  const joined = phrases.length > 1
    ? t('amateur.stream.headline.featJoin', '{{first}} and {{second}}', { first: phrases[0], second: phrases[1] })
    : phrases[0] ?? '';
  return capitaliseFirst(joined);
}

interface HoleRow { holeNo: number; par: number | null; strokes: number | null }

export interface HeadlineContext {
  /** The round's played holes, so a single notable score can name its hole. */
  holes?: HoleRow[];
  /** The viewer's own best gross at this course, read from their own rounds. */
  viewerBest?: number | null;
  /** Month the viewer's best was set, e.g. "June 2025". */
  viewerBestSince?: string | null;
  /**
   * A CALLOUT IS RENDERING, so the headline STATES THE ROUND and not the
   * achievement (BRIEF_EXPLORE_TWO_SHAPES §6). "took the course record with a
   * 69" becomes a Course record panel plus "Danny Robinson shot a 69, two
   * under." Two statements of one fact is the fault this removes. Reviews are
   * untouched.
   */
  plainRound?: boolean;
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
  /* §1 GOLF LANGUAGE: "shot a 75", never "went round in 75". The article follows
     the SPOKEN score from the one shared helper, so "an 88" and "a 75" can never
     disagree between two sentences. */
  const article = gross != null ? indefiniteArticleForScore(gross) : 'a';
  const player = isOwn
    ? t('amateur.stream.you', 'You')
    : item.who?.display_name?.trim() || t('amateur.stream.aMember', 'A member');

  /* §6 THE CALLOUT OWNS THE ACHIEVEMENT. When one renders, this states the round
     and stops: no record sentence, no feat sentence, no rank sentence. The plain
     forms below are the SAME two templates the ordinary round already uses. */
  if (ctx.plainRound && gross != null) {
    return topar
      ? t('amateur.stream.headline.roundToPar', '{{player}} shot {{article}} {{gross}}, {{topar}}.', {
          player,
          article,
          gross,
          topar,
        })
      : t('amateur.stream.headline.round', '{{player}} shot {{article}} {{gross}}.', { player, article, gross });
  }



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
        '{{player}} shot {{article}} {{gross}}. You are now {{ord}} of {{of}} here, down {{n}}.',
        { player, article, gross, ord, of: c.of, n: c.delta },
      );
    }
    return t(
      'amateur.stream.headline.rankDown',
      '{{player}} shot {{article}} {{gross}}. You are now {{ord}} of {{of}} here.',
      { player, article, gross, ord, of: c.of },
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
     exists to avoid.

     EVERY FEAT SENTENCE CARRIES THE TO-PAR (BRIEF_EXPLORE_SECOND_PASS §4b). A
     gross alone is arbitrary — the same rule the record sentences already follow
     — so where the round's to-par is known the feat states it, in the SPOKEN
     form from spokenToPar, never the symbolic +2 the chip already wears. Where
     the to-par is unknown the shorter sentence stands rather than a sentence
     with a hole in it. */
  const roundFeats = topRoundFeats(item.facts);
  const needsCountedSentence = roundFeats.length > 1 || (roundFeats[0]?.count ?? 0) > 1;
  if (needsCountedSentence) {
    const feats = joinedFeatPhrase(roundFeats, t, locale);
    if (gross != null) {
      return topar
        ? t('amateur.stream.headline.featsRoundToPar', '{{feats}}, in a round of {{gross}}, {{topar}}.', { feats, gross, topar })
        : t('amateur.stream.headline.featsRound', '{{feats}}, in a round of {{gross}}.', { feats, gross });
    }
    return t('amateur.stream.headline.featsOnly', '{{feats}}.', { feats });
  }
  if (item.facts.holes_in_one && item.facts.holes_in_one > 0) {
    const hole = holeFor(ctx.holes, 'ace');
    if (hole != null) {
      return gross != null && topar
        ? t('amateur.stream.headline.aceHoleToPar', 'A hole in one on the {{ordHole}}, in a round of {{gross}}, {{topar}}.', {
            ordHole: standingOrdinal(hole, locale),
            gross,
            topar,
          })
        : t('amateur.stream.headline.aceHole', 'A hole in one on the {{ordHole}}.', {
            ordHole: standingOrdinal(hole, locale),
          });
    }
    return gross != null && topar
      ? t('amateur.stream.headline.aceToPar', 'A hole in one, in a round of {{gross}}, {{topar}}.', { gross, topar })
      : t('amateur.stream.headline.ace', 'A hole in one.');
  }
  if (item.facts.albatrosses && item.facts.albatrosses > 0) {
    const hole = holeFor(ctx.holes, 'albatross');
    if (hole != null && gross != null) {
      return topar
        ? t(
            'amateur.stream.headline.albatrossHoleToPar',
            'An albatross on the {{ordHole}}, in a round of {{gross}}, {{topar}}.',
            { ordHole: standingOrdinal(hole, locale), gross, topar },
          )
        : t('amateur.stream.headline.albatrossHole', 'An albatross on the {{ordHole}}, in a round of {{gross}}.', {
            ordHole: standingOrdinal(hole, locale),
            gross,
          });
    }
    if (gross != null) {
      return topar
        ? t('amateur.stream.headline.albatrossRoundToPar', 'An albatross, in a round of {{gross}}, {{topar}}.', {
            gross,
            topar,
          })
        : t('amateur.stream.headline.albatrossRound', 'An albatross, in a round of {{gross}}.', { gross });
    }
    return t('amateur.stream.headline.albatross', 'An albatross.');
  }
  if (item.facts.eagles && item.facts.eagles > 0 && gross != null) {
    const hole = holeFor(ctx.holes, 'eagle');
    if (hole != null) {
      return topar
        ? t('amateur.stream.headline.eagleHoleToPar', 'An eagle on the {{ordHole}}, in a round of {{gross}}, {{topar}}.', {
            ordHole: standingOrdinal(hole, locale),
            gross,
            topar,
          })
        : t('amateur.stream.headline.eagleHole', 'An eagle on the {{ordHole}}, in a round of {{gross}}.', {
            ordHole: standingOrdinal(hole, locale),
            gross,
          });
    }
    return topar
      ? t('amateur.stream.headline.eagleToPar', 'An eagle, in a round of {{gross}}, {{topar}}.', { gross, topar })
      : t('amateur.stream.headline.eagle', 'An eagle, in a round of {{gross}}.', { gross });
  }
  if ((c?.kind === 'list_new_low' || c?.kind === 'list_first') && gross != null) {
    return t(
      'amateur.stream.headline.listFirst',
      '{{player}} shot {{article}} {{gross}} \u2014 the lowest anyone has played here.',
      { player, article, gross },
    );
  }
  if (item.facts.clean_card && gross != null) {
    return t('amateur.stream.headline.bogeyFree', 'Not a single bogey, in a round of {{gross}}.', { gross });
  }
  if (item.facts.birdies != null && item.facts.birdies >= 5 && gross != null) {
    /* THE ONE TEMPLATE WHOSE FIRST WORD IS INTERPOLATED (§4a). The spoken number
       opens the sentence, so it is capitalised HERE — the template cannot do it
       and no player name is ever passed through this helper. */
    const count = capitaliseFirst(spokenNumber(item.facts.birdies, locale));
    return topar
      ? t('amateur.stream.headline.birdieHaulToPar', '{{count}} birdies in a round of {{gross}}, {{topar}}.', {
          count,
          gross,
          topar,
        })
      : t('amateur.stream.headline.birdieHaul', '{{count}} birdies in a round of {{gross}}.', { count, gross });
  }

  /* THE VIEWER'S OWN ROUND THAT MOVED NOTHING. No standing claim, no to-par
     restatement of the chip: "You shot a 73." and the shape says the
     rest. This is the retirement of both rank_hold and the old "unchanged"
     sentence, in one line. */
  if ((c == null || c.kind === 'played_nochange') && isOwn && gross != null) {
    return t('amateur.stream.headline.round', '{{player}} shot {{article}} {{gross}}.', { player, article, gross });
  }
  if (gross != null && topar) {
    return t('amateur.stream.headline.roundToPar', '{{player}} shot {{article}} {{gross}}, {{topar}}.', {
      player,
      article,
      gross,
      topar,
    });
  }
  if (gross != null) {
    /* DELIBERATELY THE SHORTEST LINE ON THE PAGE. The chip already says +16;
       there is genuinely nothing to add, which is not the same fault as a
       sentence missing a fact. */
    return t('amateur.stream.headline.round', '{{player}} shot {{article}} {{gross}}.', { player, article, gross });
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

/**
 * A RAIL CAPTION DATE IS A DATE, NOT AN AGE BUCKET. Unlike relativeDay, this
 * never changes from "Sun" to "Sun 6 Sep" at an arbitrary seven-day boundary,
 * so adjacent tiles in one chronological rail use one consistent grammar.
 * Browser locale supplies the six supported locale forms without new copy.
 */
export function railCaptionDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return then.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(then.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' as const } : null),
  });
}
