/**
 * BC2 — shared step 2 field card. The label wraps the control so tapping
 * anywhere in the card focuses it; focus styling is :focus-within in
 * business-create.css (white border step, never amber, no outline).
 */
import type { ReactNode } from 'react';

export function Field({ label, children, testId }: { label: string; children: ReactNode; testId?: string }) {
  return (
    <label className="bizc-field" data-testid={testId}>
      <span className="bizc-field-label">{label}</span>
      {children}
    </label>
  );
}
