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
