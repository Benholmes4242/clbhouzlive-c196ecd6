/** ASK {FIRST} — verified tour pros only, mounted after CAREER. One settled
 * read decides the section exists; a failed read renders nothing. Amber is
 * reserved for what only the viewer sees: their own waiting question and the
 * pro's own waiting count. Guests get the gate, never a working control. */
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useGuestActionGate } from '@/features/guest/useGuestActionGate';
import { getGuestUser } from '@/features/guest/guestGateStore';
import { useProAnswers, useProAskWrite } from './useProAsk';
import { answerFooter, type ProAnswer } from './proAskRules';
import { ProAskSheet, ProExplainerSheet, ProQuestionsSheet, ProAllAnswersSheet } from './ProAskSheets';

export function ProAskSection({ userId, owner, first, viewerId }: { userId: string; owner: boolean; first: string; viewerId?: string }) {
  const query = useProAnswers(userId);
  const gate = useGuestActionGate();
  const write = useProAskWrite(userId);
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState<'ask' | 'explainer' | 'questions' | 'all' | null>(null);
  const [useful, setUseful] = useState<Record<string, { mine: boolean; count: number }>>({});
  const sectionRef = useRef<HTMLElement>(null);
  const isGuest = !!getGuestUser();

  // Deep links from Activity: ?ask=inbox opens his questions on Waiting,
  // ?ask=section scrolls the section into view. Consumed once, then cleared.
  useEffect(() => {
    const ask = params.get('ask');
    if (!ask) return;
    if (ask === 'inbox' && owner) setSheet('questions');
    if (ask === 'section') sectionRef.current?.scrollIntoView({ block: 'start' });
    const next = new URLSearchParams(params);
    next.delete('ask');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, owner]);

  if (!query.isSuccess || query.isError) return null;
  const data = query.data;
  const waiting = owner ? data.waiting ?? 0 : 0;
  const showInvitation = !owner && data.enabled && data.total === 0 && data.my_waiting.length === 0;

  const toggleUseful = async (a: ProAnswer) => {
    if (gate('other', { firstName: first })) return;
    const current = useful[a.id] ?? { mine: a.mine, count: a.useful };
    const nextMine = !current.mine;
    setUseful((m) => ({ ...m, [a.id]: { mine: nextMine, count: Math.max(0, current.count + (nextMine ? 1 : -1)) } }));
    const ok = await write(() => supabase.rpc('toggle_pro_answer_useful', { p_question_id: a.id }));
    if (!ok) setUseful((m) => ({ ...m, [a.id]: current }));
  };

  const answerCard = (a: ProAnswer, withUseful: boolean) => {
    const state = useful[a.id] ?? { mine: a.mine, count: a.useful };
    return (
      <div className="pro-ask-q" key={a.id}>
        <b>{a.question}</b>
        <p>{a.answer}</p>
        <div className="pro-ask-ft">
          <small>{answerFooter(a.asker_label, state.count)}</small>
          {withUseful && (
            <Button variant={null} size={null} className={`pro-ask-useful${state.mine ? ' on' : ''}`} onClick={() => void toggleUseful(a)}>
              {state.mine ? '✓ Useful' : 'Useful'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const headerRight = owner
    ? waiting > 0
      ? <Button variant={null} size={null} className="pro-ask-waiting" onClick={() => setSheet('questions')}>{waiting} waiting ›</Button>
      : null
    : data.enabled && !showInvitation
      ? <Button variant={null} size={null} className="pro-ask-door" onClick={() => { if (!gate('other', { firstName: first })) setSheet('ask'); }}>Ask a question</Button>
      : null;

  let body: React.ReactNode = null;
  if (!owner && !data.enabled) return null;
  if (showInvitation) {
    body = (
      <div className="pro-ask-card">
        <div><b>Ask {first} anything</b><small>Practice, kit, life on tour. His answers show here.</small></div>
        <Button variant={null} size={null} className="pro-ask-card-btn" onClick={() => { if (!gate('other', { firstName: first })) setSheet('ask'); }}>Ask</Button>
      </div>
    );
  } else if (owner && !data.enabled) {
    body = (
      <div className="pro-profile-add pro-profile-dashed">
        <div><b>Answer questions from members</b><small>Members ask about your practice, kit and life on tour. You pick which to answer, and your answers show here on your profile.</small></div>
        <Button variant={null} size={null} className="pro-ask-card-btn" onClick={() => setSheet('explainer')}>See how</Button>
      </div>
    );
  } else if (owner && data.total === 0 && waiting === 0) {
    body = (
      <div className="pro-profile-add pro-profile-dashed">
        <div><b>Questions from members show here</b><small>Members can ask you about practice, kit and life on tour. You choose which to answer.</small></div>
      </div>
    );
  } else if (data.my_waiting.length > 0 || data.answers.length > 0) {
    body = (
      <div className="pro-ask-list">
        {!owner && data.my_waiting.map((w) => (
          <div className="pro-ask-q pro-ask-mine" key={w.id}>
            <span className="pro-ask-kicker">YOUR QUESTION · WAITING FOR {first.toUpperCase()}</span>
            <b>{w.question}</b>
          </div>
        ))}
        {data.answers.map((a) => answerCard(a, !owner))}
        {data.total > 3 && (
          <Button variant={null} size={null} className="pro-ask-more" onClick={() => setSheet('all')}>See all {data.total} answers ›</Button>
        )}
      </div>
    );
  }

  return (
    <section data-pro-ask ref={sectionRef} className="pro-profile-section">
      <div className="pro-profile-heading"><h2>ASK {first.toUpperCase()}</h2>{headerRight}</div>
      {body}
      {sheet === 'ask' && !isGuest && <ProAskSheet proId={userId} first={first} viewerId={viewerId} close={() => setSheet(null)} />}
      {sheet === 'explainer' && <ProExplainerSheet first={first} close={() => setSheet(null)} />}
      {sheet === 'questions' && owner && <ProQuestionsSheet proId={userId} first={first} close={() => setSheet(null)} />}
      {sheet === 'all' && <ProAllAnswersSheet proId={userId} first={first} owner={owner} close={() => setSheet(null)} />}
    </section>
  );
}
