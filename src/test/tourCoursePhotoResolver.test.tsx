/**
 * CB55 — ONE course-photo resolver for every Tour surface.
 *
 * useBatchCourseImages is keyed by tournament id and resolves:
 *   1. linked course photo (falling through when the linked course has none)
 *   2. VENUE_IMAGE_OVERRIDES
 *   3. the sr_course_map saved match
 *   4. the live catalogue search, geography-gated for display AND saving
 *   5. no photo → the surface's gradient
 *
 * These tests drive the hook through a table-driven fake of the supabase
 * client and assert resolution order, the geography gate, the cache-write
 * behaviour, the no-photo re-check timing and the batch query count.
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));

import {
  useBatchCourseImages,
  courseImageBatchStaleTime,
  type TournamentImageInput,
} from '@/features/tourhub/hooks/useBatchCourseImages';
import sedgefieldCC from '@/assets/courses/sedgefield-country-club.jpg.asset.json';

interface FakeCourse {
  id: string;
  name: string;
  thumbnail_image: string | null;
  sub_country: string | null;
}

interface FakeState {
  links: Array<{ id: string; golf_course_id: string | null }>;
  courses: FakeCourse[];
  cache: Array<{ sr_venue_name: string; golf_course_id: string; confidence?: number; source?: string }>;
  upserts: Array<Record<string, unknown>>;
  queries: Array<{ table: string; kind: string }>;
}

function freshState(): FakeState {
  return { links: [], courses: [], cache: [], upserts: [], queries: [] };
}

function setupDb(state: FakeState) {
  from.mockImplementation((table: string) => {
    if (table === 'sr_tournaments') {
      return {
        select: () => ({
          in: async (_col: string, ids: string[]) => {
            state.queries.push({ table, kind: 'links' });
            return { data: state.links.filter((l) => ids.includes(l.id)), error: null };
          },
        }),
      };
    }
    if (table === 'golf_courses') {
      return {
        select: () => ({
          in: async (_col: string, ids: string[]) => {
            state.queries.push({ table, kind: 'by-id' });
            return { data: state.courses.filter((c) => ids.includes(c.id)), error: null };
          },
          ilike: (_col: string, pattern: string) => ({
            order: () => ({
              limit: async () => {
                state.queries.push({ table, kind: 'search' });
                const kw = pattern.replace(/%/g, '').toLowerCase();
                return { data: state.courses.filter((c) => c.name.toLowerCase().includes(kw)), error: null };
              },
            }),
          }),
        }),
      };
    }
    if (table === 'sr_course_map') {
      return {
        select: () => ({
          in: async (_col: string, names: string[]) => {
            state.queries.push({ table, kind: 'cache-read' });
            return {
              data: state.cache
                .filter((r) => names.includes(r.sr_venue_name))
                .map((r) => ({
                  sr_venue_name: r.sr_venue_name,
                  golf_courses: state.courses.find((c) => c.id === r.golf_course_id) ?? null,
                })),
              error: null,
            };
          },
          eq: (_col: string, name: string) => ({
            maybeSingle: async () => ({
              data: state.cache.find((r) => r.sr_venue_name === name) ?? null,
              error: null,
            }),
          }),
        }),
        upsert: async (row: Record<string, unknown>) => {
          state.upserts.push(row);
          return { error: null };
        },
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    qc,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children),
  };
}

async function resolveImages(input: TournamentImageInput[]) {
  const { wrapper } = makeWrapper();
  const view = renderHook(() => useBatchCourseImages(input), { wrapper });
  await waitFor(() => expect(view.result.current.isSuccess).toBe(true));
  return view.result.current.data!;
}

const PORT_ROYAL: FakeCourse = {
  id: 'course-port-royal',
  name: 'Port Royal Golf Course',
  thumbnail_image: 'https://img.example/port-royal.jpg',
  sub_country: 'Bermuda',
};

const BERMUDA_TOURNAMENT: TournamentImageInput = {
  id: 't-bermuda',
  venue_name: 'Port Royal Golf Course',
  venue_course_name: null,
  venue_city: 'Southampton',
  venue_state: null,
  venue_country: 'BMU',
};

describe('CB55 — one course-photo resolver for every Tour surface', () => {
  beforeEach(() => {
    from.mockReset();
  });

  it('1. same tournament, same photo, on the overview hero and the tournament page', async () => {
    const state = freshState();
    state.links = [{ id: 't-bermuda', golf_course_id: 'course-port-royal' }];
    state.courses = [PORT_ROYAL];
    setupDb(state);

    const { wrapper } = makeWrapper();
    // The overview hero's adapter shape…
    const overview = renderHook(() => useBatchCourseImages([BERMUDA_TOURNAMENT]), { wrapper });
    // …and the tournament page's adapter shape, same tournament id.
    const detail = renderHook(() => useBatchCourseImages([{ ...BERMUDA_TOURNAMENT }]), { wrapper });
    await waitFor(() => expect(overview.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true));

    expect(overview.result.current.data!.get('t-bermuda')).toBe('https://img.example/port-royal.jpg');
    expect(detail.result.current.data!.get('t-bermuda')).toBe('https://img.example/port-royal.jpg');
  });

  it('2. an unlinked, unsaved venue is found through the live search without the tournament page ever opening', async () => {
    const state = freshState();
    state.courses = [PORT_ROYAL];
    setupDb(state);

    // The overview batch alone: no link row, no saved match.
    const data = await resolveImages([BERMUDA_TOURNAMENT]);

    expect(data.get('t-bermuda')).toBe('https://img.example/port-royal.jpg');
    expect(state.queries.some((q) => q.kind === 'search')).toBe(true);
  });

  it('3. a linked course with no photo falls through to the saved match', async () => {
    const state = freshState();
    state.links = [{ id: 't-bermuda', golf_course_id: 'course-no-photo' }];
    state.courses = [
      { id: 'course-no-photo', name: 'Port Royal Golf Course', thumbnail_image: null, sub_country: 'Bermuda' },
      PORT_ROYAL,
    ];
    state.cache = [{ sr_venue_name: 'Port Royal Golf Course', golf_course_id: 'course-port-royal' }];
    setupDb(state);

    const data = await resolveImages([BERMUDA_TOURNAMENT]);

    expect(data.get('t-bermuda')).toBe('https://img.example/port-royal.jpg');
    expect(state.queries.some((q) => q.kind === 'by-id')).toBe(true);
    expect(state.queries.some((q) => q.kind === 'cache-read')).toBe(true);
  });

  it('4. overrides beat the cache', async () => {
    const state = freshState();
    state.courses = [
      { id: 'course-sedgefield', name: 'Sedgefield Country Club', thumbnail_image: 'https://img.example/sedgefield-db.jpg', sub_country: 'North Carolina' },
    ];
    state.cache = [{ sr_venue_name: 'Sedgefield Country Club', golf_course_id: 'course-sedgefield' }];
    setupDb(state);

    const data = await resolveImages([{
      id: 't-wyndham',
      venue_name: 'Sedgefield Country Club',
      venue_course_name: null,
      venue_city: 'Greensboro',
      venue_state: 'North Carolina',
      venue_country: 'USA',
    }]);

    expect(data.get('t-wyndham')).toBe(sedgefieldCC.url);
  });

  it('5. a geography-incompatible live match is neither shown nor saved', async () => {
    const state = freshState();
    state.courses = [
      { id: 'course-wrong-country', name: 'Port Royal Golf Course', thumbnail_image: 'https://img.example/wrong.jpg', sub_country: 'Scotland' },
    ];
    setupDb(state);

    const data = await resolveImages([BERMUDA_TOURNAMENT]);

    expect(data.get('t-bermuda')).toBeNull();
    expect(state.upserts).toEqual([]);
  });

  it('6. a compatible live match is shown and saved', async () => {
    const state = freshState();
    state.courses = [PORT_ROYAL];
    setupDb(state);

    const data = await resolveImages([BERMUDA_TOURNAMENT]);

    expect(data.get('t-bermuda')).toBe('https://img.example/port-royal.jpg');
    expect(state.upserts).toHaveLength(1);
    expect(state.upserts[0]).toMatchObject({
      sr_venue_name: 'Port Royal Golf Course',
      golf_course_id: 'course-port-royal',
      sr_country: 'BMU',
      source: 'fuzzy',
    });
  });

  it('7. a "no photo" result is re-checked after 5 minutes; resolved photos keep 30', () => {
    const withNoPhoto = new Map<string, string | null>([['t-a', 'https://img.example/a.jpg'], ['t-b', null]]);
    const allResolved = new Map<string, string | null>([['t-a', 'https://img.example/a.jpg']]);

    expect(courseImageBatchStaleTime(withNoPhoto)).toBe(5 * 60 * 1000);
    expect(courseImageBatchStaleTime(allResolved)).toBe(30 * 60 * 1000);
    expect(courseImageBatchStaleTime(undefined)).toBe(5 * 60 * 1000);
  });

  it('8. steps 1–3 cost at most three queries for a batch of five; search runs only for the unresolved', async () => {
    const state = freshState();
    state.links = [
      { id: 't-linked-1', golf_course_id: 'course-a' },
      { id: 't-linked-2', golf_course_id: 'course-b' },
    ];
    state.courses = [
      { id: 'course-a', name: 'Course A', thumbnail_image: 'https://img.example/a.jpg', sub_country: 'Bermuda' },
      { id: 'course-b', name: 'Course B', thumbnail_image: 'https://img.example/b.jpg', sub_country: 'Bermuda' },
      { id: 'course-cached', name: 'Cached Venue GC', thumbnail_image: 'https://img.example/cached.jpg', sub_country: 'Bermuda' },
      PORT_ROYAL,
    ];
    state.cache = [{ sr_venue_name: 'Cached Venue GC', golf_course_id: 'course-cached' }];
    setupDb(state);

    const data = await resolveImages([
      { id: 't-linked-1', venue_name: 'Venue One' },
      { id: 't-linked-2', venue_name: 'Venue Two' },
      { id: 't-override', venue_name: 'Sedgefield Country Club' },
      { id: 't-cached', venue_name: 'Cached Venue GC' },
      { ...BERMUDA_TOURNAMENT },
    ]);

    expect(data.get('t-linked-1')).toBe('https://img.example/a.jpg');
    expect(data.get('t-linked-2')).toBe('https://img.example/b.jpg');
    expect(data.get('t-override')).toBe(sedgefieldCC.url);
    expect(data.get('t-cached')).toBe('https://img.example/cached.jpg');
    expect(data.get('t-bermuda')).toBe('https://img.example/port-royal.jpg');

    const count = (kind: string) => state.queries.filter((q) => q.kind === kind).length;
    // Steps 1–3: exactly one query each, whatever the batch size.
    expect(count('links')).toBe(1);
    expect(count('by-id')).toBe(1);
    expect(count('cache-read')).toBe(1);
    // Step 4 searched only for the one unresolved tournament (≤3 keyword queries).
    const searches = count('search');
    expect(searches).toBeGreaterThan(0);
    expect(searches).toBeLessThanOrEqual(3);
  });
});
