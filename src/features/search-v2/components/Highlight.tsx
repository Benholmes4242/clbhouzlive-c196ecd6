/**
 * RECORDED EXCEPTION (BRIEF_SEARCH_OVERLAY_ALIGNMENT §6, re-affirmed by
 * BRIEF_SEARCH_OVERLAY_DARK §5): amber here means
 * "this is why this result matched", not "the viewing member". Kept
 * deliberately - highlighting is a strong convention and the overlay has no
 * "you" context to confuse it with. Do not "fix" this to AMBER_DEEP or ink.
 *
 * TWO MEANINGS, ONE HUE, DELIBERATELY. App-wide, amber marks the VIEWING
 * MEMBER. In search it marks the MATCHED SUBSTRING. That is accepted because a
 * search highlight is a transient reading aid, not an identity marker: it
 * appears only while a query is live, only inside the overlay, and it is
 * bounded to the characters typed. Amber on the dark ground stays legible, so
 * no tonal variant is needed. Known collision: a PersonRow for the viewing
 * member would carry both meanings at once — search rows deliberately do not
 * paint a "you" marker, so within this overlay amber has exactly one job.
 */
const AMBER = '#F7931E';

export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: AMBER, fontWeight: 700 }}>
        {text.slice(idx, idx + needle.length)}
      </span>
      {text.slice(idx + needle.length)}
    </>
  );
}
