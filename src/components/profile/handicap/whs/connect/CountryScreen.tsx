import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS, FIELD_HEIGHT, FIELD_INK } from '@/lib/tokens/field';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight } from 'lucide-react';
import { WHS_COUNTRIES, type WhsCountry } from '@/lib/whs/whsCountries';
import { KICKER } from '@/lib/tokens/type';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { INK, MUTE, DIM, BORDER, PANEL, FONT, LABEL_LG, CAPTION } from './designTokens';
import { Collapsible, Stage, StageHead } from './Primitives';
import MiniFlag from './MiniFlag';
import { useHandicapWaitlist } from './useHandicapWaitlist';
import { WaitlistState, WAIT_IDLE_INK } from './WaitlistToggle';

interface Props {
  onSelect: (country: WhsCountry) => void;
}

const GROUP_LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: WAIT_IDLE_INK,
  marginTop: 14,
  marginBottom: 2,
};

/**
 * STAGE 2 - COUNTRY. WHS_COUNTRIES and the selection logic are unchanged.
 * Open federations are the one card and the ONLY path to onSelect. Every other
 * country is a waitlist toggle button: it never navigates, never advances the
 * flow and never opens ComingSoonScreen.
 */
export const CountryScreen: React.FC<Props> = ({ onSelect }) => {
  const { t } = useTranslation('handicap');
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const { joined, counts, join, leave } = useHandicapWaitlist(userId);
  const [query, setQuery] = useState('');

  const { live, agreed, rest, notYet, empty } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (c: WhsCountry) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q) ||
      c.pickerBody?.toLowerCase().includes(q);
    const filtered = WHS_COUNTRIES.filter(match);
    const unsupported = filtered.filter((c) => !c.supported);
    const agreed = unsupported.filter((c) => c.comingSoon);
    const rest = unsupported.filter((c) => !c.comingSoon);
    return {
      live: WHS_COUNTRIES.filter((c) => c.supported),
      agreed,
      rest,
      notYet: [...agreed, ...rest],
      empty: filtered.length === 0,
    };
  }, [query]);

  const renderRow = (c: WhsCountry, isLast: boolean) => {
    const isJoined = joined.has(c.id);
    const n = counts[c.id];
    return (
      <button
        key={c.id}
        type="button"
        disabled={!userId}
        aria-pressed={isJoined}
        onClick={() => (isJoined ? leave(c) : join(c))}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '13px 0',
          textAlign: 'left',
          background: 'none',
          border: 0,
          ...(isLast ? {} : { borderBottom: `1px solid ${BORDER}` }),
          cursor: userId ? 'pointer' : 'default',
          fontFamily: FONT,
        }}
      >
        <MiniFlag iso={c.iso} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: INK }}>{c.name}</div>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: DIM,
              marginTop: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {c.body}
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <WaitlistState joined={isJoined} />
          {n !== undefined ? (
            <span style={{ fontSize: 10, fontWeight: 700, color: MUTE, fontVariantNumeric: 'tabular-nums lining-nums' }}>
              {`${n} waiting`}
            </span>
          ) : null}
        </div>
      </button>
    );
  };

  // Rows rendered as one flat list so the Collapsible counts rows; group labels
  // sit ahead of the first row of each group.
  const items: React.ReactNode[] = [];
  agreed.forEach((c, i) => {
    const row = renderRow(c, rest.length === 0 && i === agreed.length - 1);
    items.push(
      i === 0 ? (
        <React.Fragment key={c.id}>
          <div style={GROUP_LABEL}>Partnership agreed</div>
          {row}
        </React.Fragment>
      ) : (
        row
      ),
    );
  });
  rest.forEach((c, i) => {
    const row = renderRow(c, i === rest.length - 1);
    items.push(
      i === 0 ? (
        <React.Fragment key={c.id}>
          <div style={GROUP_LABEL}>Not yet open</div>
          {row}
        </React.Fragment>
      ) : (
        row
      ),
    );
  });

  return (
    <Stage>
      <StageHead small kicker={t('whsConnect.steps.country')} headline="Where do you play?" lead={t('whsConnect.country.sub')} />

      {live.length > 0 ? (
        <>
          <div style={{ ...LABEL_LG, marginTop: 24 }}>Open now</div>
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
                minHeight: 88,
                marginTop: 10,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: FONT,
              }}
            >
              <MiniFlag iso={c.iso} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: INK }}>{c.name}</div>
                <div style={{ ...KICKER, color: MUTE, marginTop: 8, whiteSpace: 'nowrap' }}>
                  {c.pickerBody ?? c.body}
                </div>
              </div>
              <ChevronRight size={18} color={DIM} strokeWidth={2.2} />
            </button>
          ))}
        </>
      ) : null}

      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={LABEL_LG}>Everywhere else</div>
        <div style={LABEL_LG}>{`${notYet.length} countries`}</div>
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: MUTE, marginTop: 8 }}>
        A federation has to open its API before we can read from it. Tell us where you play — it is how we choose
        which one to push next.
      </div>

      {/* FIELD CANON (lib/tokens/field.ts). */}
      <div
        className={FIELD_PAINT_CLASS}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: FIELD_HEIGHT,
          boxSizing: 'border-box',
          padding: '0 14px',
          marginTop: 12,
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
            color: FIELD_INK,
          }}
          className={FIELD_PLACEHOLDER_CLASS}
        />
      </div>

      {empty ? (
        <div style={{ ...CAPTION, marginTop: 24 }}>
          Nothing by that name. Countries and governing bodies both match, so try either.
        </div>
      ) : null}

      {notYet.length > 0 ? (
        <div style={{ paddingBottom: 28 }}>
          <Collapsible
            threshold={5}
            collapsedCount={5}
            showAllLabel={`Show all ${notYet.length}`}
            showFewerLabel="Show fewer"
          >
            {items}
          </Collapsible>
        </div>
      ) : null}
    </Stage>
  );
};

export default CountryScreen;
