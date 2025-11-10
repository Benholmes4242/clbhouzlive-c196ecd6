import React from 'react';

export function tokenizeQuery(q: string): string[] {
  if (!q) return [];
  // supports quoted phrases: "risk profile"
  const tokens: string[] = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(q)) !== null) {
    tokens.push((m[1] || m[2]).trim());
  }
  return tokens.filter(Boolean);
}

export function highlight(text: string, query: string): React.ReactNode {
  if (!text || !query) return text;
  const tokens = tokenizeQuery(query)
    .map(t => t.toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return text;

  // Build a combined regex with word-ish boundaries where possible
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = tokens.map(esc).join('|');
  const re = new RegExp(`(${pattern})`, 'ig');

  const parts = text.split(re);
  if (parts.length === 1) return text;

  let hits = 0;
  const nodes = parts.map((part, i) => {
    if (!part) return null;
    const match = tokens.some(t => part.toLowerCase() === t);
    if (match) {
      hits++;
      return (
        <mark key={i} className="hl" aria-hidden="true">{part}</mark>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

  return (
    <>
      {/* SR-only match count for accessibility */}
      <span aria-live="polite" className="sr-only">{hits} matches</span>
      {nodes}
    </>
  );
}

export function countMatches(text: string, query: string): number {
  const t = tokenizeQuery(query).map(s => s.toLowerCase());
  if (!text || t.length === 0) return 0;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = t.map(esc).join('|');
  const re = new RegExp(`(${pattern})`, 'ig');
  return (text.match(re) || []).length;
}
