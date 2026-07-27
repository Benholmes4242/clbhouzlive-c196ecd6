import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';
import {
  GROUPINGS, ROW_CONTINENTS, subCountryOptions, deriveGeography,
  regionKeyForCountry, isCanonicalCountry,
  type RegionKey,
} from '../lib/geography';

/**
 * Course geography cascade (replaces ContinentCountrySelectors).
 *
 * Step 1  Region        -> sets country + region_key + continent (hidden)
 * Step 2  Country/home nation -> sub_country (filtered by step 1)
 * Step 3  County/state/province -> region (combobox, free text + autocomplete)
 *
 * Legacy rows whose country is not one of the four grouping labels are shown
 * read-only with an "Update region" button that opens the cascade, so opening
 * and saving an old record never rewrites it.
 */

export interface GeographyValue {
  country: string;
  region_key: string;
  continent: string;
  sub_country: string;
  region: string;
}

interface Props {
  value: GeographyValue;
  onChange: (patch: Partial<GeographyValue>) => void;
  /** The country as stored on the record (edit mode only). */
  originalCountry?: string | null;
}

const labelStyle: React.CSSProperties = { fontSize: 12, color: t.inkMuted, fontWeight: 600 };
const inputStyle: React.CSSProperties = {
  width: '100%', minHeight: 44, padding: '10px 12px',
  borderRadius: t.radius.md, border: `1px solid ${t.line}`,
  background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
};
const disabledStyle: React.CSSProperties = {
  ...inputStyle, background: t.canvas, color: t.inkFaint, cursor: 'not-allowed', opacity: 0.7,
};

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <span style={labelStyle}>
      {text}
      {required && <span style={{ color: t.danger, marginLeft: 2 }}>*</span>}
    </span>
  );
}

/** Canonical region vocabulary for a sub_country, from public.geo_regions. */
function useCanonicalRegions(subCountry: string) {
  const sc = subCountry.trim();
  return useQuery({
    queryKey: ['admin-v2', 'courses', 'regions', sc],
    enabled: sc.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geo_regions')
        .select('region, sort_order')
        .eq('sub_country', sc)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('region', { ascending: true });
      if (error) throw error;
      return (data ?? [])
        .map((r: any) => (r.region ?? '') as string)
        .filter((r) => r.length > 0);
    },
  });
}


export function CourseGeographySelectors({ value, onChange, originalCountry }: Props) {
  const storedKey = regionKeyForCountry(value.country);
  const legacy = !!(value.country && !isCanonicalCountry(value.country));
  const [overrideLegacy, setOverrideLegacy] = useState(false);

  // Reset the legacy override whenever the record under edit changes.
  useEffect(() => { setOverrideLegacy(false); }, [originalCountry]);

  const regionKey: RegionKey | '' = storedKey ?? '';
  const options = useMemo(
    () => subCountryOptions(regionKey, value.continent),
    [regionKey, value.continent],
  );
  const { data: regionSuggestions = [] } = useRegionSuggestions(value.sub_country);
  const listId = `region-suggest-${(value.sub_country || 'none').replace(/[^a-z0-9]/gi, '')}`;

  const pickGrouping = (key: string) => {
    if (!key) {
      onChange({ country: '', region_key: '', continent: '', sub_country: '' });
      return;
    }
    if (key === 'ROW') {
      onChange({ region_key: 'ROW', country: '', continent: '', sub_country: '' });
      return;
    }
    const derived = deriveGeography(key as RegionKey);
    if (!derived) return;
    onChange({ ...derived, sub_country: '' });
  };

  const pickRowContinent = (continent: string) => {
    if (!continent) {
      onChange({ continent: '', country: '', sub_country: '' });
      return;
    }
    const derived = deriveGeography('ROW', continent, '');
    if (!derived) return;
    onChange({ ...derived, sub_country: '' });
  };

  // ROW + North America derives country from the sub_country, so recompute
  // it whenever the selection changes.
  const pickSubCountry = (sub: string) => {
    if (value.region_key === 'ROW' && value.continent === 'North America') {
      const derived = deriveGeography('ROW', 'North America', sub);
      if (derived) {
        onChange({ ...derived, sub_country: sub });
        return;
      }
    }
    onChange({ sub_country: sub });
  };

  if (legacy && !overrideLegacy) {
    return (
      <>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label text="Region grouping (legacy value)" />
          <div style={{ ...disabledStyle, display: 'flex', alignItems: 'center' }}>
            {value.country}
            {value.continent ? ` - ${value.continent}` : ''}
          </div>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            type="button"
            onClick={() => setOverrideLegacy(true)}
            style={{
              alignSelf: 'flex-start', padding: '8px 12px', minHeight: 40,
              borderRadius: t.radius.md, border: `1px solid ${t.line}`,
              background: t.surface, color: t.ink, fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}
          >Update region</button>
          <span style={{ fontSize: 11, color: t.inkFaint }}>
            This record predates the region groupings. Saving leaves it unchanged.
          </span>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label text="Country / home nation" />
          <select
            value={value.sub_country ?? ''}
            onChange={(e) => onChange({ sub_country: e.target.value })}
            style={inputStyle}
          >
            <option value="">Not set</option>
            {value.sub_country && <option value={value.sub_country}>{value.sub_country}</option>}
          </select>
        </label>
        <RegionCombobox
          value={value.region}
          onChange={(v) => onChange({ region: v })}
          suggestions={regionSuggestions}
          listId={listId}
        />
      </>
    );
  }

  const needsContinent = regionKey === 'ROW' || (!!value.region_key && value.region_key === 'ROW');
  const subDisabled = !regionKey || (needsContinent && !value.continent);

  return (
    <>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Label text="Region" required />
        <select
          value={regionKey || (value.region_key === 'ROW' ? 'ROW' : '')}
          onChange={(e) => pickGrouping(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select region...</option>
          {GROUPINGS.map((g) => (
            <option key={g.key} value={g.key}>{g.label}</option>
          ))}
        </select>
        <span style={{ fontSize: 11, color: t.inkFaint }}>
          Sets the grouping, region key and continent automatically.
        </span>
      </label>

      {needsContinent && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label text="Continent" required />
          <select
            value={value.continent ?? ''}
            onChange={(e) => pickRowContinent(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select continent...</option>
            {ROW_CONTINENTS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      )}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Label text="Country / home nation" required />
        <select
          value={value.sub_country ?? ''}
          disabled={subDisabled}
          onChange={(e) => pickSubCountry(e.target.value)}
          style={subDisabled ? disabledStyle : inputStyle}
        >
          {subDisabled ? (
            <option value="">Pick a region first</option>
          ) : (
            <>
              <option value="">Select country...</option>
              {value.sub_country && !options.includes(value.sub_country) && (
                <option value={value.sub_country}>{value.sub_country}</option>
              )}
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </>
          )}
        </select>
      </label>

      <RegionCombobox
        value={value.region}
        onChange={(v) => onChange({ region: v })}
        suggestions={regionSuggestions}
        listId={listId}
      />
    </>
  );
}

function RegionCombobox({ value, onChange, suggestions, listId }: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  listId: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Label text="County / state / province" />
      <input
        type="text"
        value={value ?? ''}
        list={listId}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Kent"
        style={inputStyle}
      />
      <datalist id={listId}>
        {suggestions.map((s) => <option key={s} value={s} />)}
      </datalist>
      <span style={{ fontSize: 11, color: t.inkFaint }}>
        Optional. Pick an existing value where possible - trimmed on save.
      </span>
    </label>
  );
}

export default CourseGeographySelectors;
