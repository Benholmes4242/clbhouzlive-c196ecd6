/** Lookup is input-bound and cancellable: stale responses cannot enable Send. */
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import { supabase } from '@/integrations/supabase/client';
import { invokeWagrError, wagrError, type WagrLookup } from './wagrSettingsRules';
import './wagr-settings.css';
export function WagrLinkSheet({ userId, open, onClose }: { userId: string; open: boolean; onClose: () => void }) {
  const cache = useQueryClient();
  const [input, setInput] = useState('');
  const [found, setFound] = useState<{ input: string; profile: WagrLookup } | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!open) { setInput(''); setFound(null); setError(''); } }, [open]);
  useEffect(() => {
    setFound(null); setError('');
    if (!open || !input.trim()) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const current = input.trim();
      if (!/(^|\/)[a-z0-9-]+-\d+\/?$/.test(current)) { setError(wagrError('not_a_wagr_link')); return; }
      try {
        const result = await supabase.functions.invoke('wagr-link', { body: { action: 'lookup', input: current } });
        if (cancelled) return;
        if (result.error || result.data?.error) { const message = await invokeWagrError(result.error, result.data); if (!cancelled) setError(message); return; }
        const profile = result.data as WagrLookup;
        if (profile.isPro) setError(wagrError('wagr_profile_is_pro'));
        else setFound({ input: current, profile });
      } catch { if (!cancelled) setError(wagrError()); }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [input, open]);
  const ready = !!found && found.input === input.trim() && !found.profile.isPro && !error;
  const send = async () => {
    if (!ready || saving) return;
    setSaving(true);
    try {
      const result = await supabase.functions.invoke('wagr-link', { body: { action: 'request', input: input.trim() } });
      if (result.error || result.data?.error) { setError(await invokeWagrError(result.error, result.data)); return; }
      await cache.invalidateQueries({ queryKey: ['wagr-link', userId] });
      onClose();
    } catch { setError(wagrError()); } finally { setSaving(false); }
  };
  return <Sheet open={open} onOpenChange={value => { if (!value && !saving) onClose(); }}><SheetContent side="bottom" hideCloseButton className="wagr-settings wagr-sheet">
    <div className="wagr-grab" />
    <div className="wagr-kicker">WORLD AMATEUR GOLF RANKING</div>
    <SheetTitle className="wagr-heading">Link your WAGR profile</SheetTitle>
    <SheetDescription className="st2-line">Open your profile on wagr.com, copy the address and paste it here.</SheetDescription>
    <label className="wagr-field"><span>Your WAGR profile</span><input value={input} onChange={event => { setFound(null); setError(''); setInput(event.target.value); }} autoCorrect="off" autoCapitalize="none" inputMode="url" disabled={saving} /></label>
    {error ? <p className="st2-line" role="alert">{error}</p> : found && <div className="wagr-found"><ProLabel size="large" kind="am" /><span><b>{found.profile.name}</b><small>{found.profile.country}{found.profile.country ? ' · ' : ''}{found.profile.rank == null ? 'not currently ranked' : `world amateur rank ${found.profile.rank}`}</small></span></div>}
    <p className="st2-line wagr-small">We check it's really you before anything shows on your profile. You'll get a notification when it's done.</p>
    <Button variant="ghost" className="st2-connect wagr-send" disabled={!ready || saving} onClick={send}>Send for checking</Button>
  </SheetContent></Sheet>;
}