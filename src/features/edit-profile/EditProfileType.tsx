/** CR1: parent owns shared saving/retry state; this group owns optimistic
 * state and serialises toggles until each partial save settles. */
import { useEffect, useRef, useState } from 'react';
import { CreatorSwitch } from '@/features/creator/CreatorSwitch';
import { analyticsEvents } from '@/utils/analyticsEvents';
export function EditProfileType({ isCreator, onSave }: { isCreator: boolean; onSave: (on: boolean) => Promise<boolean> }) {
  const [checked, setChecked] = useState(isCreator);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  useEffect(() => { if (!saving.current) setChecked(isCreator); }, [isCreator]);
  const toggle = async (on: boolean) => {
    if (saving.current) return;
    const previous = checked;
    saving.current = true; setBusy(true); setChecked(on);
    analyticsEvents.track('creator_profile_toggled', { on, surface: 'edit_profile' });
    try { if (!(await onSave(on))) setChecked(previous); }
    catch { setChecked(previous); }
    finally { saving.current = false; setBusy(false); }
  };
  return <>
    <div className="ep-group">Profile type</div>
    <div className="ep-rows" data-testid="ep-profile-type"><div className="ep-row"><span className="ep-creator-label">Creator profile</span><CreatorSwitch checked={checked} disabled={busy} onCheckedChange={on => void toggle(on)} /></div></div>
    <p className="ep-creator-note">Shows a Creator label, opens your profile on your videos, and puts the video from the day next to each round. Turn it off to go back to a standard profile; your videos stay in Posts.</p>
  </>;
}
