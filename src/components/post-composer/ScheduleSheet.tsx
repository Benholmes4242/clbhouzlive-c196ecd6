// ScheduleSheet — date + time picker for scheduling a post.
//
// The user picks a LOCAL date/time. We hand the parent a `Date` object
// (timezone-naive in display, anchored to the user's local tz). The caller
// converts to UTC at save time via `.toISOString()`.
//
// Validation rule: the chosen time must be at least MIN_LEAD_MINUTES in the
// future. Past / too-soon picks are rejected inline.

import React, { useEffect, useMemo, useState } from 'react';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';

const INK = '#1C1C1E';
const INK_2 = '#0F172A';
const INK_MUTE = '#64748B';
const SURFACE = '#FFFFFF';
const PAGE = '#F8FAFC';
const CHIP = '#F5F5F7';
const HAIR = 'rgba(15,23,42,0.07)';
const AMBER = '#F7931E';
const DANGER = '#DC2626';

const MIN_LEAD_MINUTES = 5;

/** Default = now + 1h, rounded up to the next quarter hour. */
function defaultScheduledAt(): Date {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const q = 15;
  const minutes = Math.ceil(d.getMinutes() / q) * q;
  d.setMinutes(minutes, 0, 0);
  return d;
}

/** Format a Date into the value expected by <input type="datetime-local">. */
function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function formatLocalReadable(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function tzLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time';
  } catch {
    return 'local time';
  }
}

interface ScheduleSheetProps {
  open: boolean;
  initialValue?: Date | null;
  busy?: boolean;
  title?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (when: Date) => void;
}

export function ScheduleSheet({
  open,
  initialValue,
  busy = false,
  title = 'Schedule post',
  confirmLabel = 'Schedule',
  onCancel,
  onConfirm,
}: ScheduleSheetProps) {
  const [value, setValue] = useState<string>(
    toLocalInputValue(initialValue && initialValue > new Date() ? initialValue : defaultScheduledAt())
  );

  // Reset the picker each time the sheet (re-)opens.
  useEffect(() => {
    if (!open) return;
    setValue(
      toLocalInputValue(
        initialValue && initialValue > new Date() ? initialValue : defaultScheduledAt()
      )
    );
  }, [open, initialValue]);

  const parsed = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  }, [value]);

  const minIso = useMemo(
    () => toLocalInputValue(new Date(Date.now() + MIN_LEAD_MINUTES * 60 * 1000)),
    // re-evaluated on each open via state reset
    [open] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const minutesAhead = parsed ? (parsed.getTime() - Date.now()) / 60000 : 0;
  const tooSoon = !parsed || minutesAhead < MIN_LEAD_MINUTES;
  const errorText = !parsed
    ? 'Pick a date and time'
    : tooSoon
      ? `Pick a time at least ${MIN_LEAD_MINUTES} minutes from now`
      : null;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 10003,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: PAGE,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
          boxShadow: '0 -10px 30px rgba(15,23,42,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: HAIR }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <CalendarIcon size={18} color={INK_2} strokeWidth={2.25} />
          <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 800, color: INK }}>
            {title}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: CHIP,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: INK_MUTE,
            }}
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        </div>

        <label
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 700,
            color: INK_MUTE,
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Date &amp; time
        </label>
        <input
          type="datetime-local"
          value={value}
          min={minIso}
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: SURFACE,
            border: `1px solid ${HAIR}`,
            borderRadius: 12,
            fontSize: 16,
            color: INK_2,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: INK_MUTE,
          }}
        >
          <Clock size={12} strokeWidth={2} />
          <span>
            {parsed && !tooSoon
              ? `Publishes ${formatLocalReadable(parsed)} (${tzLabel()})`
              : `Your timezone: ${tzLabel()}`}
          </span>
        </div>

        {errorText && (
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: DANGER }}>
            {errorText}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 14,
              border: `1px solid ${HAIR}`,
              background: SURFACE,
              color: INK_2,
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => parsed && !tooSoon && onConfirm(parsed)}
            disabled={busy || !parsed || tooSoon}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 14,
              border: 'none',
              background: !parsed || tooSoon ? CHIP : INK_2,
              color: !parsed || tooSoon ? '#94A3B8' : '#fff',
              fontSize: 14,
              fontWeight: 800,
              cursor: busy || !parsed || tooSoon ? 'default' : 'pointer',
              boxShadow: !parsed || tooSoon ? 'none' : '0 2px 10px rgba(15,23,42,0.18)',
            }}
          >
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: INK_MUTE,
            textAlign: 'center',
          }}
        >
          We&rsquo;ll publish it automatically at the time you pick.
        </div>
        <span style={{ display: 'none', color: AMBER }} aria-hidden />
      </div>
    </div>
  );
}

export default ScheduleSheet;
