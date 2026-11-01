/**
 * MS3 — Messages: share a round, share a course. Mock: ms3-share.html
 * (signed off). Structure asserted, never words beyond the brief's own copy;
 * the react-i18next mock returns defaultValue.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const sendMock = vi.fn(() => Promise.resolve());
vi.mock('@/hooks/messaging/useSendMessage', () => ({
  useSendMessage: () => ({ send: sendMock, sendMedia: vi.fn(), retry: vi.fn() }),
}));
vi.mock('@/hooks/messaging/useKeyboardHeight', () => ({ useKeyboardHeight: () => 0 }));
vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: { id: 'me' } }),
}));
vi.mock('@/utils/media/pickMediaFiles', () => ({
  pickMediaFiles: vi.fn(() => Promise.resolve([])),
  validateMediaFiles: vi.fn((f: unknown) => Promise.resolve(f)),
}));

/* WHS connection + rounds, configurable per test. */
let connState: { data: { id: string } | null } = { data: { id: 'conn-1' } };
let scoresState: { data: unknown[] } = { data: [] };
vi.mock('@/lib/whs/hooks', () => ({
  useWhsConnection: () => connState,
  useAllScores: () => scoresState,
}));

/* Course search, configurable per test. */
let courseSearchState: { data: unknown[]; isLoading: boolean } = { data: [], isLoading: false };
vi.mock('@/hooks/gam/useCourseSearch', () => ({
  useCourseSearch: () => courseSearchState,
}));

/* Course card read, configurable per test. */
let courseCardState: {
  course: { id: string; name: string; region: string | null; thumbnail_image: string | null } | null;
  isLoading: boolean;
  isError: boolean;
  rank: number | null;
} = { course: null, isLoading: false, isError: false, rank: null };
vi.mock('@/hooks/messaging/useCourseShareCard', () => ({
  useCourseShareCard: () => courseCardState,
}));

vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({
  RoundDetailSheet: () => <div data-testid="round-detail-sheet" />,
}));

const rpcMock = vi.fn((..._args: any[]) => Promise.resolve({ data: null as unknown, error: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...args: any[]) => rpcMock(...args) },
}));

import { Composer } from '@/pages/messaging-v2/Composer';
import { MessageBubble } from '@/pages/messaging-v2/MessageBubble';
import { useRoundShareCards, type RoundShareCard } from '@/hooks/messaging/useRoundShareCards';
import type { ThreadMessage } from '@/types/messaging';
import type { WhsScore } from '@/lib/whs/types';

const SCORES = [
  { id: 's-old', play_date: '2026-10-11', adjusted_gross: 71, course_par: 71, course: { name: 'Sundridge Park Golf Club (West)' } },
  { id: 's-new', play_date: '2026-10-29', adjusted_gross: 80, course_par: 71, course: { name: 'Sundridge Park Golf Club (East)' } },
] as unknown as WhsScore[];

const CARD: RoundShareCard = {
  message_id: 'm1',
  whs_score_id: 's-new',
  course_id: 'c1',
  course_name: 'Sundridge Park Golf Club (East)',
  play_date: '2026-10-29',
  gross: 80,
  to_par: 0,
  holes_played: 18,
  hole_to_par: [0, 0, -1, 0, 1, 2, 0, 0, -1, 0, 0, 1, 0, 0, -1, 0, 0, 0],
};

function msg(over: Partial<ThreadMessage>): ThreadMessage {
  return {
    id: 'm1',
    conversation_id: 'conv-1',
    sender_actor_type: 'personal',
    sender_actor_id: 'me',
    sender_user_id: 'me',
    sender_name: 'Ben',
    sender_avatar_url: null,
    type: 'text',
    body: null,
    attachments: null,
    metadata: null,
    reply_preview: null,
    reactions: [],
    client_id: 'cli-1',
    edited_at: null,
    deleted_at: null,
    created_at: '2026-10-29T20:41:00Z',
    status: 'sent',
    ...over,
  } as ThreadMessage;
}

function renderWithProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  sendMock.mockClear();
  rpcMock.mockClear();
  rpcMock.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  connState = { data: { id: 'conn-1' } };
  scoresState = { data: SCORES };
  courseSearchState = { data: [], isLoading: false };
  courseCardState = { course: null, isLoading: false, isError: false, rank: null };
});

afterEach(() => cleanup());

describe('+ sheet — MS3 §1', () => {
  it('shows all three rows when the member has a connection and rounds', () => {
    renderWithProviders(<Composer conversationId="conv-1" />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByTestId('share-photo')).toBeTruthy();
    expect(screen.getByTestId('share-round')).toBeTruthy();
    expect(screen.getByTestId('share-course')).toBeTruthy();
  });

  it('hides Share a round with no WHS connection', () => {
    connState = { data: null };
    renderWithProviders(<Composer conversationId="conv-1" />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByTestId('share-photo')).toBeTruthy();
    expect(screen.queryByTestId('share-round')).toBeNull();
    expect(screen.getByTestId('share-course')).toBeTruthy();
  });

  it('hides Share a round with no rounds', () => {
    scoresState = { data: [] };
    renderWithProviders(<Composer conversationId="conv-1" />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.queryByTestId('share-round')).toBeNull();
  });
});

describe('round picker — MS3 §2', () => {
  it('lists rounds newest first with tile, short course name and date', () => {
    renderWithProviders(<Composer conversationId="conv-1" />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByTestId('share-round'));
    const picker = screen.getByTestId('ms3-round-picker');
    const rows = [picker.querySelector('[data-testid="round-pick-s-new"]'), picker.querySelector('[data-testid="round-pick-s-old"]')];
    expect(rows[0]).toBeTruthy();
    expect(rows[1]).toBeTruthy();
    // Newest (29 Oct) before oldest (11 Oct) in document order.
    expect(
      rows[0]!.compareDocumentPosition(rows[1]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(rows[0]!.textContent).toContain('80');
    expect(rows[0]!.textContent).toContain('+9');
    expect(rows[0]!.textContent).toContain('Sundridge Park · East');
    expect(rows[1]!.textContent).toContain('E'); // to-par 0 reads E
    expect(rows[1]!.textContent).toContain('Sundridge Park · West');
  });

  it('tap sends msg_send with type, metadata and the preview body, then closes', async () => {
    renderWithProviders(<Composer conversationId="conv-1" />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByTestId('share-round'));
    fireEvent.click(screen.getByTestId('round-pick-s-new'));
    await waitFor(() =>
      expect(sendMock).toHaveBeenCalledWith({
        body: '80 at Sundridge Park · East',
        type: 'round_share',
        metadata: { whs_score_id: 's-new' },
      }),
    );
    expect(screen.queryByTestId('ms3-round-picker')).toBeNull();
  });
});

describe('course picker — MS3 §3', () => {
  it('tap sends a course_share with the course id and its name as the body', async () => {
    courseSearchState = {
      data: [{ id: 'course-1', name: 'Rye Golf Club (Old)', region: 'East Sussex', country: 'England', course_type: null }],
      isLoading: false,
    };
    renderWithProviders(<Composer conversationId="conv-1" />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByTestId('share-course'));
    fireEvent.change(screen.getByPlaceholderText('Search courses'), { target: { value: 'rye' } });
    fireEvent.click(screen.getByTestId('course-pick-course-1'));
    await waitFor(() =>
      expect(sendMock).toHaveBeenCalledWith({
        body: 'Rye Golf Club (Old)',
        type: 'course_share',
        metadata: { course_id: 'course-1' },
      }),
    );
  });
});

describe('round card — MS3 §4', () => {
  it('fetches card data once per page, keyed on the sorted message ids', async () => {
    const messages = [
      msg({ id: 'm-b', type: 'round_share' }),
      msg({ id: 'm-a', type: 'round_share' }),
      msg({ id: 'm-c', type: 'text', body: 'hi' }),
    ];
    const Probe: React.FC = () => {
      useRoundShareCards(messages);
      return null;
    };
    renderWithProviders(<Probe />);
    await waitFor(() => expect(rpcMock).toHaveBeenCalledTimes(1));
    expect(rpcMock).toHaveBeenCalledWith('get_round_share_cards', { p_message_ids: ['m-a', 'm-b'] });
  });

  it('renders the card with shortCourseName, E to-par and the hole strip', () => {
    renderWithProviders(
      <MessageBubble
        message={msg({ type: 'round_share', body: '80 at Sundridge Park · East' })}
        isOutgoing
        isFirstOfRun
        isLastOfRun
        showTicks={false}
        roundShareCard={CARD}
      />,
    );
    const card = screen.getByTestId('round-share-card');
    expect(card.textContent).toContain('Round');
    expect(card.textContent).toContain('Sundridge Park · East');
    expect(card.textContent).toContain('80');
    expect(card.textContent).toContain('E');
    expect(screen.getByTestId('round-share-strip').children).toHaveLength(18);
  });

  it('tap opens RoundDetailSheet for the round', () => {
    renderWithProviders(
      <MessageBubble
        message={msg({ type: 'round_share', body: '80 at Sundridge Park · East' })}
        isOutgoing
        isFirstOfRun
        isLastOfRun
        showTicks={false}
        roundShareCard={CARD}
      />,
    );
    expect(screen.queryByTestId('round-detail-sheet')).toBeNull();
    fireEvent.click(screen.getByTestId('round-share-card'));
    expect(screen.getByTestId('round-detail-sheet')).toBeTruthy();
  });

  it('falls back to a normal text bubble when there is no card data', () => {
    renderWithProviders(
      <MessageBubble
        message={msg({ type: 'round_share', body: '80 at Sundridge Park · East' })}
        isOutgoing
        isFirstOfRun
        isLastOfRun
        showTicks={false}
      />,
    );
    expect(screen.queryByTestId('round-share-card')).toBeNull();
    expect(screen.getByText('80 at Sundridge Park · East')).toBeTruthy();
  });
});

describe('course card — MS3 §5', () => {
  const COURSE_MSG = () =>
    msg({ type: 'course_share', body: 'Rye Golf Club (Old)', metadata: { course_id: 'course-1' } });

  it('renders photo, shortCourseName, region and the Top 100 rank', () => {
    courseCardState = {
      course: { id: 'course-1', name: 'Rye Golf Club (Old)', region: 'East Sussex', thumbnail_image: 'https://img/rye.jpg' },
      isLoading: false,
      isError: false,
      rank: 27,
    };
    renderWithProviders(
      <MessageBubble message={COURSE_MSG()} isOutgoing isFirstOfRun isLastOfRun showTicks={false} />,
    );
    const card = screen.getByTestId('course-share-card');
    expect(card.textContent).toContain('Rye · Old');
    expect(card.textContent).toContain('East Sussex · Top 100 #27');
  });

  it('omits the rank clause when the course has no published rank', () => {
    courseCardState = {
      course: { id: 'course-1', name: 'Rye Golf Club (Old)', region: 'East Sussex', thumbnail_image: null },
      isLoading: false,
      isError: false,
      rank: null,
    };
    renderWithProviders(
      <MessageBubble message={COURSE_MSG()} isOutgoing isFirstOfRun isLastOfRun showTicks={false} />,
    );
    const card = screen.getByTestId('course-share-card');
    expect(card.textContent).toContain('East Sussex');
    expect(card.textContent).not.toContain('Top 100');
  });

  it('tap navigates to the course page', () => {
    courseCardState = {
      course: { id: 'course-1', name: 'Rye Golf Club (Old)', region: 'East Sussex', thumbnail_image: null },
      isLoading: false,
      isError: false,
      rank: null,
    };
    let path = '';
    const Probe: React.FC = () => {
      path = useLocation().pathname;
      return null;
    };
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/messages/conv-1']}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <Probe />
                  <MessageBubble message={COURSE_MSG()} isOutgoing isFirstOfRun isLastOfRun showTicks={false} />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByTestId('course-share-card'));
    expect(path).toBe('/courses/course-1');
  });

  it('falls back to a plain bubble when the course is missing', () => {
    courseCardState = { course: null, isLoading: false, isError: false, rank: null };
    renderWithProviders(
      <MessageBubble message={COURSE_MSG()} isOutgoing isFirstOfRun isLastOfRun showTicks={false} />,
    );
    expect(screen.queryByTestId('course-share-card')).toBeNull();
    expect(screen.getByText('Rye Golf Club (Old)')).toBeTruthy();
  });
});
