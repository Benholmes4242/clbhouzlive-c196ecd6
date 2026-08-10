// TEMPORARY probe — mounted only to screenshot BusinessCommandCard states.
import { useState } from 'react';
import { BusinessCommandCard } from '@/components/business/BusinessCommandCard';
import { AddBusinessCard } from '@/components/business/AddBusinessCard';

export default function BizCardProbe() {
  const [open, setOpen] = useState(true);
  const membership = {
    role: 'owner',
    business: {
      id: 'probe-1',
      name: 'Royal Probe Golf Club',
      logo_url: null,
      is_verified: false,
      club_id: 'course-1',
      city: 'St Andrews',
      region: 'Fife',
      country: 'Scotland',
      location: null,
    },
  } as never;
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560, margin: '0 auto' }}>
        <BusinessCommandCard
          membership={membership}
          userId="probe-user"
          expanded={open}
          onToggle={() => setOpen((v) => !v)}
        />
        <AddBusinessCard onClick={() => {}} />
      </div>
    </div>
  );
}
