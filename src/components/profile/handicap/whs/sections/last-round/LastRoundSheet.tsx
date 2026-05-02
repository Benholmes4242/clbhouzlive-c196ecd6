import React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { X, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useLastRoundDetail } from '@/lib/whs/hooks';
import RoundStatStrip from './RoundStatStrip';
import RoundScorecard from './RoundScorecard';
import RoundBreakdown from './RoundBreakdown';

interface Props {
  connectionId: string;
  open: boolean;
  onClose: () => void;
}

const PAGE_BG = '#F8FAFC';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER_TINT = 'rgba(247,147,30,0.10)';
const AMBER_DEEP = '#C97211';
const AMBER_INK = '#9A6116';
const GREEN = '#059669';
const FONT_SERIF = 'Georgia, "Iowan Old Style", "Apple Garamond", serif';
const FONT_DISPLAY =
  'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const relativeDay = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'TODAY';
  if (days === 1) return 'YESTERDAY';
  if (days < 7) return `${days} DAYS AGO`;
  return format(d, 'd MMM yyyy').toUpperCase();
};

const Chip: React.FC<{
  icon: React.ElementType | null;
  label: string;
  tone?: 'green' | 'default';
}> = ({ icon: Icon, label, tone = 'default' }) => {
  const isGreen = tone === 'green';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 10px',
        borderRadius: 999,
        background: isGreen ? 'rgba(5,150,105,0.10)' : 'rgba(15,23,42,0.04)',
        color: isGreen ? GREEN : 'rgba(15,23,42,0.78)',
        fontSize: 11,
        fontWeight: 700,
        border: `1px solid ${isGreen ? 'rgba(5,150,105,0.18)' : HAIRLINE}`,
      }}
    >
      {Icon && <Icon size={11} strokeWidth={2.4} />}
      {label}
    </span>
  );
};

const SheetSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div style={{ width: '100%', aspectRatio: '16 / 8', background: 'rgba(15,23,42,0.06)' }} />
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
        background: '#F7931E',
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

export const LastRoundSheet: React.FC<Props> = ({ connectionId, open, onClose }) => {
  // Lazy fetch — only when sheet is opened, but cache persists after close
  const { data, isLoading } = useLastRoundDetail(connectionId, open);

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
          aria-labelledby="last-round-sheet-title"
          className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[20px] outline-none"
          style={{
            background: PAGE_BG,
            maxHeight: '92vh',
            overflow: 'hidden',
            boxShadow: '0 -10px 40px -10px rgba(15,23,42,0.25)',
          }}
        >
          <DrawerPrimitive.Title className="sr-only">
            {data?.course?.name ?? 'Last round detail'}
          </DrawerPrimitive.Title>

          {isLoading ? (
            <SheetSkeleton />
          ) : !data ? (
            <SheetEmpty onClose={onClose} />
          ) : (
            <>
              {/* HERO */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 8',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                }}
              >
                {data.course_header_image && (
                  <img
                    src={data.course_header_image}
                    alt={data.course?.name ?? ''}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.85) 100%)',
                  }}
                />

                {/* Drag handle */}
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
                    background: 'rgba(255,255,255,0.6)',
                  }}
                />

                {/* Close */}
                <button
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.92)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} color={INK} strokeWidth={2.5} />
                </button>

                {/* Title block */}
                <div
                  style={{
                    position: 'absolute',
                    left: 20,
                    right: 20,
                    bottom: 16,
                    color: '#fff',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      opacity: 0.85,
                      marginBottom: 4,
                    }}
                  >
                    {relativeDay(data.play_date)}
                    {data.is_competition_score && ' · COMPETITION'}
                    {data.is_nine_hole && ' · 9 HOLES'}
                  </p>
                  <h2
                    id="last-round-sheet-title"
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 900,
                      fontFamily: FONT_SERIF,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                    }}
                  >
                    {data.course?.name ?? 'Unknown course'}
                  </h2>
                </div>
              </div>

              {/* SCROLLING BODY */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '4px 0 32px',
                }}
              >
                <RoundStatStrip
                  gross={data.adjusted_gross}
                  stableford={data.stableford_points}
                  differential={data.handicap_differential}
                />

                <div
                  style={{
                    padding: '0 20px',
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 8,
                  }}
                >
                  {data.is_counter && (
                    <Chip icon={Sparkles} label="Counter" tone="green" />
                  )}
                  {data.marker_name && (
                    <Chip icon={CheckCircle2} label={`Marker · ${data.marker_name}`} />
                  )}
                  {data.course_rating !== null && data.slope_rating !== null && (
                    <Chip
                      icon={null}
                      label={`${data.course_rating.toFixed(1)} / ${data.slope_rating}`}
                    />
                  )}
                  {data.course_handicap !== null && (
                    <Chip icon={null} label={`Course HCP ${data.course_handicap}`} />
                  )}
                  {data.pcc !== null && data.pcc !== 0 && (
                    <Chip icon={null} label={`PCC ${data.pcc > 0 ? '+' : ''}${data.pcc}`} />
                  )}
                </div>

                {data.holes && data.holes.length > 0 && (
                  <RoundScorecard holes={data.holes} isNineHole={data.is_nine_hole} />
                )}

                {data.holes && data.holes.length > 0 && (
                  <RoundBreakdown holes={data.holes} />
                )}

                {!data.holes && (
                  <div
                    style={{
                      margin: '24px 20px 0',
                      padding: '20px 16px',
                      background: 'rgba(15,23,42,0.03)',
                      borderRadius: 12,
                      border: `1px dashed ${HAIRLINE}`,
                      textAlign: 'center',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        color: INK,
                        marginBottom: 4,
                      }}
                    >
                      No hole-by-hole for this round
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: INK_MUTE,
                        lineHeight: 1.5,
                        maxWidth: 280,
                        marginInline: 'auto',
                      }}
                    >
                      England Golf doesn't always provide hole-level data. Future rounds
                      may include it.
                    </p>
                  </div>
                )}

                <div
                  style={{
                    margin: '20px 20px 0',
                    padding: '14px 16px',
                    background: AMBER_TINT,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: `1px solid rgba(247,147,30,0.18)`,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: '0.16em',
                        color: AMBER_DEEP,
                        marginBottom: 2,
                      }}
                    >
                      YOUR INDEX AT TIME
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 22,
                        fontWeight: 900,
                        color: INK,
                        fontFamily: FONT_DISPLAY,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                      }}
                    >
                      {data.handicap_index_at_time?.toFixed(1) ?? '—'}
                    </p>
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
                      }}
                    >
                      Open in MyEG
                      <ExternalLink size={11} strokeWidth={2.4} />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default LastRoundSheet;
