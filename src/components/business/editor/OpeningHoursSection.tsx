import React from 'react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { BIZ } from '@/components/business/businessTokens';
import { HINT_CLASS } from '@/components/manage/fieldTreatment';
import { DAYS_ORDER, Day, OpeningHours, OpeningHoursEntry } from './editorTypes';

interface Props {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  openingHours: OpeningHours;
  setOpeningHours: (v: OpeningHours) => void;
}

export function OpeningHoursSection({ enabled, setEnabled, openingHours, setOpeningHours }: Props) {
  const updateDay = (day: Day, patch: Partial<OpeningHoursEntry>) => {
    setOpeningHours({ ...openingHours, [day]: { ...openingHours[day], ...patch } });
  };
  const setAllDays = (entry: OpeningHoursEntry) => {
    const updated = {} as OpeningHours;
    DAYS_ORDER.forEach((d) => { updated[d] = { ...entry }; });
    setOpeningHours(updated);
  };
  const firstOpenDay = DAYS_ORDER.find((d) => !openingHours[d]?.closed);

  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      <SectionCard>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground">Show opening hours on my profile</p>
              <p className={HINT_CLASS} style={{ marginTop: 2 }}>
                Turn off if your hours vary or you'd rather not display them.
              </p>
            </div>
            <Toggle checked={enabled} onChange={setEnabled} />
          </div>

          {enabled && (
            <>
              <div className="space-y-1 pt-1">
                {DAYS_ORDER.map((day) => {
                  const entry = openingHours[day] ?? { open: '08:00', close: '18:00', closed: false };
                  return (
                    <div key={day} className="flex items-center gap-2 min-h-[44px]">
                      <span className="w-10 text-[13px] font-medium text-foreground flex-shrink-0">{day}</span>
                      {entry.closed ? (
                        <span className="flex-1 text-[13px] text-muted-foreground">Closed</span>
                      ) : (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="time"
                            value={entry.open}
                            onChange={(e) => updateDay(day, { open: e.target.value })}
                            className="flex-1 h-9 rounded-[8px] px-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[rgba(15,23,42,0.20)]"
                            style={{ background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.08)' }}
                          />
                          <span className="text-muted-foreground text-xs">-</span>
                          <input
                            type="time"
                            value={entry.close}
                            onChange={(e) => updateDay(day, { close: e.target.value })}
                            className="flex-1 h-9 rounded-[8px] px-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[rgba(15,23,42,0.20)]"
                            style={{ background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.08)' }}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => updateDay(day, { closed: !entry.closed })}
                        className="text-[12px] font-semibold flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-end"
                        style={{ color: entry.closed ? BIZ.amber : '#94A3B8' }}
                      >
                        {entry.closed ? 'Open' : 'Close'}
                      </button>
                    </div>
                  );
                })}
              </div>
              {firstOpenDay && (
                <button
                  type="button"
                  onClick={() => setAllDays(openingHours[firstOpenDay])}
                  className="text-[13px] font-semibold"
                  style={{ color: BIZ.amber }}
                >
                  + Apply Monday to all days
                </button>
              )}
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 26, borderRadius: 999,
        // Amber stays for OPEN: open-vs-closed is semantic here, not a
        // generic on/off. The closed track takes the shipped dark value.
        background: checked ? BIZ.amber : 'rgba(255,255,255,0.14)',
        position: 'relative', transition: 'background .15s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3, left: checked ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff', transition: 'left .15s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}
