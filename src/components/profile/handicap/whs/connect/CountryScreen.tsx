import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight } from 'lucide-react';
import { WHS_COUNTRIES, type WhsCountry } from '@/lib/whs/whsCountries';
import { INK, MUTE, DIM, BORDER, PANEL, FONT, LABEL, CAPTION } from './designTokens';
import { Panel, PanelGap, Collapsible, FlowBody, FlowHead } from './Primitives';

interface Props {
  onSelect: (country: WhsCountry) => void;
}

/** SCREEN 2 - COUNTRY. Federation-neutral: statuses only, no pitch. */
export const CountryScreen: React.FC<Props> = ({ onSelect }) => {
  const { t } = useTranslation('handicap');
  const [query, setQuery] = useState('');

  const { live, notYet, empty } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (c: WhsCountry) =>
      !q || c.name.toLowerCase().includes(q) || c.body.toLowerCase().includes(q);
    const filtered = WHS_COUNTRIES.filter(match);
    const unsupported = filtered.filter((c) => !c.supported);
    return {
      live: filtered.filter((c) => c.supported),
      // Partnership-agreed federations pin to the top of the one list.
      notYet: [
        ...unsupported.filter((c) => c.comingSoon),
        ...unsupported.filter((c) => !c.comingSoon),
      ],
      empty: filtered.length === 0,
    };
  }, [query]);

  return (
    <FlowBody>
      <FlowHead
        size={27}
        headline="Where do you play?"
        sub={t('whsConnect.country.sub')}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: PANEL,
          border: `1px solid ${BORDER}`,
          borderRadius: 18,
          padding: '10px 14px',
          marginTop: 22,
          marginBottom: 14,
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
          <div style={CAPTION}>
            Nothing by that name. Countries and governing bodies both match, so try either.
          </div>
        </Panel>
      ) : null}

      {live.length > 0 ? (
        <>
          <Panel kicker="Live">
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

      {notYet.length > 0 ? (
        <Panel kicker="Not yet" aside={`${notYet.length} countries`}>
          <Collapsible
            threshold={5}
            collapsedCount={5}
            showAllLabel={`Show all ${notYet.length}`}
            showFewerLabel="Show fewer"
          >
            {notYet.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 12,
                  borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
                  padding: i === 0 ? '0 0 2px' : '12px 0 2px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: MUTE }}>{c.name}</div>
                  <div style={{ ...LABEL, marginTop: 4 }}>{c.body}</div>
                </div>
                <div style={{ ...LABEL, textAlign: 'right', flexShrink: 0 }}>
                  {c.comingSoon ? 'coming soon' : 'on the list'}
                </div>
              </div>
            ))}
          </Collapsible>
        </Panel>
      ) : null}

      {/* The footnote belongs to the page, not to the panel it explains. */}
      <div style={{ ...CAPTION, color: DIM, marginTop: 14, paddingBottom: 24 }}>
        A federation has to open an API before we can read from it.
      </div>
    </FlowBody>
  );
};

export default CountryScreen;
