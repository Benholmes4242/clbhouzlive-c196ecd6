/** BE1 edit-only frame: create mode retains its existing shell. Profile stays
 * mounted while Settings is selected so draft fields and photo controls survive. */
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import '@/features/business-create/business-create.css';
import '@/features/edit-profile/edit-profile.css';
import './business-edit.css';

export function BusinessEditFrame({ editing, tab, onTab, onBack, settings, children }: {
  editing: boolean; tab: 'profile' | 'settings'; onTab: (tab: 'profile' | 'settings') => void;
  onBack: () => void; settings: ReactNode; children: ReactNode;
}) {
  if (!editing) return <ManagePageShell title="Create a business" onBack={onBack}>{children}</ManagePageShell>;
  return <div className="ep-shell be1-shell">
    <header className="ep-head">
      <Button type="button" variant="ghost" className="ep-back" aria-label="Back" onClick={onBack}><ChevronLeft size={20} strokeWidth={2} /></Button>
      <div className="ep-title">Edit business</div>
    </header>
    <div className="ep-tabs" role="tablist">
      {(['profile', 'settings'] as const).map(value => <Button key={value} type="button" variant="ghost" role="tab" className="ep-tab" aria-selected={tab === value} onClick={() => onTab(value)}>{value === 'profile' ? 'Profile' : 'Settings'}</Button>)}
    </div>
    <main className="ep-body be1-profile-body" hidden={tab !== 'profile'}>{children}</main>
    {tab === 'settings' ? <main className="ep-body">{settings}</main> : null}
  </div>;
}