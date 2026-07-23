import React from 'react';
import { Check } from 'lucide-react';
import { MiniFlag } from './MiniFlag';
import type { WhsCountry } from '@/lib/whs/whsCountries';
import { INK, DIM, HAIR, GREEN, GREEN_BG, FONT } from './approachStages';

interface Props {
  country: WhsCountry;
  /** @deprecated kept for backwards compat, no longer invoked */
  onNotifyMe?: (country: WhsCountry) => void;
  onChangeCountry: () => void;
}

export const ComingSoonScreen: React.FC<Props> = ({ country, onChangeCountry }) => {
  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ fontFamily: FONT, padding: '20px 0 8px', justifyContent: 'space-between' }}
    >
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div style={{ marginBottom: 18, transform: 'scale(1.5)', transformOrigin: 'left center', display: 'inline-block' }}>
            <MiniFlag iso={country.iso} />
          </div>
          <h1
            style={{
              fontSize: 27,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: INK,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {country.name} is not in play yet
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: DIM, margin: '12px 0 0', maxWidth: 320 }}>
            We are working with {country.body} to bring official handicaps to clbhouz. England is live today.
          </p>
        </div>

        <div style={{ background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 16, padding: 4 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: GREEN_BG,
              borderRadius: 12,
              padding: '14px 14px',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: GREEN,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Check size={14} color="#fff" strokeWidth={3} />
            </div>
            <div style={{ fontSize: 13, color: DIM, lineHeight: 1.5 }}>
              You will not lose your spot - choose England Golf if you also hold an EG membership, or check back soon.
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 0 8px' }}>
        <button
          type="button"
          onClick={onChangeCountry}
          style={{
            width: '100%',
            minHeight: 56,
            borderRadius: 16,
            background: INK,
            color: '#fff',
            border: 'none',
            fontFamily: FONT,
            fontSize: 16.5,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 8px 22px rgba(15,23,42,0.22)',
          }}
        >
          Choose a different country
        </button>
      </div>
    </div>
  );
};

export default ComingSoonScreen;
