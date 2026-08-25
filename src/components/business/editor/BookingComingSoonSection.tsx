import React from 'react';
import { CalendarClock } from 'lucide-react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { BIZ } from '@/components/business/businessTokens';

export function BookingComingSoonSection() {
  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      <SectionCard>
        <div className="flex items-start gap-3" style={{ opacity: 0.75 }}>
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: BIZ.fill,
              border: `1px solid ${BIZ.hair}`,
            }}
          >
            <CalendarClock size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-foreground">Tee-time & lesson booking</p>
              <span
                className="text-[11px] font-bold uppercase tracking-[0.10em]"
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(247,147,30,0.12)',
                  color: BIZ.amber,
                }}
              >
                Coming soon
              </span>
            </div>
            <p className="text-[12.5px] text-muted-foreground mt-1 leading-snug">
              Take bookings directly on clbhouz. Launching in a future update.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
