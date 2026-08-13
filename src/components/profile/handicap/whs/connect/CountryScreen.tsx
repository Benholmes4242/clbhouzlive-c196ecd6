import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight } from 'lucide-react';
import { WHS_COUNTRIES, type WhsCountry } from '@/lib/whs/whsCountries';
import { INK, MUTE, DIM, BORDER, PANEL, FONT, LABEL_LG, CAPTION } from './designTokens';
import { Collapsible, Stage, StageHead } from './Primitives';

interface Props {
  onSelect: (country: WhsCountry) => void;
}

/**
 * STAGE 2 - COUNTRY. Federation-neutral: statuses only, no pitch.
 * The selection logic and the WHS_COUNTRIES data are UNCHANGED - only the
 * surface is: a live federation is a single large card, everything else is an
 * undecorated hairline row on SURFACE.
 */
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
    <Stage>
      <StageHead small headline="Where do you play?" lead={t('whsConnect.country.sub')} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: PANEL,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: '12px 14px',
          marginTop: 28,
        }}
      >
        <Search size={15} color={DIM} strokeWidth={2.4} />
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
            fontSize: 15,
            color: INK,
          }}
        />
      </div>

      {empty ? (
        <div style={{ ...CAPTION, marginTop: 24 }}>
          Nothing by that name. Countries and governing bodies both match, so try either.
        </div>
      ) : null}

      {/* LIVE: one large card per open federation. The only card in the flow. */}
      {live.length > 0 ? (
        <div style={{ marginTop: 26 }}>
          <div style={{ ...LABEL_LG, marginBottom: 12 }}>Live</div>
          {live.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: '20px 18px',
                marginBottom: 10,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: FONT,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: INK }}>
                  {c.name}
                </div>
                <div style={{ ...LABEL_LG, color: MUTE, marginTop: 8 }}>{c.body}</div>
              </div>
              <ChevronRight size={18} color={DIM} strokeWidth={2.2} />
            </button>
          ))}
        </div>
      ) : null}

      {/* NOT YET: undecorated rows, hairline separated. No card. */}
      {notYet.length > 0 ? (
        <div style={{ marginTop: 30 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 12,
            }}
          >
            <div style={LABEL_LG}>Not yet</div>
            <div style={LABEL_LG}>{`${notYet.length} countries`}</div>
          </div>
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
                  padding: i === 0 ? '0 0 13px' : '13px 0',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: MUTE }}>
                    {c.name}
                  </div>
                  <div style={{ ...LABEL_LG, marginTop: 5 }}>{c.body}</div>
                </div>
                <div style={{ ...LABEL_LG, textAlign: 'right', flexShrink: 0 }}>
                  {c.comingSoon ? 'coming soon' : 'on the list'}
                </div>
              </div>
            ))}
          </Collapsible>
        </div>
      ) : null}

      <div style={{ ...CAPTION, color: DIM, marginTop: 20, paddingBottom: 28 }}>
        A federation has to open an API before we can read from it.
      </div>
    </Stage>
  );
};

export default CountryScreen;
