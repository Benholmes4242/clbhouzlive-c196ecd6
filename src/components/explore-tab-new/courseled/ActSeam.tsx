import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * THE SEAM (BRIEF_DISCOVER_ABSORBS_COMMUNITY §4) — where the scope pills' authority ends.
 *
 * IT IS NOT A SECTION HEADER. No icon, no aside, no see-all, no tap target. Its
 * only job is to say the rules changed: everything above it is filtered by the
 * scope pills and bounded to this week; everything below it is all-time and from
 * everyone.
 *
 * A BARE RULE WAS NOT ENOUGH, and the stop condition in §4 is the reason this
 * component exists at all rather than an inline <hr>: a single hairline with a
 * faint centred label on a dark canvas reads as an ad separator, or as a section
 * that failed to load. Two things fix it without turning it into a heading —
 *   the label is INK, not faint, because a chapter break has to be legible;
 *   the rules FADE OUT toward the page edges, which no ad separator does and no
 *   failed section does either.
 * The 8px / 0.18em geometry the brief specified is kept exactly.
 */

/** More air than the 28px section rhythm: this is a chapter break. */
export const SEAM_SPACE_ABOVE = 16;
export const SEAM_SPACE_BELOW = 12;

export function ActSeam({ label }: { label: string }) {
  const rule = (dir: 'left' | 'right') => (
    <span
      aria-hidden
      style={{
        flex: 1,
        height: 1,
        background:
          dir === 'left'
            ? `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${A.BORDER} 100%)`
            : `linear-gradient(90deg, ${A.BORDER} 0%, rgba(255,255,255,0) 100%)`,
      }}
    />
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: SEAM_SPACE_ABOVE,
        marginBottom: SEAM_SPACE_BELOW,
      }}
    >
      {rule('left')}
      <span
        style={{
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: A.INK,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {rule('right')}
    </div>
  );
}

export default ActSeam;
