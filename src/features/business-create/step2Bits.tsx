/**
 * BC2 — shared step 2 field card. The label wraps the control so tapping
 * anywhere in the card focuses it; focus styling is :focus-within in
 * business-create.css (white border step, never amber, no outline).
 * BIZ_ADDRESS_COUNTRY_FIRST: optional step marker, and a locked state
 * (dimmed; a tap calls onLockedTap instead of focusing the control).
 */
import type { ReactNode } from 'react';

export function StepMark({ n, done }: { n: number; done: boolean }) {
  return (
    <span className={done ? 'bizc-step done' : 'bizc-step'} data-done={done} aria-hidden="true">
      {done ? (
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 5 8.6l4.5-5" stroke="#0A0A0C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : n}
    </span>
  );
}

export function Field({ label, children, testId, marker, locked = false, onLockedTap }: {
  label: string; children: ReactNode; testId?: string; marker?: ReactNode; locked?: boolean; onLockedTap?: () => void;
}) {
  return (
    <label
      className={locked ? 'bizc-field locked' : 'bizc-field'}
      data-testid={testId}
      data-locked={locked || undefined}
      onClick={locked ? (e) => { e.preventDefault(); onLockedTap?.(); } : undefined}
    >
      {marker ? (
        <span className="bizc-steprow">{marker}<span className="bizc-field-label">{label}</span></span>
      ) : (
        <span className="bizc-field-label">{label}</span>
      )}
      {children}
    </label>
  );
}
