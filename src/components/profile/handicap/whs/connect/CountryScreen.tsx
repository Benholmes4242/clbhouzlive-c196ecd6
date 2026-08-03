import React, { useMemo, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { WHS_COUNTRIES, type WhsCountry } from '@/lib/whs/whsCountries';
import { INK, MUTE, DIM, BORDER, PANEL, FONT, LABEL, CAPTION } from './designTokens';
import { Panel, PanelGap, Collapsible } from './Primitives';

interface Props {
  onSelect: (country: WhsCountry) => void;
}

/** SCREEN 2 - COUNTRY. No pills anywhere: panel membership carries the state. */
export const CountryScreen: React.FC<Props> = ({ onSelect }) => {
  const [query, setQuery] = useState('');

  const { live, soon, rest, empty } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (c: WhsCountry) =>
      !q || c.name.toLowerCase().includes(q) || c.body.toLowerCase().includes(q);
    const filtered = WHS_COUNTRIES.filter(match);
    return {
      live: filtered.filter((c) => c.supported),
      soon: filtered.filter((c) => !c.supported && c.comingSoon),
      rest: filtered.filter((c) => !c.supported && !c.comingSoon),
      empty: filtered.length === 0,
    };
  }, [query]);

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: PANEL,
          border: `1px solid ${BORDER}`,
          borderRadius: 18,
          padding: '10px 14px',
          marginBottom: 16,
        }}
      >
        <Search size={14} color={DIM} strokeWidth={2.4} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search countries"
          aria-label="Search countries"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: FONT,
            fontSize: 13,
            color: INK,
          }}
        />
      </div>

      {empty ? (
        <Panel kicker="No match">
          <div style={{ ...CAPTION }}>
            Nothing here by that name. Federations are listed by country and by governing body,
            so try either.
          </div>
        </Panel>
      ) : null}

      {live.length > 0 ? (
        <>
          <Panel kicker="Connected federations" aside="live">
            {live.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'none',
                  border: 'none',
                  borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
                  padding: i === 0 ? '0 0 2px' : '12px 0 2px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: FONT,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{c.name}</div>
                  <div style={{ ...LABEL, color: MUTE, marginTop: 4 }}>{c.body}</div>
                </div>
                <ChevronRight size={15} color={DIM} strokeWidth={2.2} />
              </button>
            ))}
          </Panel>
          <PanelGap />
        </>
      ) : null}

      {soon.length > 0 ? (
        <>
          <Panel kicker="Coming soon" aside="in conversation">
            {soon.map((c, i) => (
              <div
                key={c.id}
                style={{
                  borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
                  padding: i === 0 ? '0 0 2px' : '12px 0 2px',
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700, color: MUTE }}>{c.name}</div>
                <div style={{ ...LABEL, marginTop: 4 }}>{c.body}</div>
              </div>
            ))}
          </Panel>
          <PanelGap />
        </>
      ) : null}

      {rest.length > 0 ? (
        <Panel
          kicker="On the list"
          aside={`${rest.length} federation${rest.length === 1 ? '' : 's'}`}
        >
          <Collapsible
            threshold={4}
            collapsedCount={4}
            showAllLabel={`Show all ${rest.length}`}
            showFewerLabel="Show fewer"
          >
            {rest.map((c, i) => (
              <div
                key={c.id}
                style={{
                  borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
                  padding: i === 0 ? '0 0 2px' : '12px 0 2px',
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700, color: MUTE }}>{c.name}</div>
                <div style={{ ...LABEL, marginTop: 4 }}>{c.body}</div>
              </div>
            ))}
          </Collapsible>

          <div style={{ ...CAPTION, marginTop: 14 }}>
            A federation has to open an API before we can read from it. Until yours does you can
            post rounds by hand, and everything else works.
          </div>
        </Panel>
      ) : null}
    </div>
  );
};

export default CountryScreen;
