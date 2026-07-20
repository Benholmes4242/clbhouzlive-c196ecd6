import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { X, Search, ChevronRight } from 'lucide-react';
import { WHS_COUNTRIES, type WhsCountry } from '@/lib/whs/whsCountries';
import { MiniFlag } from './MiniFlag';

const INK = '#0F172A';
const INK_45 = '#64748B';
const INK_30 = '#94A3B8';
const HAIR = 'rgba(15,23,42,0.08)';
const FIELD_FILL = '#F8FAFC';
const GREEN = '#059669';
const GREEN_BG = 'rgba(5,150,105,0.08)';
const SOON_BG = 'rgba(180,83,9,0.08)';
const SOON_FG = '#B45309';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (country: WhsCountry) => void;
}

export const CountryPickerSheet: React.FC<Props> = ({ open, onClose, onSelect }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  const { supported, comingSoon } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? WHS_COUNTRIES.filter(
          (c) => c.name.toLowerCase().includes(q) || c.body.toLowerCase().includes(q),
        )
      : WHS_COUNTRIES;
    return {
      supported: filtered.filter((c) => c.supported),
      comingSoon: filtered
        .filter((c) => !c.supported)
        .sort((a, b) => Number(!!b.comingSoon) - Number(!!a.comingSoon)),
    };
  }, [query]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        data-country-picker
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.40)',
          zIndex: 10300,
          animation: 'fadeIn 200ms ease',
        }}
      />

      <div
        data-country-picker
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '82vh',
          background: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          zIndex: 10301,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONT,
          animation: 'slideUp 240ms cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -8px 30px rgba(15,23,42,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.18)' }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px 12px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: INK_45,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Select country
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>
              Where do you golf?
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: FIELD_FILL,
              border: `1px solid ${HAIR}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <X size={16} color={INK_45} strokeWidth={2.4} />
          </button>
        </div>

        <div style={{ padding: '0 20px 12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: FIELD_FILL,
              border: `1px solid ${HAIR}`,
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <Search size={16} color={INK_45} strokeWidth={2.2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries"
              style={{
                flex: 1,
                fontSize: 14,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: INK,
                fontFamily: FONT,
              }}
            />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {supported.length > 0 && (
            <>
              <div
                style={{
                  padding: '10px 20px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: GREEN,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Connected · {supported.length} {supported.length === 1 ? 'Body' : 'Bodies'}
              </div>

              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {supported.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      background: GREEN_BG,
                      border: `1px solid rgba(5,150,105,0.28)`,
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    <MiniFlag iso={c.iso} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>{c.name}</div>
                      <div style={{ fontSize: 12.5, color: GREEN, fontWeight: 600 }}>
                        {c.body}
                      </div>
                    </div>
                    <ChevronRight size={18} color={GREEN} strokeWidth={2} />
                  </button>
                ))}
              </div>
            </>
          )}

          {comingSoon.length > 0 && (
            <>
              <div
                style={{
                  padding: '18px 20px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: INK_45,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Not yet supported
              </div>

              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {comingSoon.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      background: '#fff',
                      border: `1px solid ${HAIR}`,
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    <MiniFlag iso={c.iso} dimmed />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: INK_45 }}>{c.body}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: SOON_FG,
                        letterSpacing: '0.12em',
                        background: SOON_BG,
                        padding: '4px 8px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.comingSoon ? 'COMING SOON' : 'SOON'}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ padding: '20px 18px 4px', textAlign: 'center' }}>
            <button
              onClick={onClose}
              style={{
                fontSize: 13,
                color: INK_45,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
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
    </>,
    document.body,
  );
};

export default CountryPickerSheet;
