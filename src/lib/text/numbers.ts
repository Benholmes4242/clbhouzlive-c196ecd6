/**
 * The one home for number-as-text helpers.
 *
 * `numberWord` moved here verbatim from championsFlatBits.tsx (which
 * re-exports it). `ordinal` is the implementation from youBits.tsx, verbatim.
 *
 * FOLLOW-UP, not yet done: five files still carry their own `ordinal` -
 * Top100VerdictBand, Top100VerdictExplainerSheet, CoursesPageHero, youBits,
 * friendRoundParts. Point them here rather than writing another copy.
 * `ordinalSuffix` in boardParts.tsx is a different helper and stays put.
 */

const WORDS = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve',
];

/** Sentence-leading number word, so the gap line never opens on a numeral. */
export function numberWord(n: number, capital = true): string {
  const w = n >= 0 && n < WORDS.length ? WORDS[n] : String(n);
  return capital ? w : w.toLowerCase();
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
