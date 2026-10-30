/** ST5 owns export presentation. Counts reuse ST2; only the open sheet reads
 * the caller-scoped summary. Sending never accepts a destination address. */
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import { useMemberRoundTotal } from '@/hooks/profile/useMemberRoundTotal';
import { supabase } from '@/integrations/supabase/client';
import { maskEmail } from './maskEmail';
import './settingsYourData.css';

type SendState = 'idle' | 'sending' | 'sent' | 'recent' | 'failed' | 'empty';
type Summary = { rounds: number; holes: number; courses: number };
export function SettingsYourData({ userId, email, connected }: { userId?: string; email?: string; connected: boolean }) {
  const total = useMemberRoundTotal(connected ? userId : undefined);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SendState>('idle');
  const busy = useRef(false);
  const identity = useRef(userId);
  identity.current = userId;
  useEffect(() => { setOpen(false); setState('idle'); }, [userId]);
  const summary = useQuery({
    queryKey: ['settings', 'rounds-export-summary', userId], enabled: open && connected && !!userId,
    staleTime: 0, retry: false,
    queryFn: async (): Promise<Summary> => {
      const { data, error } = await supabase.rpc('my_rounds_export_summary');
      if (error) throw error;
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid export summary');
      const { rounds, holes, courses } = data;
      if (typeof rounds !== 'number' || typeof holes !== 'number' || typeof courses !== 'number') throw new Error('Invalid export summary');
      return { rounds, holes, courses };
    },
  });
  const send = async () => {
    if (busy.current || !userId || !email) return;
    busy.current = true;
    const sender = userId;
    setState('sending');
    try {
      const { data, error } = await supabase.functions.invoke('email-my-rounds');
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
        console.error('[email-my-rounds]', details);
        throw error;
      }
      if (identity.current !== sender) return;
      setState(data?.ok === true && (data.status === 'sent' || data.status === 'recent') ? data.status : data?.status === 'empty' ? 'empty' : 'failed');
    } catch { if (identity.current === sender) setState('failed'); }
    finally { busy.current = false; }
  };
  if (!connected || !userId || total.state !== 'ok' || total.total == null || total.total <= 0) return null;
  const masked = maskEmail(email ?? '');
  const message = state === 'sent' ? `Check ${masked}. It can take a few minutes to arrive.`
    : state === 'recent' ? 'We sent it a few minutes ago. Check your inbox.'
    : state === 'failed' ? "Couldn't send it. Try again."
    : state === 'empty' ? 'No rounds to send yet.'
    : `Sent to ${masked}, usually within a few minutes.`;
  const facts = !summary.isFetching && !summary.isError ? summary.data : undefined;
  return <>
    <div className="ep-group">Your data</div>
    <div className="ep-rows" data-testid="settings-your-data"><Button variant="ghost" className="ep-row" onClick={() => { setState('idle'); setOpen(true); }}>
      <span className="ep-row-label">Rounds</span><span className="ep-row-value">Download all {total.total}</span><ChevronRight size={18} className="ep-row-chev" aria-hidden />
    </Button></div>
    {open && <BizcSheet title="Your rounds" sub="Every round you've logged on clbhouz, hole by hole, in one spreadsheet you can open in Excel or Numbers." testId="st5-your-data-sheet" hideAction onDone={() => setOpen(false)}>
      <div className="st5-facts">{(['rounds', 'holes', 'courses'] as const).map(key => <div className="st5-fact" key={key}><span className="st5-fact-label">{key[0].toUpperCase() + key.slice(1)}</span><span className="st5-fact-value tabular-nums" data-unknown={!facts} data-testid={`st5-${key}`}>{facts?.[key].toLocaleString('en-GB') ?? '–'}</span></div>)}
        <div className="st5-fact"><span className="st5-fact-label">Each round</span><span className="st5-fact-value">Date, course, rating and slope, gross, net, points, every hole</span></div>
      </div>
      <Button variant="ghost" className="st5-email" data-state={state} disabled={!email || ['sending', 'sent', 'recent', 'empty'].includes(state)} onClick={() => void send()}>{state === 'sending' ? 'Sending…' : state === 'sent' || state === 'recent' ? 'Sent' : 'Email it to me'}</Button>
      <p className="st5-message" data-state={state} role="status">{message}</p>
    </BizcSheet>}
  </>;
}