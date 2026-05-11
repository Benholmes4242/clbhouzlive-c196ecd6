import React, { useMemo } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useRoundDetail } from '@/lib/whs/hooks';
import RoundStatStrip from './RoundStatStrip';
import RoundScorecard from './RoundScorecard';
import RoundBreakdown from './RoundBreakdown';

interface Props {
  scoreId: string | null;
  open: boolean;
  onClose: () => void;
  handicapDelta?: number | null;
}

const PAGE_BG = '#F8FAFC';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_TINT = 'rgba(247,147,30,0.10)';
const AMBER_DEEP = '#C97211';
const AMBER_INK = '#9A6116';
const WHITE_55 = 'rgba(255,255,255,0.70)';
const FONT_SERIF = 'Georgia, "Iowan Old Style", "Apple Garamond", serif';
const FONT_DISPLAY =
  'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const SheetSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div style={{ width: '100%', height: 132, background: 'rgba(15,23,42,0.06)' }} />
    <div style={{ padding: 20 }}>
      <div style={{ height: 60, background: 'rgba(15,23,42,0.06)', borderRadius: 8, marginBottom: 16 }} />
      <div style={{ height: 200, background: 'rgba(15,23,42,0.04)', borderRadius: 8 }} />
    </div>
  </div>
);

const SheetEmpty: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
    <p style={{ margin: '0 0 8px', fontSize: 14, color: INK_MUTE }}>
      No round to show yet.
    </p>
    <button
      onClick={onClose}
      style={{
        marginTop: 16,
        padding: '10px 20px',
        borderRadius: 999,
        background: AMBER,
        color: '#fff',
        border: 'none',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      Close
    </button>
  </div>
);

export const RoundDetailSheet: React.FC<Props> = ({ scoreId, open, onClose, handicapDelta }) => {
  const { data, isLoading } = useRoundDetail(scoreId, open);

  const parTotal = useMemo(() => {
    if (!data?.holes || data.holes.length === 0) return null;
    return data.holes.reduce((s, h) => s + (h.par ?? 0), 0);
  }, [data?.holes]);

  const subLine = useMemo(() => {
    if (!data) return '';
    return [
      parTotal != null ? `PAR ${parTotal}` : null,
      data.slope_rating != null ? `SL ${data.slope_rating}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }, [data, parTotal]);

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          className="fixed inset-0 z-[10001]"
          style={{ background: 'rgba(15,23,42,0.40)' }}
        />
        <DrawerPrimitive.Content
          aria-labelledby="round-detail-sheet-title"
          className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[20px] outline-none"
          style={{
            background: PAGE_BG,
            maxHeight: '92vh',
            overflow: 'hidden',
            boxShadow: '0 -10px 40px -10px rgba(15,23,42,0.25)',
          }}
        >
          <DrawerPrimitive.Title className="sr-only">
            {data?.course?.name ?? 'Round detail'}
          </DrawerPrimitive.Title>

          {isLoading ? (
            <SheetSkeleton />
          ) : !data ? (
            <SheetEmpty onClose={onClose} />
          ) : (
            <>
              {/* HERO — flush to top, drag handle overlays */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: 132,
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                {data.course_header_image && (
                  <img
                    src={data.course_header_image}
                    alt={data.course?.name ?? ''}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
                {/* forest-green tint */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(6,46,29,0.45)',
                  }}
                />
                {/* highlight + bottom darken */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(15,23,42,0.10) 40%, rgba(15,23,42,0.78) 100%)',
                  }}
                />

                {/* Drag handle overlay */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.50)',
                    zIndex: 3,
                  }}
                />

                {/* Close X */}
                <button
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 3,
                  }}
                >
                  <X size={14} color="#fff" strokeWidth={2.5} />
                </button>

                {/* Content stack at bottom */}
                <div
                  style={{
                    position: 'relative',
                    padding: '0 56px 12px 16px',
                    color: '#fff',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color: AMBER,
                      letterSpacing: '0.22em',
                      marginBottom: 4,
                    }}
                  >
                    {format(new Date(data.play_date), 'd MMM yyyy').toUpperCase()}
                  </div>
                  <h2
                    id="round-detail-sheet-title"
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 800,
                      fontFamily: FONT_SERIF,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                      textShadow: '0 2px 12px rgba(0,0,0,0.45)',
                    }}
                  >
                    {data.course?.name ?? 'Unknown course'}
                  </h2>
                  {subLine && (
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        color: WHITE_55,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {subLine}
                    </div>
                  )}
                </div>
              </div>

              {/* METRICS ROW */}
              <RoundStatStrip
                gross={data.adjusted_gross}
                stableford={data.stableford_points}
                differential={data.handicap_differential}
                handicapDelta={handicapDelta ?? null}
              />

              {/* SCORECARD */}
              {data.holes && data.holes.length > 0 && (
                <RoundScorecard holes={data.holes} isNineHole={data.is_nine_hole} />
              )}

              {!data.holes && (
                <div
                  style={{
                    margin: '14px 16px',
                    padding: '16px',
                    background: 'rgba(15,23,42,0.03)',
                    borderRadius: 12,
                    border: `1px dashed ${HAIRLINE}`,
                    textAlign: 'center',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: INK_MUTE }}>
                    No hole-by-hole data for this round.
                  </p>
                </div>
              )}

              {/* BREAKDOWN */}
              {data.holes && data.holes.length > 0 && (
                <RoundBreakdown holes={data.holes} />
              )}

              {/* FOOTER */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '12px 16px',
                  paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                  background: AMBER_TINT,
                  borderTop: `1px solid rgba(247,147,30,0.18)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.16em',
                      color: AMBER_DEEP,
                    }}
                  >
                    INDEX AT TIME
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: INK,
                      fontFamily: FONT_DISPLAY,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {data.handicap_index_at_time?.toFixed(1) ?? '—'}
                  </span>
                </div>
                {data.permalink_url && (
                  <a
                    href={data.permalink_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: '#fff',
                      color: AMBER_INK,
                      fontSize: 11,
                      fontWeight: 800,
                      textDecoration: 'none',
                      border: `1px solid rgba(247,147,30,0.20)`,
                      letterSpacing: '0.02em',
                      flexShrink: 0,
                    }}
                  >
                    Open in MyEG
                    <ExternalLink size={11} strokeWidth={2.4} />
                  </a>
                )}
              </div>
            </>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default RoundDetailSheet;
