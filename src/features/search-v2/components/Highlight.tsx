/**
 * RECORDED EXCEPTION (BRIEF_SEARCH_OVERLAY_ALIGNMENT §6): amber here means
 * "this is why this result matched", not "the viewing member". Kept
 * deliberately - highlighting is a strong convention and the overlay has no
 * "you" context to confuse it with. Do not "fix" this to AMBER_DEEP or ink.
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
