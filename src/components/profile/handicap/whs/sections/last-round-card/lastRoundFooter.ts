const MINUS = '\u2212';

export interface FooterCopyInput {
  gross: number | null;
  par: number | null;
  courseHandicap: number | null;
  handicapDelta: number | null;
  handicapIndexAtTime: number | null;
  isCounter: boolean;
}

export interface FooterCopy {
  eyebrow: 'VS EXPECTED';
  /** e.g. "+7 over" — null when not derivable yet */
  primary: string | null;
  /** Plain prefix before the accent, e.g. "index " */
  beforeAccent: string;
  /** Amber-highlighted segment, e.g. "holds at 1.8" */
  accent: string;
}

export function buildLastRoundFooter(input: FooterCopyInput): FooterCopy | null {
  const { gross, par, courseHandicap, handicapDelta, handicapIndexAtTime, isCounter } = input;

  // Primary "+N over"
  let primary: string | null = null;
  if (gross != null && par != null && courseHandicap != null) {
    const delta = gross - (par + courseHandicap);
    if (delta === 0) primary = 'level expected';
    else if (delta > 0) primary = `+${delta} over`;
    else primary = `${MINUS}${Math.abs(delta)} under`;
  }

  // Secondary "index ..."
  let beforeAccent = '';
  let accent = '';
  if (!isCounter) {
    accent = 'no effect on index';
  } else if (handicapIndexAtTime == null) {
    if (primary == null) return null;
    return { eyebrow: 'VS EXPECTED', primary, beforeAccent: '', accent: '' };
  } else {
    const idxStr = handicapIndexAtTime.toFixed(1);
    beforeAccent = 'index ';
    if (handicapDelta == null || Math.abs(handicapDelta) < 0.05) {
      accent = `holds at ${idxStr}`;
    } else if (handicapDelta < 0) {
      accent = `drops to ${idxStr}`;
    } else {
      accent = `climbs to ${idxStr}`;
    }
  }

  return { eyebrow: 'VS EXPECTED', primary, beforeAccent, accent };
}
