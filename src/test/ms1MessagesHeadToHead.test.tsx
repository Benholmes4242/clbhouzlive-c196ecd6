/**
 * MS1 — Messages: head to head, inbox lines, rail date, incoming avatar.
 * Mock: ms1-head-to-head.html (signed off). Structure asserted, never words
 * beyond the brief's own copy; the react-i18next mock returns defaultValue.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: vi.fn(() => Promise.resolve({ data: null, error: null })) },
}));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/hooks/messaging/useMessagingActor', () => ({
  useMessagingActor: () => ({ actorType: 'personal', actorId: 'me' }),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: { id: 'me' } }),
}));
vi.mock('@/lib/whs/hooks', () => ({
  useWhsConnection: () => ({ data: null }),
  useAllScores: () => ({ data: [] }),
}));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({
  RoundDetailSheet: () => null,
}));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));

/* ThreadV2Page data hooks — the header test mounts the real page. */
vi.mock('@/hooks/messaging/useThread', () => ({
  useThread: () => ({
    messages: [],
    fetchOlder: vi.fn(),
    hasOlder: false,
    isLoading: false,
    isFetchingOlder: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock('@/hooks/messaging/useConversations', () => ({
  useConversations: () => ({
    conversations: [
      {
        conversation_id: 'c1',
        type: 'direct',
        title: null,
        avatar_url: null,
        last_message_at: '2026-01-01T10:00:00Z',
        last_message_preview: 'Hey champ',
        unread_count: 0,
        is_muted: false,
        is_archived: false,
        my_role: 'member',
        participants: [
          { actor_type: 'personal', actor_id: 'me', role: 'member', name: 'Ben', avatar_url: null, username: 'ben', verified: null },
          { actor_type: 'personal', actor_id: 'thomas', role: 'member', name: 'Thomas Holmes', avatar_url: null, username: 'thomas', verified: null },
        ],
      },
    ],
  }),
}));
vi.mock('@/hooks/messaging/useConversationDetail', () => ({
  useConversationDetail: () => ({ detail: null }),
}));
vi.mock('@/hooks/messaging/useSendMessage', () => ({ useSendMessage: () => ({ retry: vi.fn() }) }));
vi.mock('@/hooks/messaging/useKeyboardHeight', () => ({ useKeyboardHeight: () => 0 }));
vi.mock('@/hooks/messaging/useMessagesStagePhoto', () => ({
  useMessagesStagePhoto: () => ({ imageUrl: null }),
}));
vi.mock('@/pages/messaging-v2/Composer', () => ({ Composer: () => null }));
vi.mock('@/pages/messaging-v2/ConversationSettingsSheet', () => ({
  ConversationSettingsSheet: () => null,
}));
vi.mock('@/pages/messaging-v2/PlayingOffRail', () => ({ PlayingOffRail: () => null }));

import {
  headToHead,
  dedupeSharedRounds,
  type SharedGround,
} from '@/hooks/messaging/useSharedGround';
import type { SharedRoundResult } from '@/lib/whs/api';
import { HeadToHeadCard } from '@/pages/messaging-v2/HeadToHeadCard';
import { SharedGroundStrip } from '@/pages/messaging-v2/SharedGroundStrip';
import { ConversationRow, inboxRecordLine } from '@/pages/messaging-v2/ConversationRow';
import { MemberRailTile } from '@/pages/messaging-v2/MemberRailTile';
import { EC } from '@/features/echo-chat/tokens';
import type { InboxConversation } from '@/types/messaging';

const round = (over: Partial<SharedRoundResult>): SharedRoundResult => ({
  play_date: '2026-10-29',
  course_id: 'course-1',
  course_name: 'Sundridge Park Golf Club (East)',
  user_stableford: 36,
  rival_stableford: 34,
  user_gross: 80,
  rival_gross: 84,
  stableford_outcome: 'W',
  gross_outcome: 'W',
  ...over,
});

const groundOf = (rounds: SharedRoundResult[], count?: number): SharedGround => ({
  rounds: dedupeSharedRounds(rounds),
  count: count ?? rounds.length,
  lastCourseName: rounds[0]?.course_name ?? null,
  lastPlayDate: rounds[0]?.play_date ?? null,
  record: headToHead(rounds),
});

const t = (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '';

const conversation = (over: Partial<InboxConversation> = {}): InboxConversation => ({
  conversation_id: 'c1',
  type: 'direct',
  title: null,
  avatar_url: null,
  last_message_at: '2026-01-01T10:00:00Z',
  last_message_preview: 'Nice Ben',
  unread_count: 0,
  is_muted: false,
  is_archived: false,
  my_role: 'member',
  participants: [
    { actor_type: 'personal', actor_id: 'me', role: 'member', name: 'Ben', avatar_url: null, username: 'ben', verified: null },
    { actor_type: 'personal', actor_id: 'danny', role: 'member', name: 'Danny Holmes', avatar_url: null, username: 'danny', verified: null },
  ],
  ...over,
});

const renderRow = (ground?: SharedGround) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <ConversationRow conversation={conversation()} ground={ground} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

afterEach(() => cleanup());

describe('headToHead', () => {
  it('dedupes on (play_date, course) before tallying', () => {
    const dupes = [
      round({}),
      round({}), // same day + course — the RPC's pairing fan-out
      round({ play_date: '2026-10-11', stableford_outcome: 'L', gross_outcome: 'L' }),
    ];
    const rec = headToHead(dupes)!;
    expect(rec.points).toEqual({ w: 1, l: 1, h: 0 });
    expect(rec.gross).toEqual({ w: 1, l: 1, h: 0 });
  });

  it('tallies points and gross independently', () => {
    const rec = headToHead([
      round({ stableford_outcome: 'W', gross_outcome: 'L' }),
      round({ play_date: '2026-10-11', stableford_outcome: 'L', gross_outcome: 'W' }),
    ])!;
    expect(rec.points).toEqual({ w: 1, l: 1, h: 0 });
    expect(rec.gross).toEqual({ w: 1, l: 1, h: 0 });
  });

  it('reads a tie as a half', () => {
    const rec = headToHead([round({ stableford_outcome: 'T', gross_outcome: 'T' })])!;
    expect(rec.points).toEqual({ w: 0, l: 0, h: 1 });
    expect(rec.gross).toEqual({ w: 0, l: 0, h: 1 });
    expect(rec.lastFive).toEqual(['H']);
  });

  it('orders lastFive newest first and caps at five', () => {
    const rounds = [
      round({ play_date: '2026-10-29', stableford_outcome: 'W' }),
      round({ play_date: '2026-10-22', stableford_outcome: 'L' }),
      round({ play_date: '2026-10-15', stableford_outcome: 'T' }),
      round({ play_date: '2026-10-08', stableford_outcome: 'W' }),
      round({ play_date: '2026-10-01', stableford_outcome: 'L' }),
      round({ play_date: '2026-09-24', stableford_outcome: 'W' }),
    ];
    expect(headToHead(rounds)!.lastFive).toEqual(['W', 'L', 'H', 'W', 'L']);
  });

  it('returns null when there are no rounds', () => {
    expect(headToHead([])).toBeNull();
  });
});

describe('HeadToHeadCard', () => {
  it('says "You lead on points" with the halved clause in bold ink', () => {
    const rec = headToHead([
      round({}),
      round({ play_date: '2026-10-11', stableford_outcome: 'T', gross_outcome: 'T' }),
    ])!;
    const { container } = render(<HeadToHeadCard record={rec} rivalFirstName="Thomas" />);
    expect(screen.getByTestId('h2h-points').textContent).toBe('1–0');
    const p = container.querySelector('p')!;
    expect(p.textContent).toContain('You lead on points');
    const b = p.querySelector('b')!;
    expect(b.textContent).toBe('1 halved');
    expect(b.style.color).toBeTruthy();
  });

  it('says "{name} leads on points" when the rival leads, with no halved clause at zero', () => {
    const rec = headToHead([round({ stableford_outcome: 'L' })])!;
    const { container } = render(<HeadToHeadCard record={rec} rivalFirstName="Thomas" />);
    const p = container.querySelector('p')!;
    expect(p.textContent).toContain('Thomas leads on points');
    expect(p.querySelector('b')).toBeNull();
  });

  it('says "All square on points" when level', () => {
    const rec = headToHead([
      round({}),
      round({ play_date: '2026-10-11', stableford_outcome: 'L', gross_outcome: 'L' }),
    ])!;
    const { container } = render(<HeadToHeadCard record={rec} rivalFirstName="Thomas" />);
    expect(container.querySelector('p')!.textContent).toContain('All square on points');
  });

  it('says "last {k}" when fewer than five rounds', () => {
    const rec = headToHead([round({})])!;
    const { container } = render(<HeadToHeadCard record={rec} rivalFirstName="Thomas" />);
    expect(container.querySelector('p')!.textContent).toContain('Your last 1 together:');
  });

  it('draws one tile per result, W filled and L/H outlined', () => {
    const rec = headToHead([
      round({ play_date: '2026-10-29', stableford_outcome: 'W' }),
      round({ play_date: '2026-10-22', stableford_outcome: 'L' }),
      round({ play_date: '2026-10-15', stableford_outcome: 'T' }),
    ])!;
    render(<HeadToHeadCard record={rec} rivalFirstName="Thomas" />);
    const w = screen.getByTestId('h2h-form-0');
    const l = screen.getByTestId('h2h-form-1');
    const h = screen.getByTestId('h2h-form-2');
    expect(w.textContent).toBe('W');
    expect(w.style.background).not.toBe('transparent');
    expect(l.style.background).toBe('transparent');
    expect(h.style.background).toBe('transparent');
    expect(l.style.border).toContain('1px');
  });

  it('is tappable when the thread has a compare route', () => {
    const rec = headToHead([round({})])!;
    const onOpen = vi.fn();
    render(<HeadToHeadCard record={rec} rivalFirstName="Thomas" onOpen={onOpen} />);
    screen.getByRole('button').click();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('SharedGroundStrip', () => {
  it('shortens the course, inks the lower gross, dims the higher, no amber', () => {
    const { container } = render(
      <MemoryRouter>
        <SharedGroundStrip ground={groundOf([round({})])} rivalFirstName="Thomas" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sundridge Park · East')).toBeTruthy();
    const card = screen.getByTestId('shared-round-card');
    const scores = card.querySelectorAll('[style*="font-size: 18px"]');
    expect(scores[0].textContent).toContain('80');
    expect(scores[1].textContent).toContain('84');
    // Winner ink, loser dimmed to rgba(248,250,252,0.42).
    expect((scores[0] as HTMLElement).style.color).not.toBe('rgba(248, 250, 252, 0.42)');
    expect((scores[1] as HTMLElement).style.color).toBe('rgba(248, 250, 252, 0.42)');
    expect(card.textContent).toContain('you won');
    expect(container.innerHTML).not.toContain(EC.AMBER);
  });

  it('leaves both scores ink on a halved round', () => {
    render(
      <MemoryRouter>
        <SharedGroundStrip
          ground={groundOf([round({ gross_outcome: 'T', user_gross: 73, rival_gross: 73 })])}
          rivalFirstName="Thomas"
        />
      </MemoryRouter>,
    );
    const card = screen.getByTestId('shared-round-card');
    const scores = card.querySelectorAll('[style*="font-size: 18px"]');
    expect((scores[0] as HTMLElement).style.color).not.toBe('rgba(248, 250, 252, 0.42)');
    expect((scores[1] as HTMLElement).style.color).not.toBe('rgba(248, 250, 252, 0.42)');
    expect(card.textContent).toContain('halved');
  });

  it('names the rival when the rival won', () => {
    render(
      <MemoryRouter>
        <SharedGroundStrip
          ground={groundOf([round({ gross_outcome: 'L', user_gross: 84, rival_gross: 80 })])}
          rivalFirstName="Thomas"
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('shared-round-card').textContent).toContain('Thomas won');
  });

  it('renders nothing without shared rounds', () => {
    const { container } = render(
      <MemoryRouter>
        <SharedGroundStrip ground={groundOf([], 0)} rivalFirstName="Thomas" />
      </MemoryRouter>,
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('inboxRecordLine', () => {
  const rounds = (s: ('W' | 'L' | 'T')[], g: ('W' | 'L' | 'T')[]) =>
    s.map((outcome, i) =>
      round({ play_date: `2026-10-${String(29 - i).padStart(2, '0')}`, stableford_outcome: outcome, gross_outcome: g[i] }),
    );

  it('reads "you lead {w}–{l}" when the viewer leads on points', () => {
    const g = groundOf(rounds(['W', 'W', 'L'], ['W', 'W', 'L']), 9);
    const line = inboxRecordLine(g, 'Danny', t);
    expect(line.count).toBe('9 rounds together');
    expect(line.record).toBe('you lead 2–1');
  });

  it('reads "{name} leads {l}–{w}" when the rival leads', () => {
    const g = groundOf(rounds(['L', 'L', 'W'], ['L', 'L', 'W']), 9);
    expect(inboxRecordLine(g, 'Danny', t).record).toBe('Danny leads 2–1');
  });

  it('reads "all square {w}–{l}" when level', () => {
    const g = groundOf(rounds(['W', 'L'], ['W', 'L']), 2);
    expect(inboxRecordLine(g, 'Danny', t).record).toBe('all square 1–1');
  });

  it('falls back to the count alone when the record is not loaded', () => {
    const g: SharedGround = { rounds: [], count: 9, lastCourseName: null, lastPlayDate: null, record: null };
    const line = inboxRecordLine(g, 'Danny', t);
    expect(line.count).toBe('9 rounds together');
    expect(line.record).toBeNull();
  });
});

describe('ConversationRow', () => {
  it('shows the record line in the third row with the record in ink', () => {
    const g = groundOf(
      [
        round({}),
        round({ play_date: '2026-10-22' }),
        round({ play_date: '2026-10-11', stableford_outcome: 'L', gross_outcome: 'L' }),
      ],
      9,
    );
    const { container } = renderRow(g);
    const em = container.querySelector('em')!;
    expect(em.textContent).toBe('you lead 2–1');
    expect(em.style.fontWeight).toBe('600');
    expect(container.textContent).toContain('9 rounds together');
  });

  it('shows the count alone while the record is outside the batch detail limit', () => {
    const g: SharedGround = { rounds: [], count: 9, lastCourseName: null, lastPlayDate: null, record: null };
    const { container } = renderRow(g);
    expect(container.textContent).toContain('9 rounds together');
    expect(container.querySelector('em')).toBeNull();
  });

  it('keeps today\'s context line when there are no shared rounds', () => {
    const g = groundOf([], 0);
    const { container } = renderRow(g);
    expect(container.textContent).not.toContain('rounds together');
  });

  it('carries exactly one time on the row', () => {
    const g = groundOf([round({})], 1);
    const { container } = renderRow(g);
    const times = Array.from(container.querySelectorAll('span')).filter(
      (s) => s.textContent === '01 Jan',
    );
    expect(times).toHaveLength(1);
  });
});

describe('MemberRailTile', () => {
  it('shows the date under the first name with no pill above the avatar', () => {
    const { container } = render(
      <MemberRailTile
        avatarUrl={null}
        userId="u1"
        name="Thomas Holmes"
        label="Thomas"
        subLabel="29 Oct"
      />,
    );
    const texts = Array.from(container.querySelectorAll('div')).map((d) => d.textContent);
    const nameIdx = texts.findIndex((x) => x === 'Thomas');
    const dateIdx = texts.findIndex((x) => x === '29 Oct');
    expect(nameIdx).toBeGreaterThanOrEqual(0);
    expect(dateIdx).toBeGreaterThan(nameIdx);
    // No bubble element above the avatar.
    expect((container.querySelector('button')!.firstElementChild as HTMLElement).style.width).toBe('56px');
  });
});

describe('ThreadV2Page header', () => {
  it('names the member at 17px with "{count} rounds together · last {d MMM}" under it', async () => {
    const ground = groundOf([round({})], 104);
    vi.doMock('@/hooks/messaging/useSharedGround', () => ({
      useSharedGroundOne: () => ({ ground, isLoading: false }),
    }));
    vi.resetModules();
    const { default: ThreadV2Page } = await import('@/pages/messaging-v2/ThreadV2Page');
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/messages/c1']}>
          <Routes>
            <Route path="/messages/:conversationId" element={<ThreadV2Page />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const name = screen.getByText('Thomas Holmes');
    expect(name.style.fontSize).toBe('17px');
    expect(name.style.fontWeight).toBe('600');
    expect(container.textContent).toContain('104 rounds together · last 29 Oct');
  });
});

describe('MessageBubble incoming avatar (MS1 §7)', () => {
  const message = (over: Record<string, unknown> = {}) => ({
    id: 'm1',
    conversation_id: 'c1',
    sender_actor_type: 'personal',
    sender_actor_id: 'thomas',
    sender_user_id: 'thomas',
    sender_name: 'Thomas Holmes',
    sender_avatar_url: null,
    sender_username: 'thomas',
    sender_verified: null,
    type: 'text',
    body: 'Hello',
    attachments: null,
    metadata: null,
    reply_to_id: null,
    reply_preview: null,
    edited_at: null,
    deleted_at: null,
    created_at: '2026-10-29T06:44:00Z',
    reactions: [],
    status: 'sent',
    ...over,
  });

  it('gives the incoming row 16px left padding and a 28px avatar slot', async () => {
    const { MessageBubble } = await import('@/pages/messaging-v2/MessageBubble');
    const { container } = render(
      <MemoryRouter>
        <MessageBubble
          message={message() as never}
          isOutgoing={false}
          isFirstOfRun
          isLastOfRun
          showTicks={false}
        />
      </MemoryRouter>,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row.style.paddingLeft).toBe('16px');
    const slot = screen.getByTestId('incoming-avatar-slot');
    expect(slot.style.width).toBe('28px');
    expect(slot.style.height).toBe('28px');
    // Last of run: the avatar itself renders inside the slot.
    expect(slot.firstElementChild).not.toBeNull();
  });

  it('reserves the slot but hides the avatar mid-run', async () => {
    const { MessageBubble } = await import('@/pages/messaging-v2/MessageBubble');
    render(
      <MemoryRouter>
        <MessageBubble
          message={message() as never}
          isOutgoing={false}
          isFirstOfRun
          isLastOfRun={false}
          showTicks={false}
        />
      </MemoryRouter>,
    );
    const slot = screen.getByTestId('incoming-avatar-slot');
    expect(slot.style.width).toBe('28px');
    expect(slot.firstElementChild).toBeNull();
  });

  it('renders no avatar slot on outgoing bubbles', async () => {
    const { MessageBubble } = await import('@/pages/messaging-v2/MessageBubble');
    const { container } = render(
      <MemoryRouter>
        <MessageBubble
          message={message() as never}
          isOutgoing
          isFirstOfRun
          isLastOfRun
          showTicks={false}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('incoming-avatar-slot')).toBeNull();
    expect((container.firstElementChild as HTMLElement).style.paddingLeft).toBe('0px');
  });
});
