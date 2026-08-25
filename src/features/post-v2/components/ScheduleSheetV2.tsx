// ScheduleSheetV2 - custom, no native inputs.
// Preset chips, 14-day date strip, hour + 15-min steppers, live summary,
// View scheduled footer.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/lib/toast';
import BottomSheet from './BottomSheet';
import { formatScheduleDay, formatScheduleTime } from '../lib/formatSchedule';
import { CT } from '@/features/_shared/composerTokens';

interface Props {
  open: boolean;
  onClose: () => void;
  value: Date | null;
  onChange: (d: Date | null) => void;
  onOpenScheduled?: () => void;
  scheduledCount?: number;
}

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfDay(d: Date) {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}



export default function ScheduleSheetV2({ open, onClose, value, onChange, onOpenScheduled, scheduledCount }: Props) {
  const now = useMemo(() => new Date(), [open]);
  const initial = value ?? (() => { const d = new Date(now.getTime() + 60 * 60_000); d.setSeconds(0, 0); d.setMinutes(Math.round(d.getMinutes() / 15) * 15); return d; })();
  const [selDate, setSelDate] = useState<Date>(startOfDay(initial));
  const [hour, setHour] = useState<number>(initial.getHours());
  const [minute, setMinute] = useState<number>(Math.round(initial.getMinutes() / 15) * 15 % 60);

  const stripRef = useRef<HTMLDivElement>(null);
  const selBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // reset from value each open
    const seed = value ?? (() => { const d = new Date(); d.setTime(Date.now() + 60 * 60_000); d.setSeconds(0, 0); d.setMinutes(Math.round(d.getMinutes() / 15) * 15); return d; })();
    setSelDate(startOfDay(seed));
    setHour(seed.getHours());
    setMinute(Math.round(seed.getMinutes() / 15) * 15 % 60);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      selBtnRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }, [open, selDate]);

  const days = useMemo(() => {
    const base = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(base); d.setDate(d.getDate() + i); return d;
    });
  }, [open]);

  const finalDate = useMemo(() => {
    const d = new Date(selDate);
    d.setHours(hour, minute, 0, 0);
    return d;
  }, [selDate, hour, minute]);

  const isPast = finalDate.getTime() <= Date.now();

  const setPreset = (kind: '1h' | 'eve' | 'tmr') => {
    let d: Date;
    if (kind === '1h') { d = new Date(Date.now() + 60 * 60_000); d.setSeconds(0, 0); d.setMinutes(Math.round(d.getMinutes() / 15) * 15); }
    else if (kind === 'eve') { d = new Date(); d.setHours(18, 0, 0, 0); if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1); }
    else { d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
    onChange(d);
    onClose();
  };

  const bumpHour = (delta: number) => setHour(h => (h + delta + 24) % 24);
  const bumpMinute = (delta: number) => setMinute(m => (m + delta + 60) % 60);

  const apply = () => {
    if (isPast) { toast('Pick a future time.'); return; }
    onChange(finalDate);
    onClose();
  };

  const clear = () => { onChange(null); onClose(); };

  return (
    <BottomSheet open={open} title="Schedule" onClose={onClose}>
      <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Preset chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Preset onClick={() => setPreset('1h')}>In 1 hour</Preset>
          <Preset onClick={() => setPreset('eve')}>This evening, 6pm</Preset>
          <Preset onClick={() => setPreset('tmr')}>Tomorrow, 9am</Preset>
        </div>

        <SectionLabel>Date</SectionLabel>
        <div ref={stripRef} style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -16px', padding: '0 16px 4px' }}>
          {days.map((d, i) => {
            const selected = sameDay(d, selDate);
            const isToday = i === 0;
            return (
              <button
                key={d.toISOString()}
                ref={selected ? selBtnRef : undefined}
                onClick={() => setSelDate(startOfDay(d))}
                style={{
                  flex: '0 0 auto',
                  width: 60,
                  padding: '10px 0 10px',
                  borderRadius: 14,
                  background: selected ? CT.ink : CT.cardBg,
                  border: selected ? 0 : '1px solid rgba(255,255,255,0.10)',
                  color: selected ? CT.canvas : CT.ink,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: isToday ? CT.amber : (selected ? CT.amber : CT.secondary) }}>{isToday ? 'TODAY' : DAY_LABELS[d.getDay()]}</span>
                <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{d.getDate()}</span>
                <span style={{ fontSize: 11, color: selected ? 'rgba(248,250,252,0.7)' : CT.secondary }}>{MONTH_LABELS[d.getMonth()]}</span>
              </button>
            );
          })}
        </div>

        <SectionLabel>Time</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <Stepper value={hour} format={(v) => String(v).padStart(2, '0')} onInc={() => bumpHour(1)} onDec={() => bumpHour(-1)} />
          <div style={{ fontSize: 34, fontWeight: 700, color: CT.ink, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"zero" 0' }}>:</div>
          <Stepper value={minute} format={(v) => String(v).padStart(2, '0')} onInc={() => bumpMinute(15)} onDec={() => bumpMinute(-15)} />
        </div>

        {/* Summary */}
        <div style={{ padding: '12px 14px', borderRadius: 12, background: CT.cardBg, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: isPast ? CT.danger : CT.ink }}>
            {isPast ? 'Pick a future time.' : (
              <>Goes live <span style={{ fontWeight: 700 }}>{formatScheduleDay(finalDate, now)}</span> - <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatScheduleTime(finalDate)}</span></>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {value && (
            <button onClick={clear} style={{ flex: 1, background: 'rgba(248,250,252,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', color: CT.ink }}>Clear</button>
          )}
          <button
            onClick={apply}
            disabled={isPast}
            style={{
              flex: 2,
              background: isPast ? 'rgba(247,147,30,0.4)' : CT.amber,
              color: CT.cardBg,
              border: 0,
              borderRadius: 12,
              padding: '12px',
              fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.10em',
              fontWeight: 700,
              cursor: isPast ? 'not-allowed' : 'pointer',
            }}
          >
            Set schedule
          </button>
        </div>
      </div>

      {onOpenScheduled && (
        <button
          onClick={onOpenScheduled}
          style={{ display: 'block', width: '100%', border: 0, borderTop: '1px solid rgba(255,255,255,0.08)', background: 'transparent', padding: '12px 16px', textAlign: 'left', fontSize: 13, color: CT.ink, cursor: 'pointer' }}
        >
          View scheduled - <span style={{ fontWeight: 700 }}>{scheduledCount ?? 0}</span>
        </button>
      )}
    </BottomSheet>
  );
}

function Preset({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: CT.cardBg,
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 999,
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 600,
        color: CT.ink,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: CT.secondary }}>{children}</div>
  );
}

function Stepper({ value, format, onInc, onDec }: { value: number; format: (n: number) => string; onInc: () => void; onDec: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button onClick={onInc} aria-label="Increase" style={stepBtn}><ChevronUp size={18} color={CT.secondary} /></button>
      <div style={{ fontSize: 34, fontWeight: 700, color: CT.ink, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"zero" 0', lineHeight: 1.05, minWidth: 56, textAlign: 'center' }}>{format(value)}</div>
      <button onClick={onDec} aria-label="Decrease" style={stepBtn}><ChevronDown size={18} color={CT.secondary} /></button>
    </div>
  );
}

const stepBtn: React.CSSProperties = {
  width: 40,
  height: 28,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
