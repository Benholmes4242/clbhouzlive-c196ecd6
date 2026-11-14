/** Owner-only claims; lookup failure removes only the pending rank. Unlink/cancel
 * use the caller's row and invalidate dependent amateur reads after deletion. */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import { useShowTourResults } from '@/features/pro-verification/useShowTourResults';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { WagrLinkSheet } from './WagrLinkSheet';
import { useAmateurSummary } from './useAmateurRanking';
import { rankingUpdated, wagrOrdinal, type WagrLookup } from './wagrSettingsRules';
import '@/features/pro-verification/pro-status-controls.css';
import './wagr-settings.css';
export function SettingsWagrCard({ userId }: { userId: string }) {
  const cache = useQueryClient();
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const link = useQuery({ queryKey: ['wagr-link', userId], queryFn: async () => { const result = await supabase.from('amateur_rank_links').select('*').eq('user_id', userId).maybeSingle(); if (result.error) throw result.error; return result.data; } });
  const pending = link.data?.status === 'pending';
  const verified = link.data?.status === 'verified';
  const slug = link.data?.wagr_slug;
  const lookup = useQuery({ queryKey: ['wagr-lookup', slug], enabled: pending && !!slug, staleTime: 3600000, retry: false, queryFn: async () => { const result = await supabase.functions.invoke('wagr-link', { body: { action: 'lookup', input: slug } }); if (result.error || result.data?.error) throw result.error ?? new Error(result.data.error); return result.data as WagrLookup; } });
  const summary = useAmateurSummary(userId, verified);
  const remove = useMutation({ mutationFn: async () => { const result = await supabase.from('amateur_rank_links').delete().eq('user_id', userId); if (result.error) throw result.error; }, onSuccess: async () => { setUnlinkOpen(false); await Promise.all(['wagr-link', 'amateur-summary', 'amateur-history', 'amateur-events', 'profile'].map(prefix => cache.invalidateQueries({ queryKey: [prefix, userId] }))); }, onError: () => toast.error('Could not update. Please try again.') });
  const figure = (label: string, value: number | string | null | undefined) => <div className="st2-figure" data-figure={label}><b className="tabular-nums" data-unknown={value == null}>{value ?? '–'}</b><span>{label}</span></div>;
  return <><section className="st2-handicap wagr-settings" data-testid="settings-wagr-card">
    <div className="pro-status-card-head"><h3 className="st2-name">World Amateur Golf Ranking</h3>{pending ? <span className="pro-being-checked">BEING CHECKED</span> : verified ? <ProLabel size="large" kind="am" /> : null}</div>
    {link.isPending ? <p className="st2-line" role="status">Loading…</p> : link.isError ? <p className="st2-line" role="alert">Could not load your WAGR link.</p> : pending ? <>
      <p className="st2-line">We're checking that <b>{link.data?.wagr_name}{!lookup.isError && lookup.data?.rank != null ? ` · ${wagrOrdinal(lookup.data.rank)}` : ''}</b> is you. Nothing shows on your profile until we've confirmed it.</p>
      <Button variant="ghost" className="wagr-text" disabled={remove.isPending} onClick={() => remove.mutate()}>Cancel request</Button>
    </> : verified ? <>
      <span className="st2-status">Linked · {rankingUpdated(link.data?.last_synced_at)}</span>
      <div className="st2-figures">{figure('World rank', summary.isError ? null : summary.data?.rank)}{figure('Best', !summary.isError && summary.data?.best_rank != null ? wagrOrdinal(summary.data.best_rank) : null)}{figure('Events', summary.isError ? null : summary.data?.counting_events)}</div>
      <RankingResultsSwitch userId={userId} amateur />
      <Button variant="ghost" className="wagr-text" onClick={() => setUnlinkOpen(true)}>Unlink WAGR</Button>
    </> : <><p className="st2-line">Ranked in the World Amateur Golf Ranking? Link your WAGR profile and your ranking, events and the AM badge go on your profile, updated every week.</p><Button variant="ghost" className="st2-connect" onClick={() => setLinkOpen(true)}>Link your WAGR profile</Button></>}
  </section><WagrLinkSheet userId={userId} open={linkOpen} onClose={() => setLinkOpen(false)} />
  <Sheet open={unlinkOpen} onOpenChange={value => { if (!value && !remove.isPending) setUnlinkOpen(false); }}><SheetContent side="bottom" hideCloseButton className="wagr-settings wagr-sheet wagr-confirm"><div className="wagr-grab" /><SheetTitle className="wagr-heading">Unlink WAGR?</SheetTitle><SheetDescription className="st2-line">Your ranking, events and AM badge come off your profile. You can link again any time.</SheetDescription><Button className="wagr-confirm-action" disabled={remove.isPending} onClick={() => remove.mutate()}>Unlink</Button><Button variant="ghost" className="wagr-confirm-action wagr-confirm-cancel" disabled={remove.isPending} onClick={() => setUnlinkOpen(false)}>Cancel</Button></SheetContent></Sheet></>;
}
export function RankingResultsSwitch({ userId, amateur = false }: { userId: string; amateur?: boolean }) {
  const visibility = useShowTourResults(userId);
  const title = amateur ? 'Show my ranking and results' : 'Show my tour results';
  return <div className="st2-switch-row"><span className="st2-switch-copy">{title}<small>{amateur ? 'Off hides your ranking, events and figures from everyone. Your AM badge stays.' : 'Off hides your world ranking, results and tour stats from everyone. Your PRO badge stays.'}</small></span><Button variant="ghost" role="switch" aria-label={title} aria-checked={visibility.checked} disabled={visibility.disabled} className="bizc-switch st2-switch" onClick={() => visibility.toggle(!visibility.checked)}><i aria-hidden="true" /></Button></div>;
}