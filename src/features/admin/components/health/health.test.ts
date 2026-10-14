import { describe, expect, it } from 'vitest';
import { buildIssues, isMissed } from './healthIssues';
import { describeSchedule, nextRun } from './cronText';
import { logMeta, logTitle } from './healthLog';
import { canonicalHealthParams, healthViewOf, legacyHealthLens } from './healthLens';
import { mapGolf, mapApp, mapJobs, type HealthJob } from '../../hooks/useHealthLenses';

const golf = (o: any = {}) => mapGolf({
  promise: { median_hrs: 2, target_hrs: 6, days: [] },
  connections: { connected: 20, fresh: 20, stale: 0, reauth: 0, failing: 0 },
  quality: { rounds: 100, course_matched: 100 },
  stuck: { stuck: 0, failed_7d: 0 },
  ...o,
});
const job = (o: Partial<HealthJob>): HealthJob => ({
  id: 1, name: 'x', schedule: '0 3 * * *', active: true, state: 'ok', runs: 1, ok: 1, failed: 0,
  last_run_at: null, last_ok_at: null, last_status: null, last_error: null, last_secs: null, recent: [], ...o,
});
const jobs = (list: HealthJob[], from = '2026-10-07T13:00:00Z') => mapJobs({ history_from: from, jobs: list });
const NOW = new Date('2026-10-14T12:00:00Z');
const titles = (i: Parameters<typeof buildIssues>[0]) => buildIssues({ now: NOW, ...i }).map((x) => `${x.tone}:${x.title}`);

describe('healthIssues', () => {
  it('is empty when everything is normal', () => {
    expect(buildIssues({ now: NOW, golf: golf(), jobs: jobs([job({})]) })).toEqual([]);
  });
  it('England Golf rules', () => {
    expect(titles({ eg: { token_unavailable: true } })).toEqual(['danger:England Golf sign-in has expired']);
    expect(titles({ eg: { freshest_hours_ago: 13 } })).toEqual(['danger:No England Golf sync for 13 hours']);
    expect(titles({ golf: golf({ connections: { connected: 20, stale: 6, reauth: 1, failing: 2 } }) })).toEqual([
      'danger:England Golf sync is behind', 'warn:1 member needs to reconnect England Golf', 'warn:2 England Golf connections keep failing',
    ]);
    expect(titles({ golf: golf({ connections: { connected: 20, stale: 5 } }) })).toEqual([]);
  });
  it('round analysis rules', () => {
    expect(titles({ golf: golf({ stuck: { stuck: 2, failed_7d: 1 }, promise: { median_hrs: 7.5, target_hrs: 6 } }) })).toEqual([
      'danger:2 rounds stuck in analysis', 'warn:1 round failed analysis this week', 'warn:Rounds are taking 7h 30m to reach members',
    ]);
  });
  it('never_ok jobs: monthly pair, shared schedule, members line', () => {
    const iss = buildIssues({ now: NOW, jobs: jobs([
      job({ name: 'refresh-course-mood-blurbs-monthly', schedule: '0 3 1 * *', state: 'never_ok' }),
      job({ id: 2, name: 'snapshot-player-statistics', schedule: '0 8 1 * *', state: 'never_ok' }),
    ]) });
    expect(iss[0].title).toBe('Two monthly jobs have never run successfully');
    expect(iss[0].tone).toBe('warn');
    expect(iss[0].body).toBe('Course mood blurbs and Monthly player stats snapshot are scheduled for the 1st of each month and have failed every time. Members are not affected yet.');
  });
  it('never_ok England Golf sync is danger and drops the members line', () => {
    const [i] = buildIssues({ now: NOW, jobs: jobs([job({ name: 'sync-whs-due-every-6h', schedule: '0 */6 * * *', state: 'never_ok' })]) });
    expect(i.tone).toBe('danger');
    expect(i.title).toBe('England Golf sync has never run successfully');
    expect(i.body).not.toContain('Members are not affected');
  });
  it('failing jobs', () => {
    expect(titles({ jobs: jobs([job({ name: 'refresh-hero-stories', state: 'failing' })]) })).toEqual(['warn:Hero stories failed its last run']);
    expect(titles({ jobs: jobs([job({ state: 'failing' }), job({ id: 2, state: 'failing' })]) })).toEqual(['warn:Two scheduled jobs failed their last run']);
  });
  it('missed: daily not_run inside history is an issue; monthly before history is not; paused is not', () => {
    const daily = job({ name: 'refresh-hero-stories', schedule: '0 3 * * *', state: 'not_run' });
    const monthly = job({ id: 2, name: 'snapshot-player-statistics', schedule: '0 8 1 * *', state: 'not_run' });
    const paused = job({ id: 3, schedule: '0 3 * * *', state: 'not_run', active: false });
    const j = jobs([daily, monthly, paused]);
    expect(isMissed(daily, j.history_from, NOW)).toBe(true);
    expect(isMissed(monthly, j.history_from, NOW)).toBe(false);
    expect(isMissed(paused, j.history_from, NOW)).toBe(false);
    expect(titles({ jobs: j })).toEqual(['warn:Hero stories missed its run on 14 Oct 04:00']);
  });
  it('app rules', () => {
    expect(titles({ app: mapApp({ errors_7d_current: 1, sessions_7d_current: 100, crashed_sessions_7d: 2 }) })).toEqual([
      'danger:Crash-free sessions are down to 98%', 'warn:1 error from the current build this week',
    ]);
    expect(titles({ app: mapApp({ sessions_7d_current: null, crashed_sessions_7d: 5 }) })).toEqual([]);
  });
  it('services rules', () => {
    expect(titles({ echoLatest: [{ ok: true }, { ok: false }], pushErrored24h: 3, deletion: { live_sessions: 1, unbanned: 0 } })).toEqual([
      'danger:1 deleted account is not fully erased', 'warn:1 of 2 Echo engines is not answering', 'warn:3 push notifications failed in 24h',
    ]);
  });
  it('course matching below 95%', () => {
    expect(titles({ golf: golf({ quality: { rounds: 100, course_matched: 94 } }) })).toEqual(['warn:6 rounds are on unmatched courses']);
    expect(titles({ golf: golf({ quality: { rounds: 100, course_matched: 95 } }) })).toEqual([]);
  });
});

describe('cronText', () => {
  const summer = new Date('2026-07-01T12:00:00Z');
  const winter = new Date('2026-01-15T12:00:00Z');
  it('every shape', () => {
    expect(describeSchedule('0 */6 * * *', summer).text).toBe('every 6 hours');
    expect(describeSchedule('15 */4 * * *', summer).text).toBe('every 4 hours');
    expect(describeSchedule('20 * * * *', summer).text).toBe('hourly at :20');
    expect(describeSchedule('* * * * *', summer).text).toBe('every minute');
    expect(describeSchedule('*/1 * * * *', summer).text).toBe('every minute');
    expect(describeSchedule('*/5 * * * *', summer).text).toBe('every 5 minutes');
    expect(describeSchedule('2-59/10 * * * *', summer).text).toBe('every 10 minutes');
    expect(describeSchedule('0 9,1,17 * * *', winter).text).toBe('daily at 01:00, 09:00 and 17:00');
    expect(describeSchedule('0 6 * * 1', winter).text).toBe('weekly, Mon at 06:00');
    expect(describeSchedule('0 8 1 * *', winter).text).toBe('monthly, 1st at 08:00');
    const raw = describeSchedule('0 0 1 1 *', summer);
    expect(raw.mono).toBe(true);
    expect(raw.text).toBe('0 0 1 1 *');
  });
  it('shifts UTC to London: summer +1, winter +0', () => {
    expect(describeSchedule('0 7 * * *', summer).text).toBe('daily at 08:00');
    expect(describeSchedule('0 7 * * *', winter).text).toBe('daily at 07:00');
    expect(nextRun('0 7 * * *', summer)?.toISOString()).toBe('2026-07-02T07:00:00.000Z');
  });
});

describe('healthLog wording', () => {
  const r = (action: string, details: any = null, extra: any = {}) => ({ action, details, target_email: 'a@b.com', admin: 'Ben', ...extra });
  it('titles', () => {
    expect(logTitle(r('delete_course'))).toBe('Course deleted');
    expect(logTitle(r('SELF_DELETE_ACCOUNT_GDPR'))).toBe('Account deleted by its owner');
    expect(logTitle(r('delete_user'))).toBe('Account deleted by an admin');
    expect(logTitle(r('ADMIN_DELETE_ACCOUNT_GDPR'))).toBe('Account deleted by an admin');
    expect(logTitle(r('change_username'))).toBe('Username changed');
    expect(logTitle(r('unsuspend'))).toBe('Member unsuspended');
    expect(logTitle(r('run_cron_job', { ok: false }))).toBe('Job run by hand - failed');
    expect(logTitle(r('pause_cron_job'))).toBe('Job paused');
    expect(logTitle(r('resume_cron_job'))).toBe('Job resumed');
    expect(logTitle(r('PUBLISH_STORY'))).toBe('Publish story');
  });
  it('meta', () => {
    expect(logMeta(r('SELF_DELETE_ACCOUNT_GDPR'))).toBe('a@b.com · GDPR request');
    expect(logMeta(r('delete_course', { courseId: 'c1' }))).toBe('by Ben');
    expect(logMeta(r('change_username', { oldUsername: 'a', newUsername: 'b' }))).toBe('@a to @b · by Ben');
    expect(logMeta(r('delete_user', { reason: 'spam' }))).toBe('spam · by Ben');
    expect(logMeta(r('run_cron_job', { job: 'refresh-hero-stories' }, { admin: null }))).toBe('Hero stories');
  });
});

describe('legacy ?tab= map', () => {
  it('maps old tabs', () => {
    expect(legacyHealthLens('status')).toBe('status');
    expect(legacyHealthLens('stability')).toBe('app');
    expect(legacyHealthLens('audit')).toBe('jobs');
    expect(legacyHealthLens('tools')).toBe('golf');
  });
  it('settings and video keep their pages; non-managers see settings', () => {
    expect(healthViewOf(new URLSearchParams('tab=settings'), true)).toEqual({ kind: 'settings' });
    expect(healthViewOf(new URLSearchParams('tab=video'), true)).toEqual({ kind: 'video' });
    expect(healthViewOf(new URLSearchParams('lens=jobs'), false)).toEqual({ kind: 'settings' });
    expect(healthViewOf(new URLSearchParams(''), true)).toEqual({ kind: 'lens', lens: 'status' });
  });
  it('rewrites ?tab= to ?lens=', () => {
    const p = new URLSearchParams('tab=audit');
    expect(canonicalHealthParams(p, healthViewOf(p, true))?.toString()).toBe('lens=jobs');
  });
});
