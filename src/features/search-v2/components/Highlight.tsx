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
