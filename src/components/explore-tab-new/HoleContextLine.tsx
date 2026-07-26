/**
 * HoleContextLine — third line on legendary honours rows (ace / albatross).
 * Renders "17th . par 3 . 168 yds" from whatever parts exist. Built as a
 * composed list so a later part (e.g. rarity) can be appended without a
 * rewrite. Renders nothing when there is no hole number.
 */

const DEEP_AMBER = '#9A5B00';

/** Ordinal suffix for a hole number: 1st, 2nd, 3rd, 11th, 12th, 21st... */
export function ordinal(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (abs % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function holeContextParts(input: {
  hole_no?: number | null;
  hole_par?: number | null;
  hole_yards?: number | null;
}): string[] {
  const parts: string[] = [];
  if (input.hole_no == null) return parts;
  parts.push(ordinal(input.hole_no));
  if (input.hole_par != null) parts.push(`par ${input.hole_par}`);
  if (input.hole_yards != null) parts.push(`${input.hole_yards} yds`);
  return parts;
}

interface Props {
  parts: string[];
}

export function HoleContextLine({ parts }: Props) {
  if (parts.length === 0) return null;
  return (
    <div
      style={{
        marginTop: 4,
        fontSize: 11.5,
        fontWeight: 600,
        color: DEEP_AMBER,
        lineHeight: 1.2,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {parts.map((p, i) => (
        <span key={`${p}-${i}`}>
          {i > 0 ? <span style={{ margin: '0 5px' }}>{'\u00B7'}</span> : null}
          {p}
        </span>
      ))}
    </div>
  );
}

export default HoleContextLine;
