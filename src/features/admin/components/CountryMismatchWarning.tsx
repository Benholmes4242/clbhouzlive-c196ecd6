/**
 * The WHS country, in front of the reviewer.
 *
 * Ben, Sep 2026: a human approved "Tournament Course" (England) -> a Texas country
 * club, and could not have known better - the review screens showed the WHS name and
 * never the WHS country, while the candidate rows showed theirs. These two pieces go
 * on every surface where a match is reviewed. The warning does NOT block: a human may
 * know something the vocabulary does not. It only makes it impossible to approve a
 * cross-country match without having seen that the countries differ.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { adminTheme as t } from '../theme';
import { countryMismatchNote, isCountryCompatible } from '@/lib/whs/countryVocabulary';

/** The WHS-published country, shown beside the WHS course name. */
export function WhsCountryChip({ country }: { country: string | null | undefined }) {
  const known = !!country;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 8px', borderRadius: 999,
        background: known ? t.neutralSoft : t.dangerSoft,
        color: known ? t.ink : t.dangerText,
        fontSize: 10.5, fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}
    >
      WHS: {country ?? 'country unknown'}
    </span>
  );
}

/** Inline tag on a candidate row whose country disagrees with the WHS country. */
export function CandidateCountryFlag({
  whsCountry,
  subCountry,
}: {
  whsCountry: string | null | undefined;
  subCountry: string | null | undefined;
}) {
  if (!whsCountry) return null;
  if (isCountryCompatible(whsCountry, subCountry)) return null;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '2px 6px', borderRadius: 999,
        background: t.dangerSoft, color: t.dangerText,
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}
    >
      <AlertTriangle size={9} /> Different country
    </span>
  );
}

/** Full-width banner for the currently selected candidate. Warns, never blocks. */
export function CountryMismatchWarning({
  whsCountry,
  subCountry,
}: {
  whsCountry: string | null | undefined;
  subCountry: string | null | undefined;
}) {
  const note = countryMismatchNote(whsCountry, subCountry);
  if (!note) return null;
  return (
    <div
      role="alert"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '9px 11px', borderRadius: t.radius.md,
        background: t.dangerSoft, color: t.dangerText,
        border: `1px solid ${t.line}`,
        fontSize: 12, lineHeight: 1.45,
      }}
    >
      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>
        <b>Countries disagree.</b> {note} Only link these if you know the course was
        genuinely played there.
      </span>
    </div>
  );
}

export default CountryMismatchWarning;
