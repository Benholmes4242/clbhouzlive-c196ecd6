/**
 * BRIEF_ECHO_CHAT §3 — THE THREAD.
 *
 * 3.1 THE MEMBER'S QUESTION is a WHITE bubble with black text, right-aligned,
 *     tail bottom-right. NOT AMBER — amber is the mark and nothing else (§7).
 * 3.2 ECHO'S ANSWER IS NOT A BUBBLE. Prose in the body tone, led by the mark,
 *     flowing down the thread. Blocks within one answer are separated by SPACE.
 *     A card is for a CHART, never for a paragraph.
 * 3.3 A ONE-WORD MESSAGE KEEPS A MINIMUM WIDTH so it is never a disc.
 */

import React from 'react';
import { EC, T } from '../tokens';
import { parseEchoMarkdown, type Span } from '../lib/echoMarkdown';
import { EchoWaveform } from './EchoWaveform';

export const Asked: React.FC<{ q: string }> = ({ q }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
    <span
      style={{
        maxWidth: '80%',
        // §3.3 a one-word question keeps a minimum width so it is never a disc.
        minWidth: 64,
        textAlign: 'left',
        background: '#FFFFFF',
        padding: '10px 15px',
        borderRadius: '18px 18px 4px 18px',
        ...T.ASKED,
      }}
    >
      {q}
    </span>
  </div>

);

/**
 * ONE WAVEFORM, NEVER TWO (§5.3). The speaker mark itself animates while
 * thinking; there is no second wave beside a still one, and the composer
 * carries none.
 */
export const Says: React.FC<{ children: React.ReactNode; live?: boolean }> = ({ children, live }) => (
  <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', marginBottom: 22 }}>
    <span style={{ paddingTop: 3, flex: '0 0 auto' }}>
      <EchoWaveform size={18} bars={5} live={live} />
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
  </div>
);

/** A card is for a CHART. */
export const ChartCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: EC.PANEL,
      border: `1px solid ${EC.LINE}`,
      borderRadius: 14,
      padding: 14,
      marginTop: 13,
    }}
  >
    {children}
  </div>
);

/** §4.4 EVERY CHART CARRIES ITS SAMPLE. Only rendered when data was read. */
export const Basis: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      ...T.MICRO,
      marginTop: 12,
      paddingTop: 11,
      borderTop: `1px solid ${EC.LINE}`,
    }}
  >
    {children}
  </div>
);

export const Prose: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => (
  <div style={{ ...T.BODY, marginTop: first ? 0 : 14, whiteSpace: 'pre-wrap' }}>{children}</div>
);

/**
 * §1 (markdown correction) — ECHO'S OWN MARKDOWN, NOT A LIBRARY'S.
 *
 * The model returns markdown; we render the four constructs we have a design
 * for and STRIP the rest (see lib/echoMarkdown). Bold is WEIGHT in the brighter
 * ink tier, never a colour change. `##` is the app's LABEL — a section marker
 * inside an answer, not a title, so it never takes the DISPLAY scale.
 */
export const AnswerText: React.FC<{ text: string; first?: boolean }> = ({ text, first }) => {
  const blocks = React.useMemo(() => parseEchoMarkdown(text), [text]);
  if (blocks.length === 0) return null;

  return (
    <>
      {blocks.map((b, i) => {
        const top = i === 0 ? (first ? 0 : 14) : b.kind === 'h' ? 20 : 12;
        if (b.kind === 'h') {
          return (
            <div key={i} style={{ ...T.LABEL, marginTop: top, marginBottom: 2 }}>
              {b.text}
            </div>
          );
        }
        if (b.kind === 'ul') {
          return (
            <div key={i} style={{ ...T.BODY, marginTop: top, display: 'grid', gap: 6 }}>
              {b.items.map((it, j) => (
                <div key={j} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
                  <span
                    aria-hidden
                    style={
                      it.marker
                        ? { flex: '0 0 auto', color: EC.INK_3, fontWeight: 700, fontSize: 13 }
                        : {
                            flex: '0 0 auto',
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            background: EC.INK_3,
                            transform: 'translateY(-3px)',
                          }
                    }
                  >
                    {it.marker ? `${it.marker}.` : ''}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <Spans spans={it.spans} />
                  </span>
                </div>
              ))}
            </div>
          );
        }
        return (
          <div key={i} style={{ ...T.BODY, marginTop: top }}>
            <Spans spans={b.spans} />
          </div>
        );
      })}
    </>
  );
};

/** Bold is weight 700 in the brighter tier. NOT a colour change of its own. */
const Spans: React.FC<{ spans: Span[] }> = ({ spans }) => (
  <>
    {spans.map((s, i) =>
      s.bold ? (
        <strong key={i} style={{ fontWeight: 700, color: EC.INK }}>
          {s.text}
        </strong>
      ) : (
        <React.Fragment key={i}>{s.text}</React.Fragment>
      ),
    )}
  </>
);

export const Follow: React.FC<{ items: string[]; onPick: (t: string) => void }> = ({ items, onPick }) => (
  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 14 }}>
    {items.map((item) => (
      <button
        key={item}
        type="button"
        onClick={() => onPick(item)}
        className="ec-glass active:opacity-70"
        style={{
          padding: '9px 14px',
          borderRadius: 999,
          fontSize: 13,
          color: EC.INK,
          textAlign: 'left',
        }}
      >
        {item}
      </button>
    ))}
  </div>
);
