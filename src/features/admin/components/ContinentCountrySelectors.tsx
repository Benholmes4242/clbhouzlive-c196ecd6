import React, { useMemo } from 'react';
import { adminTheme as t } from '../theme';
import { VALID_CONTINENTS } from '../constants';
import { countriesForContinent, isCountryInContinent } from '../lib/countries';

/**
 * Continent-then-Country dependent selector pair used by the
 * add-course and edit-course admin sheets.
 *
 * Rules (see brief):
 * - Continent renders first, then Country directly below.
 * - Country is disabled with a "Pick a continent first" placeholder
 *   until a continent is chosen.
 * - Changing continent RESETS the country selection.
 * - Country dropdown lists every country in the selected continent,
 *   alphabetical.
 * - Edit edge case: if the stored country is not in the selected
 *   continent's list, we surface it at the top of the options as
 *   "<value> (unrecognised)" so opening + saving untouched never
 *   silently rewrites the record. Once the admin picks a real
 *   option, the unrecognised value is dropped from the list.
 */

interface Props {
  continent: string;
  country: string;
  onContinentChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  required?: boolean;
}

const disabledPlaceholder = 'Pick a continent first';

function labelSpan(text: string, required?: boolean) {
  return (
    <span style={{ fontSize: 12, color: t.inkMuted, fontWeight: 600 }}>
      {text}
      {required && <span style={{ color: t.danger, marginLeft: 2 }}>*</span>}
    </span>
  );
}

const baseSelectStyle: React.CSSProperties = {
  width: '100%', minHeight: 44, padding: '10px 12px',
  borderRadius: t.radius.md, border: `1px solid ${t.line}`,
  background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
};

const disabledSelectStyle: React.CSSProperties = {
  ...baseSelectStyle,
  background: t.canvas,
  color: t.inkFaint,
  cursor: 'not-allowed',
  opacity: 0.7,
};

export function ContinentCountrySelectors({
  continent, country,
  onContinentChange, onCountryChange,
  required,
}: Props) {
  const list = useMemo(() => countriesForContinent(continent), [continent]);
  const isUnrecognised = !!(continent && country && !isCountryInContinent(country, continent));
  const disabled = !continent;

  const handleContinent = (v: string) => {
    if (v === continent) return;
    onContinentChange(v);
    // Reset country whenever continent changes.
    onCountryChange('');
  };

  return (
    <>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {labelSpan('Continent', required)}
        <select
          value={continent ?? ''}
          onChange={(e) => handleContinent(e.target.value)}
          style={baseSelectStyle}
        >
          <option value="">Select continent...</option>
          {VALID_CONTINENTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {labelSpan('Country', required)}
        <select
          value={country ?? ''}
          disabled={disabled}
          onChange={(e) => onCountryChange(e.target.value)}
          style={disabled ? disabledSelectStyle : baseSelectStyle}
        >
          {disabled ? (
            <option value="">{disabledPlaceholder}</option>
          ) : (
            <>
              <option value="">Select country...</option>
              {isUnrecognised && (
                <option value={country}>{country} (unrecognised)</option>
              )}
              {list.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </>
          )}
        </select>
      </label>
    </>
  );
}

export default ContinentCountrySelectors;
