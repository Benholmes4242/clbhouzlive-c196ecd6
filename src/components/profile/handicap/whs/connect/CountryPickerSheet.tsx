import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ChevronRight } from 'lucide-react';
import { WHS_COUNTRIES, type WhsCountry } from '@/lib/whs/whsCountries';
import { MiniFlag } from './MiniFlag';

const INK = '#0F172A';
const INK_55 = '#64748B';
const AMBER = '#F7931E';
const GREEN = '#059669';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (country: WhsCountry) => void;
}

export const CountryPickerSheet: React.FC<Props> = ({ open, onClose, onSelect }) => {
  const [query, setQuery] = useState('');

  const { supported, comingSoon } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? WHS_COUNTRIES.filter(c =>
          c.name.toLowerCase().includes(q) || c.body.toLowerCase().includes(q),
        )
      : WHS_COUNTRIES;
    return {
      supported: filtered.filter(c => c.supported),
      comingSoon: filtered.filter(c => !c.supported),
    };
  }, [query]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        data-country-picker
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.40)',
          zIndex: 10300,
          animation: 'fadeIn 200ms ease',
          pointerEvents: 'auto',
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: 0, right: 0, bottom: 0,
          maxHeight: '80vh',
          background: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONT,
          animation: 'slideUp 240ms cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -8px 30px rgba(15,23,42,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(15,23,42,0.18)',
          }} />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 18px 14px',
          borderBottom: '1px solid rgba(15,23,42,0.06)',
        }}>
          <div>
            <div style={{
              fontSize: 10.5, fontWeight: 800, color: AMBER,
              letterSpacing: '0.14em', marginBottom: 3,
            }}>
              SELECT COUNTRY
            </div>
            <div style={{
              fontSize: 17, fontWeight: 800, color: INK,
              letterSpacing: '-0.015em',
            }}>
              Where do you golf?
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(15,23,42,0.06)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
            }}
          >
            <X size={14} color="#475569" strokeWidth={2.4} />
          </button>
        </div>

        <div style={{ padding: '12px 18px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(15,23,42,0.04)', borderRadius: 10,
            padding: '8px 12px',
          }}>
            <Search size={16} color="rgba(15,23,42,0.50)" strokeWidth={2.2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries"
              style={{
                flex: 1, fontSize: 14,
                background: 'transparent', border: 'none', outline: 'none',
                color: INK, fontFamily: FONT,
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
          {supported.length > 0 && (
            <>
              <div style={{
                padding: '14px 18px 6px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN }} />
                <div style={{
                  fontSize: 9.5, fontWeight: 800, color: GREEN,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>
                  CONNECTED · {supported.length} {supported.length === 1 ? 'BODY' : 'BODIES'}
                </div>
              </div>

              {supported.map(c => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '12px 18px',
                    background: 'rgba(5,150,105,0.04)',
                    borderLeft: `3px solid ${GREEN}`,
                    borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                    borderRadius: 0,
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', fontFamily: FONT,
                  }}
                >
                  <MiniFlag iso={c.iso} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14.5, fontWeight: 700, color: INK,
                    }}>
                      {c.name}
                    </div>
                    <div style={{
                      fontSize: 11.5, color: GREEN, fontWeight: 600,
                    }}>
                      {c.body} · ready
                    </div>
                  </div>
                  <ChevronRight size={18} color="rgba(15,23,42,0.30)" strokeWidth={2} />
                </button>
              ))}
            </>
          )}

          {comingSoon.length > 0 && (
            <>
              <div style={{
                padding: '16px 18px 6px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(15,23,42,0.30)' }} />
                <div style={{
                  fontSize: 9.5, fontWeight: 800, color: INK_55,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>
                  COMING SOON
                </div>
              </div>

              {comingSoon.map(c => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '11px 18px',
                    background: 'transparent',
                    border: 'none', borderRadius: 0,
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', fontFamily: FONT,
                  }}
                >
                  <MiniFlag iso={c.iso} dimmed />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14.5, fontWeight: 600,
                      color: 'rgba(15,23,42,0.78)',
                    }}>
                      {c.name}
                    </div>
                    <div style={{
                      fontSize: 11.5, color: INK_55,
                    }}>
                      {c.body}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 9.5, fontWeight: 800, color: AMBER,
                    letterSpacing: '0.12em',
                    background: 'rgba(247,147,30,0.10)',
                    padding: '4px 8px', borderRadius: 6,
                  }}>
                    SOON
                  </div>
                </button>
              ))}
            </>
          )}

          <div style={{ padding: '18px 18px 4px', textAlign: 'center' }}>
            <button
              onClick={onClose}
              style={{
                fontSize: 13, color: INK_55,
                background: 'transparent', border: 'none', cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(15,23,42,0.20)',
                textUnderlineOffset: 3,
                fontFamily: FONT,
              }}
            >
              My country isn't listed
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  );
};

export default CountryPickerSheet;
