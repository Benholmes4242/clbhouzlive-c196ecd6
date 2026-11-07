/** Ask sheets share the canonical BottomSheet and the pro-profile sheet
 * chrome. Copy is the signed-off mock, word for word; the explainer's five
 * steps and sample card are fixed text, never live data. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { askKey, useProAnswers, useProAskWrite, useProInbox, useMyAskerLabel } from './useProAsk';
import { answerFooter, askerLabel, inboxTime, type ProInboxRow } from './proAskRules';

const Kicker = ({ first }: { first: string }) => <div className="pro-collection-kicker">ASK {first.toUpperCase()}</div>;

const EXPLAINER_STEPS: [string, string][] = [
  ['Members ask you questions', "About your practice, your kit, life on tour, anything. Up to 200 characters, so they're quick to read."],
  ['You choose which to answer', 'Answer the ones you like. Tap "Not for me" on the rest; the member isn\'t told you skipped it.'],
  ['Your answers show on your profile', 'Members mark answers as useful, and your most useful three show first. The person who asked gets a notification.'],
  ['Askers stay private', 'You see who asked. Everyone else only sees "a member", or "a member at" their club.'],
  ['Turn it off any time', "Your answers are hidden while it's off, and come back when you turn it on again."],
];

export function ProExplainerSheet({ userId, first, close }: { userId: string; first: string; close: () => void }) {
  const [busy, setBusy] = useState(false);
  const cache = useQueryClient();
  const turnOn = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('set_pro_ask_enabled', { p_on: true });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await Promise.all([
      cache.invalidateQueries({ queryKey: askKey(userId) }),
      cache.invalidateQueries({ queryKey: ['pro-profile', 'ask-inbox'] }),
    ]);
    toast.success(`Ask ${first} is on.`);
    close();
  };
  return (
    <BottomSheet open onClose={close} scrollBody ariaLabelledBy="pro-ask-title">
      <div className="pro-profile pro-profile-sheet pro-ask-sheet">
        <Kicker first={first} />
        <h2 id="pro-ask-title">Answer questions from members</h2>
        <div className="pro-ask-how">
          {EXPLAINER_STEPS.map(([title, text], i) => (
            <div key={title}><i>{i + 1}</i><p><b>{title}</b><span>{text}</span></p></div>
          ))}
        </div>
        <div className="pro-ask-eg">
          <div className="pro-ask-eg-label">HOW IT LOOKS ON YOUR PROFILE</div>
          <div className="pro-ask-q">
            <b>How do you practise in winter when the course is shut?</b>
            <p>An hour on the mat, then an hour putting on the carpet to a coin.</p>
            <div className="pro-ask-ft"><small>Asked by a member at Sundridge Park · 41 found this useful</small></div>
          </div>
        </div>
        <Button variant={null} size={null} className="pro-profile-command" disabled={busy} onClick={() => void turnOn()}>Turn on Ask {first}</Button>
        <Button variant={null} size={null} className="pro-ask-later" onClick={close}>Not now</Button>
      </div>
    </BottomSheet>
  );
}

export function ProAskSheet({ proId, first, viewerId, close }: { proId: string; first: string; viewerId?: string; close: () => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const write = useProAskWrite(proId);
  const label = useMyAskerLabel(viewerId, true);
  const labelText = label.isSuccess && !label.isError ? askerLabel(label.data.club, label.data.public) : 'a member';
  const send = async () => {
    setBusy(true);
    const ok = await write(() => supabase.rpc('ask_pro_question', { p_pro_id: proId, p_question: text.trim() }));
    setBusy(false);
    if (ok) {
      toast.success(`Sent. We'll tell you when ${first} answers.`);
      close();
    }
  };
  return (
    <BottomSheet open onClose={close} scrollBody ariaLabelledBy="pro-ask-title">
      <div className="pro-profile pro-profile-sheet pro-ask-sheet">
        <Kicker first={first} />
        <h2 id="pro-ask-title">Ask a question</h2>
        <Textarea
          className="pro-ask-ta"
          aria-label="Your question"
          maxLength={200}
          placeholder="What would you like to know?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="pro-ask-count">{text.length} / 200</div>
        <p className="pro-ask-priv">{first} sees your name. Everyone else sees "{labelText}".</p>
        <Button variant={null} size={null} className="pro-profile-command" disabled={busy || text.trim().length < 3} onClick={() => void send()}>Send to {first}</Button>
      </div>
    </BottomSheet>
  );
}

export function ProQuestionsSheet({ proId, first, close }: { proId: string; first: string; close: () => void }) {
  const [tab, setTab] = useState<'waiting' | 'answered'>('waiting');
  const [answerFor, setAnswerFor] = useState<ProInboxRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const navigate = useNavigate();
  const write = useProAskWrite(proId);
  const waiting = useProInbox('waiting', true);
  const answered = useProInbox('answered', tab === 'answered');
  // The answered count comes from the answers payload's total (already cached
  // from the section), so both segments read correctly before either tab loads.
  const answers = useProAnswers(proId);
  const answeredTotal = answers.isSuccess && !answers.isError ? answers.data.total : 0;
  const rows = tab === 'waiting' ? waiting : answered;
  const list = rows.isSuccess && !rows.isError ? rows.data : [];

  const decline = async (id: string) => {
    setBusyId(id);
    await write(() => supabase.rpc('decline_pro_question', { p_question_id: id }));
    setBusyId(null);
  };
  const turnOff = async () => {
    const ok = await write(() => supabase.rpc('set_pro_ask_enabled', { p_on: false }));
    if (ok) close();
  };
  const openAsker = (row: ProInboxRow) => {
    const id = row.asker_username || row.asker_id;
    if (id) navigate(`/profile/${id}`);
  };

  return (
    <BottomSheet open onClose={close} scrollBody ariaLabelledBy="pro-ask-title">
      <div className="pro-profile pro-profile-sheet pro-ask-sheet">
        <Kicker first={first} />
        <h2 id="pro-ask-title">Questions for you</h2>
        <div className="pro-ask-seg" role="tablist">
          <Button variant={null} size={null} role="tab" aria-selected={tab === 'waiting'} className={tab === 'waiting' ? 'on' : ''} onClick={() => setTab('waiting')}>Waiting · {waiting.isSuccess ? waiting.data.length : 0}</Button>
          <Button variant={null} size={null} role="tab" aria-selected={tab === 'answered'} className={tab === 'answered' ? 'on' : ''} onClick={() => setTab('answered')}>Answered · {answeredTotal}</Button>
        </div>
        <div className="pro-ask-inbox">
          {list.map((row) => (
            <div className="pro-ask-iq" key={row.id}>
              <div className="pro-ask-who">
                <Button variant={null} size={null} className="pro-ask-who-btn" onClick={() => openAsker(row)} aria-label={`Open ${row.asker_name}'s profile`}>
                  <SquircleAvatar size={34} hairlineRing src={row.asker_avatar} alt={row.asker_name} userId={row.asker_id ?? undefined} />
                </Button>
                <div>
                  <Button variant={null} size={null} className="pro-ask-who-name" onClick={() => openAsker(row)}>{row.asker_name}</Button>
                  <small>{[inboxTime(row.created_at), row.asker_club].filter(Boolean).join(' · ')}</small>
                </div>
              </div>
              <div className="pro-ask-qt">{row.question}</div>
              {tab === 'waiting' ? (
                <div className="pro-ask-acts">
                  <Button variant={null} size={null} className="pro-ask-answer-btn" onClick={() => setAnswerFor(row)}>Answer</Button>
                  <Button variant={null} size={null} className="pro-ask-decline" disabled={busyId === row.id} onClick={() => void decline(row.id)}>Not for me</Button>
                </div>
              ) : (
                <>
                  {row.answer && <p className="pro-ask-answered">{row.answer}</p>}
                  <Button variant={null} size={null} className="pro-ask-edit" onClick={() => setAnswerFor(row)}>Edit answer</Button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="pro-ask-onrow">
          <div><b>Members can ask you questions</b><small>Turn this off and nobody can ask, and your answers are hidden until you turn it back on.</small></div>
          <Switch checked onCheckedChange={(on) => { if (!on) void turnOff(); }} aria-label="Members can ask you questions" />
        </div>
        {answerFor && <ProAnswerSheet proId={proId} first={first} row={answerFor} close={() => setAnswerFor(null)} />}
      </div>
    </BottomSheet>
  );
}

export function ProAnswerSheet({ proId, first, row, close }: { proId: string; first: string; row: ProInboxRow; close: () => void }) {
  const editing = !!row.answer;
  const [text, setText] = useState(row.answer ?? '');
  const [busy, setBusy] = useState(false);
  const write = useProAskWrite(proId);
  const askerFirst = row.asker_name.split(' ')[0] || row.asker_name;
  const post = async () => {
    setBusy(true);
    const ok = await write(() => supabase.rpc('answer_pro_question', { p_question_id: row.id, p_answer: text.trim() }));
    setBusy(false);
    if (ok) close();
  };
  return (
    <BottomSheet open onClose={close} scrollBody ariaLabelledBy="pro-answer-title">
      <div className="pro-profile pro-profile-sheet pro-ask-sheet">
        <Kicker first={first} />
        <h2 id="pro-answer-title">Your answer</h2>
        <div className="pro-ask-quote">
          <b>{row.question}</b>
          <small>{[row.asker_name, row.asker_club].filter(Boolean).join(' · ')}</small>
        </div>
        <Textarea
          className="pro-ask-ta"
          aria-label="Write your answer"
          maxLength={600}
          placeholder="Write your answer"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="pro-ask-count">{text.length} / 600</div>
        <p className="pro-ask-priv">
          {editing
            ? 'Your answer shows on your profile.'
            : `Your answer shows on your profile, and ${askerFirst} gets a notification. Members see the question as from "${askerLabel(row.asker_club, !!row.asker_club)}".`}
        </p>
        <Button variant={null} size={null} className="pro-profile-command" disabled={busy || !text.trim()} onClick={() => void post()}>Post answer</Button>
      </div>
    </BottomSheet>
  );
}

export function ProAllAnswersSheet({ proId, first, owner, close }: { proId: string; first: string; owner: boolean; close: () => void }) {
  const [offset, setOffset] = useState(0);
  const query = useProAnswers(proId, 20, offset);
  const data = query.isSuccess && !query.isError ? query.data : null;
  return (
    <BottomSheet open onClose={close} scrollBody ariaLabelledBy="pro-ask-title">
      <div className="pro-profile pro-profile-sheet pro-ask-sheet">
        <Kicker first={first} />
        <h2 id="pro-ask-title">Answers</h2>
        <div className="pro-ask-list">
          {data?.answers.map((a) => (
            <div className="pro-ask-q" key={a.id}>
              <b>{a.question}</b>
              <p>{a.answer}</p>
              <div className="pro-ask-ft"><small>{answerFooter(a.asker_label, a.useful)}</small></div>
            </div>
          ))}
        </div>
        {data && offset + 20 < data.total && (
          <Button variant={null} size={null} className="pro-ask-more" onClick={() => setOffset(offset + 20)}>See more ›</Button>
        )}
        {!owner && null}
      </div>
    </BottomSheet>
  );
}
