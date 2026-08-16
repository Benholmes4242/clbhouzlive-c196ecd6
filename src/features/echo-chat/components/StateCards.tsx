/**
 * BRIEF_ECHO_CHAT — the states that are not a plain answer. All of them are
 * BLOCKS IN THE THREAD, not full-screen cards: the member's question stays
 * above them and the thread keeps scrolling.
 *
 * NO DATA       — Echo understood; the member has never played that course, so
 *                 there is no hole data and no field aggregate. Prose plus the
 *                 field offer. NEVER an empty chart (§4b of the correction).
 * OUT OF SCOPE  — Echo declines a non-golf question. No apology, no error tone.
 * ERROR         — the only failure. One retry; the question stays in the
 *                 composer, which the page owns.
 * ENTRY (§8.1)  — three labelled example questions, one per kind.
 */

import React from 'react';
import { EC, T } from '../tokens';
import { EchoWaveform } from './EchoWaveform';
import { Follow, Prose } from './ThreadPrimitives';

export const NoDataBlock: React.FC<{
  lead: string;
  prompts: string[];
  onPick: (t: string) => void;
}> = ({ lead, prompts, onPick }) => (
  <div className="ec-fade-in">
    <Prose first>{lead}</Prose>
    {prompts.length > 0 && <Follow items={prompts.slice(0, 2)} onPick={onPick} />}
  </div>
);

export const OutOfScopeBlock: React.FC<{
  lead: string;
  prompts: string[];
  onPick: (t: string) => void;
}> = ({ lead, prompts, onPick }) => (
  <div className="ec-fade-in">
    <Prose first>{lead}</Prose>
    {prompts.length > 0 && <Follow items={prompts.slice(0, 2)} onPick={onPick} />}
  </div>
);

export const ErrorBlock: React.FC<{
  lead: string;
  reassure: string;
  retry: string;
  onRetry: () => void;
}> = ({ lead, reassure, retry, onRetry }) => (
  <div className="ec-fade-in">
    <div style={{ ...T.BODY, color: EC.INK }}>{lead}</div>
    <div style={{ ...T.BODY, fontSize: 14, marginTop: 5 }}>{reassure}</div>
    <button
      type="button"
      onClick={onRetry}
      className="active:opacity-70"
      style={{
        marginTop: 14,
        padding: '11px 20px',
        borderRadius: 999,
        border: 'none',
        background: EC.INK,
        color: EC.BLACK,
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {retry}
    </button>
  </div>
);

export interface EntryExample {
  /** "Your golf" / "A course" / "The game" / "The tour". */
  kind: string;
  question: string;
}

/**
 * §8.1 ENTRY TEACHES THE THREE KINDS by showing one example of each, labelled.
 * Not a sentence explaining what Echo does — three lines a member can read and
 * tap. The examples are real and drawn from this member where they can be.
 */
export const EntryPanel: React.FC<{
  headline: string;
  examples: EntryExample[];
  onPick: (t: string) => void;
}> = ({ headline, examples, onPick }) => (
  <div
    style={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 22px',
      overflowY: 'auto',
    }}
  >
    <div style={{ display: 'grid', placeItems: 'center' }}>
      {/* Static. A permanently animating logo is a distraction, not a brand. */}
      <EchoWaveform size={56} />
    </div>

    <div style={{ ...T.DISPLAY, textAlign: 'center', marginTop: 26 }}>{headline}</div>

    <div style={{ display: 'grid', gap: 9, marginTop: 30 }}>
      {examples.map((ex) => (
        <button
          key={ex.kind}
          type="button"
          onClick={() => onPick(ex.question)}
          className="ec-glass active:opacity-70"
          style={{ padding: '13px 16px', borderRadius: 14, textAlign: 'left' }}
        >
          <div style={{ ...T.LABEL, fontSize: 8.5 }}>{ex.kind}</div>
          <div style={{ fontSize: 14.5, color: EC.INK, marginTop: 5, lineHeight: 1.35 }}>
            {ex.question}
          </div>
        </button>
      ))}
    </div>
  </div>
);
