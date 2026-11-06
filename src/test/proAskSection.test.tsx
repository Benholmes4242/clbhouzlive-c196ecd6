import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

const h = vi.hoisted(() => ({
  answers: null as unknown,
  inbox: { waiting: [] as unknown[], answered: [] as unknown[] },
  profile: { home_club: 'Sundridge Park', home_club_visibility: 'public' } as Record<string, unknown>,
  rpcCalls: [] as { fn: string; args: Record<string, unknown> }[],
  rpcError: null as null | { message: string },
  guest: null as unknown,
  gate: vi.fn(() => false),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('sonner', () => ({ toast: { error: h.toastError, success: h.toastSuccess } }));
vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => h.guest, openGuestCard: vi.fn(), surfaceForPath: () => 'profile', getGuestCardRequest: () => null }));
vi.mock('@/features/guest/useGuestActionGate', () => ({
  useGuestActionGate: () => h.gate,
  gateGuestActionNow: () => false,
  useGuestSheetGate: (open: boolean) => open,
  assertNotGuestWrite: () => {},
  GuestGatedError: class extends Error {},
}));
vi.mock('@/integrations/supabase/client', () => {
  const from = (table: string) => {
    const b: Record<string, unknown> = {};
    ['select', 'eq', 'in', 'limit', 'order'].forEach((n) => { b[n] = () => b; });
    b.maybeSingle = () => Promise.resolve({ data: table === 'user_profiles' ? h.profile : null, error: null });
    b.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(res);
    return b;
  };
  const rpc = (fn: string, args: Record<string, unknown>) => {
    h.rpcCalls.push({ fn, args });
    if (h.rpcError) return Promise.resolve({ data: null, error: h.rpcError });
    if (fn === 'get_pro_answers') return Promise.resolve({ data: h.answers, error: null });
    if (fn === 'get_pro_question_inbox') return Promise.resolve({ data: h.inbox[(args.p_status as 'waiting' | 'answered') ?? 'waiting'], error: null });
    if (fn === 'toggle_pro_answer_useful') return Promise.resolve({ data: true, error: null });
    if (fn === 'set_pro_ask_enabled') return Promise.resolve({ data: true, error: null });
    if (fn === 'ask_pro_question') return Promise.resolve({ data: 'q-new', error: null });
    return Promise.resolve({ data: null, error: null });
  };
  return { supabase: { from, rpc } };
});

import { ProAskSection } from '@/features/pro-profile/ProAskSection';
import { getActivityLink } from '@/features/activity-v2/utils/activityLinks';

const QA = [
  { id: 'q1', question: 'How do you practise in winter?', answer: 'An hour on the mat.', answered_at: '2026-11-01T00:00:00Z', asker_label: 'a member at Sundridge Park', useful: 41, mine: false },
  { id: 'q2', question: 'What stat do you watch most?', answer: 'Proximity 100 to 150.', answered_at: '2026-11-02T00:00:00Z', asker_label: 'a member', useful: 0, mine: false },
  { id: 'q3', question: 'How did you get your card?', answer: 'Q school in Italy.', answered_at: '2026-11-03T00:00:00Z', asker_label: 'a member at Dartford', useful: 17, mine: true },
];
const MY_WAITING = [{ id: 'w1', question: 'Do you carry a 2-iron?', created_at: '2026-11-04T00:00:00Z' }];
const payload = (over: Record<string, unknown> = {}) => ({ enabled: true, total: 3, waiting: null, answers: QA, my_waiting: [], ...over });

function Where() { const l = useLocation(); return <div data-testid="where">{l.pathname}{l.search}</div>; }
function mount(owner: boolean, entry = '/u/pro1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={[entry]}><Routes>
    <Route path="/u/pro1" element={<><ProAskSection userId="pro1" owner={owner} first="Mason" viewerId="me" /><Where /></>} />
    <Route path="*" element={<Where />} />
  </Routes></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  h.answers = payload(); h.inbox = { waiting: [], answered: [] };
  h.profile = { home_club: 'Sundridge Park', home_club_visibility: 'public' };
  h.rpcCalls = []; h.rpcError = null; h.guest = null;
  h.gate.mockClear().mockReturnValue(false); h.toastError.mockReset(); h.toastSuccess.mockReset();
});

describe('pro ask — visitor view', () => {
  it('off renders no section', async () => {
    h.answers = payload({ enabled: false, total: 0, answers: [] });
    const { container } = mount(false);
    await new Promise((r) => setTimeout(r, 30));
    expect(container.querySelector('[data-pro-ask]')).toBeNull();
  });
  it('on with nothing shows the invitation card', async () => {
    h.answers = payload({ total: 0, answers: [] });
    mount(false);
    expect(await screen.findByText('Ask Mason anything')).toBeTruthy();
    expect(screen.getByText('Practice, kit, life on tour. His answers show here.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ask' })).toBeTruthy();
  });
  it('answers render up to 3 in the order the RPC returns', async () => {
    mount(false);
    await waitFor(() => expect(document.querySelectorAll('.pro-ask-q').length).toBe(3));
    const questions = [...document.querySelectorAll('.pro-ask-q>b')].map((b) => b.textContent);
    expect(questions).toEqual(QA.map((q) => q.question));
  });
  it('footer includes the useful count only above zero', async () => {
    mount(false);
    expect(await screen.findByText('Asked by a member at Sundridge Park · 41 found this useful')).toBeTruthy();
    expect(screen.getByText('Asked by a member')).toBeTruthy();
  });
  it('Useful toggles optimistically and calls the RPC', async () => {
    mount(false);
    const btn = (await screen.findAllByRole('button', { name: 'Useful' }))[0];
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText('Asked by a member at Sundridge Park · 42 found this useful')).toBeTruthy());
    expect(h.rpcCalls.some((c) => c.fn === 'toggle_pro_answer_useful' && c.args.p_question_id === 'q1')).toBe(true);
  });
  it('a guest tapping Useful gets the gate and no RPC', async () => {
    h.guest = { id: 'g1' }; h.gate.mockReturnValue(true);
    mount(false);
    const btn = (await screen.findAllByRole('button', { name: 'Useful' }))[0];
    fireEvent.click(btn);
    expect(h.gate).toHaveBeenCalled();
    expect(h.rpcCalls.some((c) => c.fn === 'toggle_pro_answer_useful')).toBe(false);
  });
  it('my_waiting renders the amber card only from my_waiting', async () => {
    h.answers = payload({ my_waiting: MY_WAITING });
    mount(false);
    expect(await screen.findByText('YOUR QUESTION · WAITING FOR MASON')).toBeTruthy();
    expect(document.querySelectorAll('.pro-ask-mine').length).toBe(1);
  });
  it('See all only when total > 3', async () => {
    mount(false);
    expect(await screen.findByText('See all 3 answers ›', {}, { timeout: 50 }).catch(() => null)).toBeNull();
    expect(screen.queryByText(/See all/)).toBeNull();
  });
  it('See all appears when total > 3 and opens the sheet', async () => {
    h.answers = payload({ total: 9 });
    mount(false);
    fireEvent.click(await screen.findByText('See all 9 answers ›'));
    expect(await screen.findByText('Answers')).toBeTruthy();
  });
});

describe('pro ask — his own view', () => {
  it('off shows the See how card', async () => {
    h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
    mount(true);
    expect(await screen.findByText('Answer questions from members')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'See how' })).toBeTruthy();
  });
  it('on with nothing shows the dashed info card with no button', async () => {
    h.answers = payload({ total: 0, waiting: 0, answers: [] });
    const { container } = mount(true);
    expect(await screen.findByText('Questions from members show here')).toBeTruthy();
    expect(container.querySelector('[data-pro-ask] .pro-ask-card-btn')).toBeNull();
  });
  it('amber waiting count only when waiting > 0', async () => {
    h.answers = payload({ waiting: 3 });
    mount(true);
    const link = await screen.findByText('3 waiting ›');
    expect((link as HTMLElement).className).toContain('pro-ask-waiting');
  });
  it('no waiting link at zero', async () => {
    h.answers = payload({ waiting: 0, total: 0, answers: [] });
    mount(true);
    await screen.findByText('Questions from members show here');
    expect(screen.queryByText(/waiting ›/)).toBeNull();
  });
  it('answer cards have no Useful button on his own view', async () => {
    mount(true);
    await waitFor(() => expect(document.querySelectorAll('.pro-ask-q').length).toBe(3));
    expect(screen.queryByRole('button', { name: /Useful/ })).toBeNull();
    expect(screen.getByText('Asked by a member at Sundridge Park · 41 found this useful')).toBeTruthy();
  });
});

describe('pro ask — explainer sheet', () => {
  it('five steps word for word, Turn on calls the RPC, Not now closes', async () => {
    h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
    mount(true);
    fireEvent.click(await screen.findByRole('button', { name: 'See how' }));
    expect(await screen.findByText('Members ask you questions')).toBeTruthy();
    expect(screen.getByText('You choose which to answer')).toBeTruthy();
    expect(screen.getByText('Your answers show on your profile')).toBeTruthy();
    expect(screen.getByText('Askers stay private')).toBeTruthy();
    expect(screen.getByText('Turn it off any time')).toBeTruthy();
    expect(screen.getByText('HOW IT LOOKS ON YOUR PROFILE')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Turn on Ask Mason' }));
    await waitFor(() => expect(h.rpcCalls.some((c) => c.fn === 'set_pro_ask_enabled' && c.args.p_on === true)).toBe(true));
  });
  it('Not now closes without calling the RPC', async () => {
    h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
    mount(true);
    fireEvent.click(await screen.findByRole('button', { name: 'See how' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    await waitFor(() => expect(screen.queryByText('Members ask you questions')).toBeNull());
    expect(h.rpcCalls.some((c) => c.fn === 'set_pro_ask_enabled')).toBe(false);
  });
});

describe('pro ask — ask sheet', () => {
  const openAsk = async () => {
    h.answers = payload({ total: 0, answers: [] });
    mount(false);
    fireEvent.click(await screen.findByRole('button', { name: 'Ask' }));
    await screen.findByRole('heading', { name: 'Ask a question' });
  };
  it('counter and the 3-character minimum', async () => {
    await openAsk();
    const send = screen.getByRole('button', { name: 'Send to Mason' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'Hi' } });
    expect(screen.getByText('2 / 200')).toBeTruthy();
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'Hi there' } });
    expect(screen.getByText('8 / 200')).toBeTruthy();
    expect(send.disabled).toBe(false);
  });
  it('privacy line names the club when public', async () => {
    await openAsk();
    expect(await screen.findByText('Mason sees your name. Everyone else sees "a member at Sundridge Park".')).toBeTruthy();
  });
  it('privacy line falls back to a member when the club is private', async () => {
    h.profile = { home_club: 'Sundridge Park', home_club_visibility: 'private' };
    await openAsk();
    expect(await screen.findByText('Mason sees your name. Everyone else sees "a member".')).toBeTruthy();
  });
  it('success toasts and closes', async () => {
    await openAsk();
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'Do you carry a 2-iron?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send to Mason' }));
    await waitFor(() => expect(h.toastSuccess).toHaveBeenCalledWith("Sent. We'll tell you when Mason answers."));
    expect(h.rpcCalls.some((c) => c.fn === 'ask_pro_question' && c.args.p_pro_id === 'pro1')).toBe(true);
  });
  it('a function error shows as a toast word for word', async () => {
    h.rpcError = { message: 'You already have 3 questions waiting for this pro' };
    await openAsk();
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'Do you carry a 2-iron?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send to Mason' }));
    await waitFor(() => expect(h.toastError).toHaveBeenCalledWith('You already have 3 questions waiting for this pro'));
  });
});

describe('pro ask — questions sheet', () => {
  const INBOX = [
    { id: 'i1', question: 'Do you carry a 2-iron?', answer: null, status: 'waiting', created_at: '2026-11-05T10:00:00Z', answered_at: null, asker_id: 'a1', asker_name: 'Sam Carter', asker_username: 'samc', asker_avatar: null, asker_club: 'Sundridge Park', useful: 0 },
    { id: 'i2', question: 'What do you eat on the course?', answer: null, status: 'waiting', created_at: '2026-11-04T10:00:00Z', answered_at: null, asker_id: 'a2', asker_name: 'Jay K', asker_username: null, asker_avatar: null, asker_club: null, useful: 0 },
  ];
  const ANSWERED = [
    { id: 'i3', question: 'Best player this year?', answer: 'Tommy, easily.', status: 'answered', created_at: '2026-11-01T10:00:00Z', answered_at: '2026-11-02T10:00:00Z', asker_id: 'a3', asker_name: 'Priya Shah', asker_username: 'priya', asker_avatar: null, asker_club: 'Dartford', useful: 4 },
  ];
  const openSheet = async () => {
    h.answers = payload({ waiting: 2 });
    h.inbox = { waiting: INBOX, answered: ANSWERED };
    mount(true);
    fireEvent.click(await screen.findByText('2 waiting ›'));
    await screen.findByText('Questions for you');
  };
  it('segments show their counts', async () => {
    await openSheet();
    expect(screen.getByText('Waiting · 2')).toBeTruthy();
    fireEvent.click(screen.getByText('Answered · 1'));
    expect(await screen.findByText('Tommy, easily.')).toBeTruthy();
  });
  it('Not for me calls decline', async () => {
    await openSheet();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Not for me' }))[0]);
    await waitFor(() => expect(h.rpcCalls.some((c) => c.fn === 'decline_pro_question' && c.args.p_question_id === 'i1')).toBe(true));
  });
  it('Answer opens the answer sheet and posts', async () => {
    await openSheet();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Answer' }))[0]);
    expect(await screen.findByText('Your answer')).toBeTruthy();
    expect(screen.getByText('Sam Carter · Sundridge Park')).toBeTruthy();
    expect(screen.getByText(/Sam gets a notification/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: 'A 7-wood, every time.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post answer' }));
    await waitFor(() => expect(h.rpcCalls.some((c) => c.fn === 'answer_pro_question' && c.args.p_question_id === 'i1')).toBe(true));
  });
  it('edit mode shortens the note', async () => {
    await openSheet();
    fireEvent.click(screen.getByText('Answered · 1'));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit answer' }));
    expect(await screen.findByText('Your answer shows on your profile.')).toBeTruthy();
    expect(screen.queryByText(/gets a notification/)).toBeNull();
  });
  it('the switch turns Ask off', async () => {
    await openSheet();
    fireEvent.click(screen.getByRole('switch', { name: 'Members can ask you questions' }));
    await waitFor(() => expect(h.rpcCalls.some((c) => c.fn === 'set_pro_ask_enabled' && c.args.p_on === false)).toBe(true));
  });
  it('tapping the asker name opens their profile', async () => {
    await openSheet();
    fireEvent.click(await screen.findByRole('button', { name: 'Sam Carter' }));
    expect(screen.getByTestId('where').textContent).toBe('/profile/samc');
  });
});

describe('pro ask — activity deep links', () => {
  const row = (notif_type: string, data: Record<string, unknown>) => ({ notif_type, entity_type: null, entity_id: null, data }) as never;
  it('pro_question_asked opens the own-profile inbox', () => {
    expect(getActivityLink(row('pro_question_asked', { question_id: 'q1', pro_id: 'pro1' }))).toBe('/profile?ask=inbox');
  });
  it('pro_question_answered opens the pro profile at the section', () => {
    expect(getActivityLink(row('pro_question_answered', { question_id: 'q1', pro_id: 'pro1' }))).toBe('/profile/pro1?ask=section');
  });
  it('?ask=inbox opens the questions sheet on Waiting', async () => {
    h.answers = payload({ waiting: 2 });
    h.inbox = { waiting: [], answered: [] };
    mount(true, '/u/pro1?ask=inbox');
    expect(await screen.findByText('Questions for you')).toBeTruthy();
    expect(screen.getByText(/Waiting ·/)).toBeTruthy();
  });
});
