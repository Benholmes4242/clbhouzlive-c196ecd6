import React from 'react';

/**
 * Lightweight plain-text renderer for legal document bodies.
 * Supports:
 *  - Blank line -> paragraph break
 *  - Lines starting with "# " -> h2
 *  - Lines starting with "## " -> h3
 *  - Lines starting with "- " or "* " -> bulleted list
 *  - Lines starting with a number and dot (e.g. "1.") -> numbered list
 *  - Otherwise preserved with newlines respected
 */
interface Props {
  body: string;
  color?: string;
  headingColor?: string;
}

type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] };

function parse(body: string): Block[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paraBuf: string[] = [];
  let ulBuf: string[] = [];
  let olBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length) {
      blocks.push({ kind: 'p', text: paraBuf.join('\n') });
      paraBuf = [];
    }
  };
  const flushUl = () => {
    if (ulBuf.length) {
      blocks.push({ kind: 'ul', items: ulBuf });
      ulBuf = [];
    }
  };
  const flushOl = () => {
    if (olBuf.length) {
      blocks.push({ kind: 'ol', items: olBuf });
      olBuf = [];
    }
  };
  const flushAll = () => { flushPara(); flushUl(); flushOl(); };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushAll(); continue; }
    if (/^##\s+/.test(line)) { flushAll(); blocks.push({ kind: 'h3', text: line.replace(/^##\s+/, '') }); continue; }
    if (/^#\s+/.test(line))  { flushAll(); blocks.push({ kind: 'h2', text: line.replace(/^#\s+/, '') }); continue; }
    if (/^[-*]\s+/.test(line)) { flushPara(); flushOl(); ulBuf.push(line.replace(/^[-*]\s+/, '')); continue; }
    const olMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (olMatch) { flushPara(); flushUl(); olBuf.push(olMatch[2]); continue; }
    flushUl(); flushOl();
    paraBuf.push(line);
  }
  flushAll();
  return blocks;
}

export const LegalBodyRenderer: React.FC<Props> = ({
  body,
  color = 'rgba(248,250,252,0.72)',
  headingColor = '#F8FAFC',
}) => {
  const blocks = React.useMemo(() => parse(body || ''), [body]);
  return (
    <div style={{ color, fontSize: 14, lineHeight: 1.65 }}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h2':
            return (
              <h2 key={i} style={{ color: headingColor, fontSize: 17, fontWeight: 700, margin: '24px 0 8px', letterSpacing: '-0.01em' }}>
                {b.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} style={{ color: headingColor, fontSize: 15, fontWeight: 700, margin: '18px 0 6px' }}>
                {b.text}
              </h3>
            );
          case 'p':
            return (
              <p key={i} style={{ margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
                {b.text}
              </p>
            );
          case 'ul':
            return (
              <ul key={i} style={{ margin: '0 0 12px', paddingLeft: 22 }}>
                {b.items.map((t, j) => <li key={j} style={{ margin: '0 0 4px' }}>{t}</li>)}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} style={{ margin: '0 0 12px', paddingLeft: 22 }}>
                {b.items.map((t, j) => <li key={j} style={{ margin: '0 0 4px' }}>{t}</li>)}
              </ol>
            );
        }
      })}
    </div>
  );
};

export default LegalBodyRenderer;
