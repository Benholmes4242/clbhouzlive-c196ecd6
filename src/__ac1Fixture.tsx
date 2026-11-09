import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AddCourseClubSection, { type ClubFormFields } from '@/features/admin/components/AddCourseClubSection';
import { adminTheme as t } from '@/features/admin/theme';
const long = 'The Royal and Ancient Golfclub Königshof Sittensen und Umgebung Gesellschaft mbH';
const base: ClubFormFields = { name: `${long} - Championship Course`, country: '', sub_country: '', club_mode: 'new', club_mode_touched: true, club_name: '', club_name_touched: false, club_pick: null, club_auto: false, club_query: '' };
function P({ init, fixed }: { init: Partial<ClubFormFields>; fixed?: boolean }) {
  const [f, setF] = useState<ClubFormFields>({ ...base, ...init });
  return <div style={{ padding: 16, background: t.surface, borderBottom: '4px solid #ccc' }}><AddCourseClubSection form={f} patch={(p) => setF((x) => ({ ...x, ...p }))} fixedClub={fixed ? { id: 'c', name: long } : undefined} /></div>;
}
createRoot(document.getElementById('root')!).render(<>
  <P init={{}} />
  <P init={{ club_mode: 'existing', club_auto: true, club_pick: { id: 'p', name: long, sub_country: 'Niedersachsen' }, club_query: long }} />
  <P init={{}} fixed />
</>);
