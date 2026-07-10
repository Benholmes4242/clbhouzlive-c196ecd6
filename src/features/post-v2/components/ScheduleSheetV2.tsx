// ScheduleSheetV2 - native datetime-local pickers + presets + View Scheduled footer.

import { useState } from 'react';
import BottomSheet from './BottomSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  value: Date | null;
  onChange: (d: Date | null) => void;
  onOpenScheduled: () => void;
  scheduledCount: number;
}

function toLocal(dt: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export default function ScheduleSheetV2({ open, onClose, value, onChange, onOpenScheduled, scheduledCount }: Props) {
  const [draft, setDraft] = useState<string>(value ? toLocal(value) : '');

  const apply = () => {
    if (!draft) { onChange(null); onClose(); return; }
    const d = new Date(draft);
    if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      alert('Pick a future time.');
      return;
    }
    onChange(d);
    onClose();
  };

  const preset = (mins: number) => {
    const d = new Date(Date.now() + mins * 60_000);
    setDraft(toLocal(d));
  };

  return (
    <BottomSheet open={open} title="Schedule for later" onClose={onClose}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="datetime-local"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, fontSize: 14 }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['In 1 hour', 60],
            ['This evening 6pm', -1],
            ['Tomorrow 9am', -2],
          ].map(([label, mins]) => (
            <button
              key={label as string}
              onClick={() => {
                if (mins === -1) {
                  const d = new Date(); d.setHours(18, 0, 0, 0); if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1); setDraft(toLocal(d));
                } else if (mins === -2) {
                  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); setDraft(toLocal(d));
                } else {
                  preset(mins as number);
                }
              }}
              style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#1F2428' }}
            >{label as string}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => { onChange(null); setDraft(''); onClose(); }} style={{ flex: 1, background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '10px', fontSize: 14, cursor: 'pointer' }}>Clear</button>
          <button onClick={apply} style={{ flex: 1, background: '#15171F', color: '#F5F6F7', border: 0, borderRadius: 12, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
        </div>
      </div>
      <button onClick={onOpenScheduled} style={{ display: 'block', width: '100%', border: 0, borderTop: '1px solid rgba(0,0,0,0.07)', background: 'transparent', padding: '14px 16px', textAlign: 'left', fontSize: 13, color: '#1F2428', cursor: 'pointer' }}>
        View scheduled - {scheduledCount}
      </button>
    </BottomSheet>
  );
}
