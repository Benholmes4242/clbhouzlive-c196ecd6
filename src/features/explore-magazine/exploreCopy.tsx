import type { StreamItem } from './streamItem';

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
    return withCourse(t('amateur.stream.kicker.courseRecord', 'Course record'));
  }
  if (item.consequence?.kind === 'review_on_list' || item.consequence?.kind === 'list_new_low' || item.consequence?.kind === 'list_first') {
    return withCourse(t('amateur.stream.kicker.onYourList', 'On your list'));
  }
  if (item.ring === 'club') return withCourse(t('amateur.stream.kicker.atYourClub', 'At your club'));
  if (item.ring === 'county' && item.subject?.region) {
    return withCourse(t('amateur.stream.kicker.aroundRegion', 'Around {{region}}', { region: item.subject.region }));
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
 * THE HEADLINE. Composed here from typed fields, never returned as prose by a
 * query, so six locales stay honest.
 *
 * PHASE A CANNOT SAY "your 71 is now six behind": the viewer's own best at
 * another member's course is Phase B's get_viewer_standing. So a record card
 * states the fact and stops rather than inventing the gap.
 */
export function headlineFor(item: StreamItem, t: T): string {
  const name = item.who?.is_viewer
    ? t('amateur.stream.you', 'You')
    : item.who?.display_name?.trim() || t('amateur.stream.aMember', 'A member');
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
  const toPar = toParLabel(item.facts.to_par);
  const c = item.consequence;

  /**
   * THE CONSEQUENCE HEADLINES (§3d, PHASE B2). Every figure in these sentences
   * was READ, not derived: n and of come from get_viewer_standing, where `of` is
   * the matched field the Champions tab shows, and the record fact comes from
   * the record book. A kind whose figures are missing falls through to the plain
   * round sentence rather than printing a sentence with a hole in it.
   */
  if (c?.kind === 'record_lost' && gross != null) {
    if (c.delta != null && c.delta > 0) {
      return t(
        'amateur.stream.headline.recordLostGap',
        '{{name}} took your course record at {{course}} with a {{gross}}, {{delta}} better than your best.',
        { name, course, gross, delta: c.delta },
      );
    }
    return t('amateur.stream.headline.recordLost', '{{name}} took your course record at {{course}} with a {{gross}}.', {
      name,
      course,
      gross,
    });
  }
  if (c?.kind === 'rank_down' && c.n != null && c.of != null && gross != null) {
    if (c.delta != null && c.delta > 0) {
      return t(
        'amateur.stream.headline.rankDownBy',
        '{{name}} went round {{course}} in {{gross}} and pushed you down {{delta}} to {{n}} of {{of}}.',
        { name, course, gross, delta: c.delta, n: c.n, of: c.of },
      );
    }
    return t(
      'amateur.stream.headline.rankDown',
      '{{name}} went round {{course}} in {{gross}}. You are {{n}} of {{of}} there.',
      { name, course, gross, n: c.n, of: c.of },
    );
  }
  if (c?.kind === 'rank_up' && c.n != null && c.of != null && gross != null) {
    if (c.delta != null && c.delta > 0) {
      return t(
        'amateur.stream.headline.rankUpBy',
        'Your {{gross}} at {{course}} moves you up {{delta}} to {{n}} of {{of}}.',
        { course, gross, delta: c.delta, n: c.n, of: c.of },
      );
    }
    return t('amateur.stream.headline.rankUp', 'Your {{gross}} at {{course}} takes you to {{n}} of {{of}}.', {
      course,
      gross,
      n: c.n,
      of: c.of,
    });
  }
  if (c?.kind === 'rank_hold' && c.n != null && c.of != null && gross != null) {
    return t('amateur.stream.headline.rankHold', 'Your {{gross}} at {{course}} holds {{n}} of {{of}}.', {
      course,
      gross,
      n: c.n,
      of: c.of,
    });
  }

  if ((item.facts.is_course_record || c?.kind === 'record_taken') && gross != null) {
    return t('amateur.stream.headline.recordTaken', '{{name}} took the course record at {{course}} with a {{gross}}.', {
      name,
      course,
      gross,
    });
  }

  if (item.facts.holes_in_one && item.facts.holes_in_one > 0) {
    return t('amateur.stream.headline.ace', '{{name}} holed out from the tee at {{course}}.', { name, course });
  }
  if (item.facts.albatrosses && item.facts.albatrosses > 0) {
    return t('amateur.stream.headline.albatross', '{{name}} made an albatross at {{course}}.', { name, course });
  }
  if (c?.kind === 'list_new_low' && gross != null) {
    return t('amateur.stream.headline.listNewLow', '{{gross}} at {{course}}, a course on your list.', { gross, course });
  }
  if (item.facts.clean_card && gross != null) {
    return t('amateur.stream.headline.bogeyFree', '{{name}} went bogey free at {{course}} for {{gross}}.', {
      name,
      course,
      gross,
    });
  }
  if (item.facts.birdies != null && item.facts.birdies >= 5 && gross != null) {
    return t('amateur.stream.headline.birdieHaul', '{{name}} made {{count}} birdies at {{course}}.', {
      name,
      course,
      count: item.facts.birdies,
    });
  }
  if (gross != null && toPar) {
    return t('amateur.stream.headline.roundToPar', '{{name}} went round {{course}} in {{gross}}, {{topar}}.', {
      name,
      course,
      gross,
      topar: toPar,
    });
  }
  if (gross != null) {
    return t('amateur.stream.headline.round', '{{name}} went round {{course}} in {{gross}}.', { name, course, gross });
  }
  return t('amateur.stream.headline.played', '{{name}} played {{course}}.', { name, course });
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
