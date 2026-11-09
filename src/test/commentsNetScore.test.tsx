/**
 * BUILD Round scores §2 — the comments sheet's round score is the NET score
 * with its to-par ("71 E"), from the Home score post's FN1 source
 * (gam_round_net's net_score + course_handicap). A round that cannot be
 * converted to net shows NO score; gross is never substituted.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const tables = vi.hoisted(() => ({ rows: {} as Record<string, unknown> }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: tables.rows[table] ?? null, error: null }) }),
      }),
    }),
  },
}));

import { useCommentsSubject } from '@/features/comments-v2/hooks/useCommentsContext';
import { SubjectContextLine } from '@/components/sheets/SubjectContextLine';

beforeEach(() => {
  cleanup();
  tables.rows = {
    gam_round_stats: { user_id: 'u-danny', course_id: 'c-1', course_name: 'The Addington', gross_score: 75, course_par: 72 },
    gam_round_net: { net_score: 71, course_handicap: 14.2 },
    user_profiles: { display_name: 'danny.akers1', username: 'danny.akers1' },
    golf_courses: { name: 'The Addington' },
  };
});

function Probe({ targetId }: { targetId: string }) {
  const { data } = useCommentsSubject('round', targetId, true);
  return <div data-probe>{data ? JSON.stringify({ kind: data.kind, gross: data.gross, net: data.net, netToPar: data.netToPar }) : 'pending'}</div>;
}

const mountProbe = (targetId: string) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><Probe targetId={targetId} /></QueryClientProvider>);

describe('comments subject: round score is NET (BUILD Round scores §2)', () => {
  it('returns the net score and its to-par from gam_round_net', async () => {
    const { container } = mountProbe('score-1');
    await waitFor(() => expect(container.querySelector('[data-probe]')?.textContent).not.toBe('pending'));
    const subject = JSON.parse(container.querySelector('[data-probe]')!.textContent!);
    expect(subject).toEqual({ kind: 'round', gross: 75, net: 71, netToPar: -1 });
  });

  it('returns no score when the round cannot be converted to net', async () => {
    tables.rows.gam_round_net = null;
    const { container } = mountProbe('score-2');
    await waitFor(() => expect(container.querySelector('[data-probe]')?.textContent).not.toBe('pending'));
    const subject = JSON.parse(container.querySelector('[data-probe]')!.textContent!);
    expect(subject.kind).toBe('round');
    expect(subject.net ?? null).toBeNull();
    expect(subject.netToPar ?? null).toBeNull();
  });

  it('returns no score when the course handicap is missing', async () => {
    tables.rows.gam_round_net = { net_score: 71, course_handicap: null };
    const { container } = mountProbe('score-3');
    await waitFor(() => expect(container.querySelector('[data-probe]')?.textContent).not.toBe('pending'));
    const subject = JSON.parse(container.querySelector('[data-probe]')!.textContent!);
    expect(subject.net ?? null).toBeNull();
  });
});

describe('SubjectContextLine: net, never gross', () => {
  const base = { authorName: 'danny.akers1', courseId: 'c-1', courseName: 'The Addington', kind: 'round' as const, rating: null };

  it('prints the net score with its to-par', () => {
    const { container } = render(<SubjectContextLine subject={{ ...base, gross: 75, toPar: 3, net: 71, netToPar: -1 }} />);
    const line = container.querySelector('[data-subject-context]');
    expect(line?.textContent).toContain('71');
    expect(line?.textContent).toContain('−1');
    expect(line?.textContent).not.toContain('75');
  });

  it('prints no score when the round cannot be converted to net', () => {
    const { container } = render(<SubjectContextLine subject={{ ...base, gross: 75, toPar: 3, net: null, netToPar: null }} />);
    const line = container.querySelector('[data-subject-context]');
    expect(line?.textContent).toContain('danny.akers1');
    expect(line?.textContent).not.toContain('75');
    expect(line?.textContent).not.toContain('+3');
  });
});
