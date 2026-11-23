/* TEMPORARY brief 12 capture fixture — deleted after captures. */
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import './styles/theme.css';
import './styles/theme-tokens.css';
import './i18n';
import '@/features/business-create/business-create.css';

const FX: Record<string, unknown> = (window as any).__FX || {};
const realFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(typeof input === 'string' ? input : (input as Request).url ?? input);
  if (url.includes('supabase.co')) {
    const hit = Object.keys(FX).find(k => url.includes(k));
    if (hit) return Promise.resolve(new Response(JSON.stringify(FX[hit]), { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/1' } }));
    return new Promise(() => {});
  }
  return realFetch(input as RequestInfo, init);
};

if (new URLSearchParams(location.search).get('s') === 'create1') {
  const now = Math.floor(Date.now() / 1000);
  localStorage.setItem('sb-ybxkehyomcakqjvuhnna-auth-token', JSON.stringify({ access_token: 'fx', token_type: 'bearer', expires_in: 86400, expires_at: now + 86400, refresh_token: 'fx', user: { id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'fx@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } }));
}
const s = new URLSearchParams(location.search).get('s') || '';
const empty = new URLSearchParams(location.search).get('empty') === '1';
const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, refetchOnMount: false, refetchOnWindowFocus: false } } });
const set = (k: unknown[], v: unknown) => qc.setQueryData(k, v);
const noop = () => {};
const B = 'b1', NAME = 'Sundridge Park Golf Club';

async function main() {
  let node: React.ReactNode = null; let path = '/';
  if (s === 'insights') {
    const m = await import('@/components/business/insights/InsightsReviewsSection');
    const p = await import('@/components/business/insights/InsightsPostsSection');
    const f = await import('@/components/business/insights/InsightsFollowersSection');
    const e = await import('@/components/business/insights/InsightsEngagementSection');
    const c = await import('@/components/business/insights/InsightsCourseSection');
    const a = await import('@/components/business/insights/InsightsAudienceSection');
    const v = await import('@/components/business/insights/InsightsVisitsSection');
    const fn = await import('@/components/business/insights/InsightsFunnel');
    (window as any).__FX = undefined;
    Object.assign(FX, empty ? {
      get_business_review_summary: { linked: true, period_days: 30, total: 0, avg: null, new_count: 0, new_avg: null, unreplied: 0, courses: [], scores: [] },
      get_business_post_reach: { period_days: 30, posts: [], last_post: null },
      get_business_followers: { period_days: 30, total: 0, followers: 0, new: 0, prev: 0, last_new_at: null, reached: 0, has_posts: false, merge_in_period: false },
      get_business_engagement: { period_days: 30, reached: 0, engaged: 0, engaged_prev: 0, likes: 0, comments: 0, has_posts: false },
      get_business_course_activity: { available: true, period_days: 30, rounds: 0, prev_rounds: 0, golfers: 0, member_rounds: 0, visitor_rounds: 0, unknown_rounds: 0, visitors: 0, repeat_visitors: 0, courses: [], regions: null, elsewhere: null, last_round: null },
      get_business_audience: { followers_total: 0, with_handicap: 0, state: 'none', median: null, bands: [], regions: [], elsewhere: null },
      get_business_insights_funnel: { period_days: 30, saw: { value: 0, prev: 0 }, opened: { value: 0, visits: 0, prev: 0 }, followed: { value: 0, total: 0, prev: 0 }, tapped: { value: 0, prev: 0 }, top_post: null },
      get_business_insights: { headline: {}, visits_series: [], followers_series: [], sources: [], content: [] },
      '/rest/v1/posts': [],
    } : {
      get_business_review_summary: { linked: true, period_days: 30, total: 12, avg: 8.4, new_count: 3, new_avg: 8.1, unreplied: 2, courses: [{ course_id: 'a', name: 'Sundridge Park Golf Club (East Course)', reviews: 12, avg: 8.4, rank: null, rank_of: null, county: 'Kent' }], scores: [{ key: 'design', avg: 8.6, count: 1 }, { key: 'condition', avg: 8.2, count: 1 }, { key: 'facilities', avg: 7.9, count: 1 }, { key: 'clubhouse', avg: 8.8, count: 1 }] },
      get_business_post_reach: { period_days: 30, posts: [{ post_id: 'p1', preview: 'Course is in great shape after the rain this week', created_at: '2026-11-13T10:00:00Z', reached: 20, not_following: 4, likes: 3, comments: 1 }, { post_id: 'p2', preview: 'New tee times', created_at: '2026-11-10T10:00:00Z', reached: 8, not_following: 0, likes: 0, comments: 0 }], last_post: null },
      get_business_followers: { period_days: 30, total: 120, followers: 100, new: 5, prev: 5, last_new_at: null, reached: 40, has_posts: true, merge_in_period: false },
      get_business_engagement: { period_days: 30, reached: 21, engaged: 6, engaged_prev: 6, likes: 9, comments: 0, has_posts: true },
      get_business_course_activity: { available: true, period_days: 30, rounds: 38, prev_rounds: 32, golfers: 17, member_rounds: 29, visitor_rounds: 6, unknown_rounds: 3, visitors: 4, repeat_visitors: 1, courses: [{ course_id: 'e', name: 'Sundridge Park Golf Club (East Course)', rounds: 22 }, { course_id: 'w', name: 'Sundridge Park Golf Club (West Course)', rounds: 16 }], regions: null, elsewhere: null, last_round: null },
      get_business_audience: { followers_total: 94, with_handicap: 26, state: 'ready', median: 13.8, bands: [{ from: 0, to: 1, count: 13 }, { from: 2, to: 2, count: 8 }, { from: 3, to: 3, count: 5 }], regions: [{ region: 'Kent', count: 9 }], elsewhere: 17 },
      get_business_insights_funnel: { period_days: 30, saw: { value: 20, prev: 10 }, opened: { value: 3, visits: 9, prev: 1 }, followed: { value: 1, total: 1, prev: 0 }, tapped: { value: 1, prev: 0 }, top_post: null },
      get_business_insights: { headline: {}, visits_series: [{ day: '2026-11-20', total: 9, unique: 3 }], followers_series: [], sources: [{ source: 'search', count: 9 }], content: [] },
      '/rest/v1/posts': [{ created_at: '2026-11-20T10:00:00Z' }],
    });
    const Funnel = (fn as any).InsightsFunnel ?? (fn as any).default;
    node = <div style={{ display: 'grid', gap: 14, padding: '14px 0' }}>
      {Funnel ? <FunnelWrap C={Funnel} /> : null}
      <v.InsightsVisitsSection businessId={B} range={'30d' as any} />
      <m.InsightsReviewsSection businessId={B} businessName={NAME} days={30} canManage onNavigate={noop as any} />
      <p.InsightsPostsSection businessId={B} days={30} canPost onPost={noop} onOpen={noop as any} />
      <f.InsightsFollowersSection businessId={B} businessName={NAME} days={30} />
      <e.InsightsEngagementSection businessId={B} days={30} />
      <c.InsightsCourseSection businessId={B} businessName={NAME} days={30} onNavigate={noop as any} />
      <a.InsightsAudienceSection businessId={B} />
    </div>;
  } else if (s === 'analytics') {
    const S = await import('@/features/business/clubAnalytics/sections');
    const hole = (n: number, rank: number, atp: number, si: number) => ({ hole_no: n, par: n % 3 === 0 ? 3 : 4, stroke_index: si, measured_rank: rank, avg_to_par: atp, rounds: 738, yards: 380, low_to_par: null, low_rows: 0, high_to_par: null, high_rows: 0, spread: null, si_should_be: null, places_gap: null, shots_gap: null, birdie_plus: 31, par_count: 248, bogey: 301, double_plus: 158 });
    const holes = Array.from({ length: 18 }, (_, i) => hole(i + 1, ((i * 7) % 18) + 1, 1 - ((i * 7) % 18) / 18, ((i * 5) % 18) + 1));
    const data: any = { course_id: 'east', course_name: 'Sundridge Park Golf Club (East Course)', club_courses: [], rounds: 901, complete_rounds: 738, hole_rows: 13284, members: 21, first_round: '2019-04-01', last_round: '2026-11-20', avg_gross: 81.7, holes,
      outcomes: { ace: 0, albatross: 0, eagle: 2, birdie: 31, par: 248, bogey: 301, double_plus: 158 }, outcomes_total: 740, months: [], weekdays: [], years: [], club_courses_note: null,
      tees: [{ yards: 6400, rounds: 400, avg_to_par: 10, mean_index: 12.1, low: 100, mid: 150, high: 100, with_index: 350 }, { yards: 6000, rounds: 300, avg_to_par: 12, mean_index: 16.4, low: 50, mid: 100, high: 120, with_index: 270 }],
      handicap_bands: [{ label: 'Scratch to 4.9', rounds: 120, members: 4 }, { label: '5 to 9.9', rounds: 200, members: 6 }, { label: '10 to 14.9', rounds: 180, members: 6 }, { label: '15 and above', rounds: 100, members: 5 }], handicap_rounds: 600, competition: null, record_book: null };
    const safe = (C: any, props: any) => { try { return <C {...props} />; } catch { return null; } };
    node = <div style={{ display: 'grid', gap: 14, padding: 16 }}>
      {safe(S.SampleSection, { data })}{safe(S.HoleBySection, { data, businessName: NAME, courseCount: 2 })}{safe(S.HowItPlaysSection, { data })}
      {safe(S.IndexDisagreesSection, { data })}{safe(S.RecordBookSection, { data })}{safe(S.TeesSection, { data })}{safe(S.TeeSheetSection, { data })}{safe(S.WhoPlaysSection, { data })}
    </div>;
  } else if (s === 'cards') {
    const { BusinessFollowersCard } = await import('@/components/business/BusinessFollowersCard');
    const { ClubFromTheClub } = await import('@/components/business/ClubFromTheClub');
    const { BusinessNearbyCourses } = await import('@/components/business/BusinessNearbyCourses');
    const W = await import('@/components/business/home/BusinessWeekCard');
    const { BusinessDoNextCard } = await import('@/components/business/home/BusinessDoNextCard');
    const { ClubHowItPlays } = await import('@/components/business/ClubHowItPlays');
    set(['business-follower-golf', B], { handicap_count: 10, bands: { under5: 2, b5: 2, b10: 2, b15: 2, b20: 2 }, courses: [] });
    const near = Array.from({ length: 6 }, (_, i) => ({ course_id: 'c' + i, course_name: ['Royal Blackheath Golf Club', 'Sundridge Park East', 'Langley Park Golf Club', 'Chislehurst Golf Club', 'Bromley Golf Centre', 'Shooters Hill'][i], distance_km: 2 + i, thumbnail_image: null, rating_avg: 8.4, review_count: 12 }));
    set(['business-nearby-counts', 51.4, 0.02], { coursesNear: 6, top100Near: 0, courses: near.map(n => ({ id: n.course_id, name: n.course_name, distanceKm: n.distance_km, thumbnail: null, ratingAvg: 8.4, reviewCount: 12, isTop100: false })) });
    Object.assign(FX, { get_nearby_courses: near, course_top100_memberships: [], get_course_stats_batch: near.map(n => ({ course_id: n.course_id, your_rounds: 0, your_best: null, avg_over_par: 8, rounds_tracked: 100 })) });
    const week = { window_start: '2026-11-16T00:00:00Z', window_end: '2026-11-23T00:00:00Z', visits: 9, visits_prev: 3, seen_by: 20, seen_by_prev: 10, new_followers: 2, followers_total: 12, taps: { website: 1, directions: 0, call: 0, message: 0 }, bars: { visits: [0, 1, 1, 1, 2, 2, 2], seen_by: [1, 2, 3, 3, 3, 4, 4], new_followers: [0, 0, 0, 0, 0, 1, 1] }, created_at: '2026-01-01T00:00:00Z', first_week: false, last_post_at: null };
    set(['business-week', B], week);
    set(['business-pending-requests-oldest', B], { count: 1, oldest: '2026-11-01T00:00:00Z' });
    Object.assign(FX, { business_access_requests: [{ created_at: '2026-11-01T00:00:00Z' }], get_business_reviews_v2: { reviews: [], summary: { awaiting_reply: 2 }, courses: [] }, get_course_stats_detail: { course_id: 'c1', rounds_tracked: 100, avg_over_par: 8.2, harder_than_pct: 70, your_rounds: 2, your_best: 80, your_best_at: null, circle_played: 0, top100_rank: null, top100_list: null, hardest_hole_no: 4, hardest_hole_par: 4, hardest_hole_plays: 1.2 }, get_course_hole_analysis: { available: false, total_rounds: 100, holes: [] } });
    const courses = [{ id: 'c1', name: 'East Course', region: 'Kent', country: 'England' }];
    node = <div style={{ paddingBottom: 30 }}>
      <BusinessFollowersCard isClub={false} businessId={B} />
      <ClubFromTheClub businessId={B} businessName={NAME} postsCount={4} isOwner={false} />
      <BusinessNearbyCourses isClub={false} viewerId="u1" business={{ id: B, name: 'The Bromley Court Hotel', category: 'Hotel / Accommodation', lat: 51.4, lng: 0.02 } as any} />
      <W.BusinessWeekCard businessId={B} name="Sundridge Park" />
      <BusinessDoNextCard membership={{ role: 'owner', business: { id: B, name: 'Sundridge Park', club_id: 'club1', is_verified: true } } as any} />
      <ClubHowItPlays isClub courses={courses as any} onOpen={noop as any} />
    </div>;
  } else if (s === 'empty') {
    const { BusinessEmptyState } = await import('@/components/business/BusinessEmptyState');
    node = <BusinessEmptyState onCreate={noop} />;
  } else if (s.startsWith('create')) {
    const { initialDraft } = await import('@/features/business-create/createRules');
    const { Step2Club } = await import('@/features/business-create/Step2Club');
    const { Step2College } = await import('@/features/business-create/Step2College');
    const { Step2Other } = await import('@/features/business-create/Step2Other');
    const { BusinessCreateStep3 } = await import('@/features/business-create/BusinessCreateStep3');
    const { BusinessCreateStep4 } = await import('@/features/business-create/BusinessCreateStep4');
    const { BusinessCreateFinish } = await import('@/features/business-create/BusinessCreateFinish');
    const base = initialDraft(new URLSearchParams());
    const cat = s === 'create2college' ? 'University / College' : s === 'create2other' ? 'Golf Academy' : 'Golf Club';
    const Host = () => { const [d, setD] = useState<any>({ ...base, category: cat, businessName: 'Sundridge Park Golf Academy' });
      if (s === 'create2club') return <Step2Club draft={d} setDraft={setD} userId="u1" onContinue={noop} />;
      if (s === 'create2college') return <Step2College draft={d} setDraft={setD} userId="u1" onContinue={noop} />;
      if (s === 'create2other') return <Step2Other draft={d} setDraft={setD} userId="u1" onContinue={noop} />;
      if (s === 'create3') return <BusinessCreateStep3 draft={d} setDraft={setD} onContinue={noop} />;
      if (s === 'create4') return <BusinessCreateStep4 draft={d} setDraft={setD} onFinish={noop as any} />;
      return <BusinessCreateFinish draft={d} result={{ id: B, slug: 'sundridge', partials: [], claim: 'none' }} userId="u1" />; };
    if (s === 'create1') { const P = (await import('@/pages/BusinessCreate')).default; node = <P />; path = '/business/create'; }
    else node = <div className="bizc-root"><Host /></div>;
  } else if (s === 'live') {
    const P = (await import('@/pages/BusinessProfileLiveSuccessPage')).default; path = '/business/success';
    node = <Routes><Route path="/business/success" element={<P />} /></Routes>;
    (window as any).__state = { businessId: B, businessName: 'Sundridge Park', category: 'Golf Club', location: 'Kent', slug: 'sundridge' };
  } else if (s.startsWith('invite')) {
    const P = (await import('@/pages/BusinessInviteAcceptPage')).default;
    const inv = { id: 'i1', business_id: B, role: 'editor', status: s === 'invite-revoked' ? 'revoked' : 'pending', business: { name: 'Sundridge Park Golf Club', logo_url: null, slug: 'sundridge' } };
    if (s !== 'invite-unavailable') Object.assign(FX, { business_invites: inv, accept_business_invite: { success: true, business_id: B } });
    path = s === 'invite-unavailable' ? '/business/invite/accept' : '/business/invite/accept?token=t1';
    node = <P />;
  } else if (s === 'team') {
    const { TeamListSection } = await import('@/components/business/TeamListSection');
    const { TeamInvitesSection } = await import('@/components/business/TeamInvitesSection');
    const { AccessRequestsSection } = await import('@/components/business/AccessRequestsSection');
    const prof = (id: string, n: string) => ({ id, display_name: n, username: n.toLowerCase().replace(/\s/g, ''), profile_photo_url: null });
    const team = [{ id: 'm1', user_profile_id: 'u1', role: 'owner', created_at: '2026-01-01', is_public: true, job_title: 'General Manager', user_profile: prof('u1', 'Ben Carter') },
      { id: 'm2', user_profile_id: 'u2', role: 'admin', created_at: '2026-02-01', is_public: true, job_title: null, user_profile: prof('u2', 'Alexandra Montgomery-Whitfield') }];
    const invites = [{ id: 'iv1', business_id: B, invited_by: 'u1', invitee_email: 'sam.longname@example.com', invitee_user_id: null, role: 'editor', status: 'pending', created_at: '2026-11-20T00:00:00Z', expires_at: '2026-12-20T00:00:00Z', token: 't' }];
    set(['business-access-requests', B], [{ id: 'r1', business_id: B, requester_user_profile_id: 'u3', requested_role: 'editor', message: null, status: 'pending', created_at: '2026-11-21T00:00:00Z', requester: { ...prof('u3', 'Christopher Featherstonehaugh'), primary_club_id: null, home_club_visibility: null } }]);
    node = <div className="team-page" style={{ padding: '14px 0' }}>
      <AccessRequestsSection businessId={B} businessName={NAME} canManage />
      <TeamListSection businessId={B} businessName={NAME} team={team as any} viewerRole={(new URLSearchParams(location.search).get('admin') ? 'admin' : 'owner') as any} viewerId={new URLSearchParams(location.search).get('admin') ? 'u2' : 'u1'} loading={false} failed={false} onRetry={noop} />
      <TeamInvitesSection businessId={B} businessName={NAME} team={team as any} invites={invites as any} canManage viewerId="u1" />
    </div>;
  } else if (s === 'claim') {
    const C = (await import('@/components/business/ClaimYourCourseSheet')).default; node = <C open onClose={noop} businessId={B} businessName={NAME} />;
  } else if (s === 'verify') {
    const { default: V } = await import('@/components/business/verification/VerificationFlowSheet') as any;
    const C = V ?? (await import('@/components/business/verification/VerificationFlowSheet') as any).VerificationFlowSheet;
    set(['business-verification-wizard', B], { id: B, name: NAME, category: 'Golf Club', location: 'Bromley, Kent', website: 'https://sundridgepark.com', email: 'office@sundridgepark.com' });
    node = <C open onOpenChange={noop} businessId={B} />;
  } else if (s === 'you') {
    const { YouCardShell } = await import('@/components/business/YouCardShell');
    node = <div style={{ padding: 16 }}><YouCardShell dataAttr="data-club-you" kicker="You and Sundridge Park Golf Club" first={<>You've played 12 rounds here <span>across both courses.</span></>} second="Your best is 80 on the East Course." faces={null} /></div>;
  } else if (s.startsWith('say')) {
    const { ClubWhatGolfersSay } = await import('@/components/business/ClubWhatGolfersSay');
    const courses = [{ id: 'c1', name: 'Sundridge Park Golf Club (East Course)', region: 'Kent', country: 'England' }, { id: 'c2', name: 'Sundridge Park Golf Club (West Course)', region: 'Kent', country: 'England' }];
    const ratings = s === 'say-empty' ? [] : [{ course_id: 'c1', rating: 8.4, design_score: 8, condition_score: 8, facilities_score: 8, clubhouse_score: 8, created_at: '2026-11-20T00:00:00Z' }];
    Object.assign(FX, { business_accounts: { club_id: 'club1' }, golf_courses: courses.map(c => ({ id: c.id, name: c.name })), 'course_ratings?select=course_id%2Crating': ratings, 'course_ratings?select=id': s === 'say-empty' ? null : { id: 'r1', course_id: 'c1', user_id: 'u2', rating: 8.4, review: 'Great course in lovely condition.', review_date: '2026-11-20', user_profiles: { id: 'u2', username: 'alex', display_name: 'Alex', profile_photo_url: null } } });
    node = <ClubWhatGolfersSay isClub businessId={B} businessName="Sundridge Park Golf Club" courses={courses as any} viewerId="u1" isTeamMember={false} />;
  } else if (s === 'request') {
    const R = (await import('@/components/business/RequestAnotherCourseSheet')).default;
    Object.assign(FX, { golf_courses: [{ id: 'c2', name: 'Sundridge Park North Course', country: 'England', sub_country: 'Kent', thumbnail_image: null, club_id: 'club1' }], course_requests: [] });
    node = <R open onClose={noop} businessId={B} businessName={NAME} clubId="club1" clubName={NAME} existingCourses={[{ course_id: 'c1', course_name: 'East Course' }] as any} />;
  } else if (s === 'delete') {
    const D = (await import('@/components/manage/overlays/DeleteAccountConfirmSheet')).default;
    const H = () => { const [t, setT] = useState(''); return <D open onClose={noop} onConfirm={noop as any} confirmText={t} setConfirmText={setT} isWorking={false} />; };
    node = <H />;
  }
  const state = (window as any).__state;
  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={qc}><MemoryRouter initialEntries={[state ? { pathname: path, state } : path]}>
      <div data-fixture-ready>{node}</div>
    </MemoryRouter></QueryClientProvider>);
}
function FunnelWrap({ C }: { C: any }) { return <C funnel={FX.get_business_insights_funnel} businessName={NAME} days={30} canPost onPost={noop} />; }
main();
