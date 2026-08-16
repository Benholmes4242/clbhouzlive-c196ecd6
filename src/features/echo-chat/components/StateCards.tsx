/**
 * BRIEF_ECHO_CADDIE §5 — THE OTHER STATES.
 *
 * STATES 5, 6 AND 7 ARE THREE DIFFERENT THINGS AND DO NOT COLLAPSE.
 *   NO DATA (5)      — Echo understood; the member has no rounds there. Offers
 *                      the field's version. Never implies the question was wrong.
 *   OUT OF SCOPE (6) — Echo declines a non-golf question. Names what it does and
 *                      offers two real questions. No apology, no error styling.
 *   ERROR (7)        — the only failure. One retry, no error codes, and the
 *                      question stays in the composer (handled by the page).
 */

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { EC, T } from '../tokens';

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ec-glass ec-fade-in" style={{ borderRadius: 20, padding: 20, margin: '0 20px' }}>
    {children}
  </div>
);

const Suggestion: React.FC<{ text: string; onPick: (t: string) => void }> = ({ text, onPick }) => (
  <button
    type="button"
    onClick={() => onPick(text)}
    className="ec-glass ec-glass--quiet active:opacity-70"
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      borderRadius: 14,
      padding: '12px 14px',
      ...T.ADVICE,
      color: EC.INK,
    }}
  >
    {text}
  </button>
);

export const NoDataCard: React.FC<{
  courseName: string | null;
  fieldPrompt: string;
  onPick: (t: string) => void;
  copy: { eyebrow: string; lead: (c: string) => string; advice: string };
}> = ({ courseName, fieldPrompt, onPick, copy }) => (
  <Card>
    <span style={T.EYEBROW}>{copy.eyebrow}</span>
    <div style={{ ...T.HERO_WORDS, marginTop: 12 }}>{copy.lead(courseName ?? 'there')}</div>
    <p style={{ ...T.ADVICE, margin: '14px 0 16px' }}>{copy.advice}</p>
    <Suggestion text={fieldPrompt} onPick={onPick} />
  </Card>
);

export const OutOfScopeCard: React.FC<{
  prompts: string[];
  onPick: (t: string) => void;
  copy: { eyebrow: string; lead: string };
}> = ({ prompts, onPick, copy }) => (
  <Card>
    <span style={T.EYEBROW}>{copy.eyebrow}</span>
    <div style={{ ...T.HERO_WORDS, marginTop: 12 }}>{copy.lead}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
      {prompts.slice(0, 2).map((p) => (
        <Suggestion key={p} text={p} onPick={onPick} />
      ))}
    </div>
  </Card>
);

export const ErrorCard: React.FC<{
  onRetry: () => void;
  copy: { eyebrow: string; lead: string; retry: string };
}> = ({ onRetry, copy }) => (
  <Card>
    {/* The only state that reads as a failure. */}
    <span style={{ ...T.EYEBROW, color: '#E5484D' }}>{copy.eyebrow}</span>
    <div style={{ ...T.HERO_WORDS, marginTop: 12 }}>{copy.lead}</div>
    <button
      type="button"
      onClick={onRetry}
      className="active:opacity-70"
      style={{
        marginTop: 18,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 16px',
        borderRadius: 14,
        border: 'none',
        background: EC.INK,
        color: EC.BLACK,
        fontSize: 14.5,
        fontWeight: 700,
      }}
    >
      <RotateCcw size={14} strokeWidth={2.6} />
      {copy.retry}
    </button>
  </Card>
);

export const AskCard: React.FC<{
  /** §2b honest label when the photograph is the member's most played course. */
  label: string;
  courseName: string | null;
  lead: string;
  prompts: string[];
  onPick: (t: string) => void;
}> = ({ label, courseName, lead, prompts, onPick }) => (
  <div style={{ padding: '0 20px' }}>
    <span style={T.EYEBROW}>{label}</span>
    {courseName && <div style={{ ...T.HERO_WORDS, marginTop: 8 }}>{courseName}</div>}
    <p style={{ ...T.BODY, margin: '12px 0 18px', color: EC.INK_2 }}>{lead}</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {prompts.slice(0, 3).map((p) => (
        <Suggestion key={p} text={p} onPick={onPick} />
      ))}
    </div>
  </div>
);
