import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { readFileSync } from 'node:fs';
import {
  chooseCirclePeople,
  displayCourseName,
  nextFooterHidden,
  startingHandicap,
} from '@/components/profile/handicap/whs/connect/EmptyStateScreen';
import { EmptyStateScreen } from '@/components/profile/handicap/whs/connect/EmptyStateScreen';
import { analyticsEvents } from '@/utils/analyticsEvents';

const i18n = vi.hoisted(() => ({
  dict: {
    'whsConnect.intro.homeClubKicker': 'Your home club',
    'whsConnect.intro.change': 'Change',
    'whsConnect.intro.fieldHeadlineLine2': 'takes {{shots}} shots',
    'whsConnect.intro.fieldHeadlineLine3': 'off the field.',
    'whsConnect.intro.fieldOver': 'over par, on average',
    'whsConnect.intro.fieldAcross': 'across {{rounds}} rounds, every handicap',
    'whsConnect.intro.fieldLabel': 'The field',
    'whsConnect.intro.youLabel': 'You',
    'whsConnect.intro.headlineLine1': 'Connect once.',
    'whsConnect.intro.tryHeadlineLine3': 'will cost you?',
    'whsConnect.intro.stepperLabel': 'If you play off',
    'whsConnect.intro.lowerHandicapAria': 'Lower handicap',
    'whsConnect.intro.higherHandicapAria': 'Higher handicap',
    'whsConnect.intro.footerLine': 'Connect your official handicap and this is built from your own rounds, on every course you play.',
    'whsConnect.intro.connectCta': 'Connect your handicap',
    'whsConnect.intro.decline': "I don't hold an official handicap",
    'whsConnect.intro.readoutBandBaseline': '{{median}} is what golfers off {{hcp}} typically shoot here, par {{par}}.',
    'whsConnect.intro.readoutCost': 'The {{hole1}}, {{hole2}} and {{hole3}} cost them most: {{value1}}, {{value2}} and {{value3}} {{ending}}',
    'whsConnect.intro.readoutOverPar': 'over par.',
    'whsConnect.intro.readoutBandSource_other': 'From {{count}} rounds by golfers off {{lo}} to {{hi}} at this course.',
    'whsConnect.intro.youTableHeadingLine1': 'Then it stops being',
    'whsConnect.intro.youTableHeadingLine2': 'golfers like you.',
    'whsConnect.intro.youTableHeadingLine3': "It's you.",
    'whsConnect.intro.youTableSub': 'Same holes, your own rounds. The right-hand column fills in the moment you connect.',
    'whsConnect.intro.youTableHole': 'Hole',
    'whsConnect.intro.youTableOff': 'Off {{hcp}}',
    'whsConnect.intro.youTableYou': 'You',
    'whsConnect.intro.youTablePar': 'par {{par}}',
    'whsConnect.intro.youTableHardest': 'the hardest here',
    'whsConnect.intro.exampleHeading': 'After every round',
    'whsConnect.intro.exampleKicker': 'Example',
    'whsConnect.intro.exampleSub': 'Your rounds arrive on their own, scored hole by hole against the course you played.',
    'whsConnect.intro.exampleBeatTitle': 'The score to beat next time',
    'whsConnect.intro.exampleBeatText': 'Shoot 84 at your home course and your index drops to 11.6. 85 or worse changes nothing.',
    'whsConnect.intro.exampleCountTitle': 'Your last 20, and what counts',
    'whsConnect.intro.exampleCountText': 'Your best 8 make your index. See which drop out next, and where your index is heading.',
    'whsConnect.intro.exampleWaysTitle': 'Ways to get it down',
    'whsConnect.intro.exampleWayDoubles': 'Turn your doubles into bogeys',
    'whsConnect.intro.exampleWayBackNine': 'Play the back nine like the front',
    'whsConnect.intro.exampleWaysText': 'Worked out by replaying your own counting rounds with one thing changed.',
    'whsConnect.intro.circleHeadingLine1': 'Your circle is',
    'whsConnect.intro.circleHeadingLine2': 'already here',
    'whsConnect.intro.circleSub_one': '1 golfer you follow has connected. Connect to take your place among them.',
    'whsConnect.intro.circleSub_other': '{{count}} golfers you follow have connected. Connect to take your place among them.',
    'whsConnect.intro.circleYou': 'You',
    'whsConnect.intro.circleYouLine': 'connect to take your place',
    'whsConnect.intro.trustHeadingLine1': 'Thirty seconds.',
    'whsConnect.intro.trustHeadingLine2': 'Then it looks after itself.',
    'whsConnect.intro.trustStep1Title': 'Pick your country, sign in once',
    'whsConnect.intro.trustStep1Line': 'The same login you use for your handicap app. Every round you have posted comes across.',
    'whsConnect.intro.trustStep2Title': 'Read only',
    'whsConnect.intro.trustStep2Line': 'We never post, change or delete a score. Your handicap stays exactly where it is.',
    'whsConnect.intro.trustStep3Title': 'Yours to take back',
    'whsConnect.intro.trustStep3Line': 'Your password is kept encrypted and only used to sync. Disconnect any time and it is deleted.',
    'whsConnect.intro.endLine': 'Works with official handicaps. {{live}} is live now, with {{count}} more countries on the way.',
  } as Record<string, string>,
}));

vi.mock('react-i18next', () => {
  const t = (key: string, options?: Record<string, unknown>) => {
    const pluralKey = typeof options?.count === 'number' ? `${key}_${options.count === 1 ? 'one' : 'other'}` : key;
    let value = i18n.dict[pluralKey] ?? i18n.dict[key] ?? key;
    for (const [k, v] of Object.entries(options ?? {})) value = value.split(`{{${k}}}`).join(String(v));
    return value;
  };
  return {
    useTranslation: () => ({ t }),
    Trans: ({ i18nKey }: { i18nKey: string }) => <>{t(i18nKey)}</>,
  };
});

const state = vi.hoisted(() => ({
  session: { user: undefined as { id: string } | undefined, loading: true },
  home: { clubId: null as string | null, isFetched: false, isLoading: false },
  intro: { isPending: true, data: null as any },
  profile: { eg_handicap_index: null as number | null, manual_handicap_index: 13 as number | null },
  stats: null as any,
  circle: { circle: 1, connected: 1, people: [{ user_id: 'p1', name: 'Alice', avatar_url: null, club: 'Parkstone', index: 14 }] },
}));

vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => state.session,
}));

vi.mock('@/features/home-club/useHomeClubStatus', () => ({
  useHomeClubStatus: vi.fn(() => state.home),
}));

const introSpy = vi.fn();
vi.mock('@/components/profile/handicap/whs/connect/useConnectIntroCourse', () => ({
  useConnectIntroCourse: (...args: unknown[]) => introSpy(...args),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: state.profile, error: null })),
        })),
      })),
    })),
    rpc: vi.fn(async (name: string) => {
      if (name === 'get_course_stats_detail') return { data: state.stats, error: null };
      if (name === 'get_connect_circle_preview') return { data: state.circle, error: null };
      return { data: null, error: null };
    }),
    auth: { onAuthStateChange: vi.fn(), getSession: vi.fn() },
  },
  SUPABASE_URL: 'https://example.test',
}));

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/features/home-club/homeClubPickerStore', () => ({ openHomeClubPicker: vi.fn() }));

function holes() {
  return Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, par: 4, stroke_index: i + 1, avg_to_par: i < 3 ? 1.5 - i * 0.1 : 0.2 }));
}

function renderIntro(layout: 'page' | 'embedded' = 'page') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><EmptyStateScreen layout={layout} onPickCountry={() => {}} onDecline={() => {}} /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  state.session = { user: undefined, loading: true };
  state.home = { clubId: null, isFetched: false, isLoading: false };
  state.intro = { isPending: true, data: null };
  state.profile = { eg_handicap_index: null, manual_handicap_index: 13 };
  state.stats = { course_id: 'course1', avg_over_par: 11.6, rounds_tracked: 912 };
  state.circle = { circle: 1, connected: 1, people: [{ user_id: 'p1', name: 'Alice', avatar_url: null, club: 'Parkstone', index: 14 }] };
  introSpy.mockImplementation(() => state.intro);
});

describe('connect intro try-it helpers', () => {
  it.each([
    ['Sundridge Park Golf Club (East Course)', 'Sundridge Park East'],
    ['Parkstone Golf Club', 'Parkstone'],
    ["Royal St George's Golf Club", "Royal St George's"],
    ['The Grove', 'The Grove'],
    ['AB Golf Club', 'AB Golf Club'],
  ])('formats course display name %s', (input, expected) => {
    expect(displayCourseName(input)).toBe(expected);
  });

  it.each([
    [{ manualHandicapIndex: 12.4 }, 12],
    [{ manualHandicapIndex: -1.2 }, 0],
    [{ manualHandicapIndex: 40 }, 36],
    [{ manualHandicapIndex: null }, 18],
  ])('resolves starting handicap through display resolver', (input, expected) => {
    expect(startingHandicap(input)).toBe(expected);
  });

  it('windows circle people and leaves the You row before the first higher index', () => {
    const people = [2, 6, 9, 11, 13, 18, 22, 27, 31].map((index) => ({ user_id: String(index), name: String(index), avatar_url: null, club: null, index }));
    expect(chooseCirclePeople(people.slice(0, 3), 12).map((p) => p.index)).toEqual([2, 6, 9]);
    expect(chooseCirclePeople(people, 12).map((p) => p.index)).toEqual([9, 11, 13, 18]);
  });

  it('uses hysteresis for footer visibility', () => {
    expect(nextFooterHidden(false, 0.6)).toBe(true);
    expect(nextFooterHidden(true, 0.45)).toBe(true);
    expect(nextFooterHidden(true, 0.25)).toBe(false);
  });
});

describe('connect intro settled gate', () => {
  it('does not request the fallback course while the session is unresolved', () => {
    renderIntro();
    expect(introSpy).toHaveBeenCalledWith(null, false);
    expect(screen.queryByText('Parkstone')).toBeNull();
  });
});

describe('connect intro fix 1 behaviour', () => {
  beforeEach(() => {
    state.session = { user: { id: 'u1' }, loading: false };
    state.home = { clubId: 'club1', isFetched: true, isLoading: false };
    state.intro = { isPending: false, data: { source: 'home', courseId: 'course1', courseName: 'Parkstone Golf Club', holes: holes(), totalRounds: 9 } };
    state.stats = { course_id: 'course1', avg_over_par: 11.6, rounds_tracked: 912 };
  });

  it('keeps footer out of fixed positioning and hides it in embedded layout', async () => {
    expect(readFileSync('src/components/profile/handicap/whs/connect/EmptyStateScreen.tsx', 'utf8')).not.toContain('position: \'fixed\'');
    const { container, rerender } = renderIntro('page');
    await screen.findAllByText('Connect your handicap');
    expect(container.textContent).toContain('Connect your official handicap and this is built from');

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(<QueryClientProvider client={qc}><EmptyStateScreen layout="embedded" onPickCountry={() => {}} onDecline={() => {}} /></QueryClientProvider>);
    await screen.findByText('takes 11.6 shots');
    expect(container.textContent).not.toContain('Connect your official handicap and this is built from');
  });

  it('shows the field verdict for the intro course and places the circle by the member\'s index', async () => {
    renderIntro('embedded');
    await screen.findByText('takes 11.6 shots');
    expect(screen.getAllByText('+11.6').length).toBeGreaterThan(0);
    expect(screen.getByText('across 912 rounds, every handicap')).toBeInTheDocument();
    expect(screen.getByText('The field')).toBeInTheDocument();
    expect(screen.getAllByText('You').length).toBeGreaterThan(0);
    const aliceRow = screen.getByText('Alice').parentElement?.parentElement;
    expect(aliceRow?.previousElementSibling?.textContent).toContain('connect to take your place');
  });

  it('renders LegacyFallback when avg_over_par is null', async () => {
    state.stats = { course_id: 'course1', avg_over_par: null, rounds_tracked: 912 };
    renderIntro('embedded');
    expect(await screen.findByText('Connect once.')).toBeInTheDocument();
    expect(screen.queryByText('takes 11.6 shots')).toBeNull();
  });

  it('keeps the circle second sentence at one connected golfer', async () => {
    renderIntro('embedded');
    expect(await screen.findByText('1 golfer you follow has connected. Connect to take your place among them.')).toBeInTheDocument();
  });

  it('fires connect_intro_viewed once after the loaded state renders', async () => {
    renderIntro('embedded');
    await waitFor(() => expect(analyticsEvents.track).toHaveBeenCalledWith('connect_intro_viewed', { source: 'home', h0: 13 }));
    await waitFor(() => expect((analyticsEvents.track as any).mock.calls.filter((c: unknown[]) => c[0] === 'connect_intro_viewed')).toHaveLength(1));
  });
});
