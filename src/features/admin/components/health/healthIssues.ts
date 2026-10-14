/**
 * The Health verdict (BRIEF_HEALTH, Status rule 1). ONE list of issues feeds
 * the Status verdict, the Systems row tones AND the admin drawer's Health dot,
 * so the dot and the page can never disagree.
 */
import { useMemo } from 'react';
import { useEgSyncHealth, type EgSyncHealth } from '../../hooks/useDashboard';
import { useEchoEngineHealth } from '../../hooks/useEchoEngineHealth';
import { usePushHealth } from '../../hooks/usePushHealth';
import { useDeletionIntegrity } from '../../hooks/useDeletionIntegrity';
import {
  useHealthApp, useHealthGolf, useHealthJobs,
  type HealthApp, type HealthGolf, type HealthJob, type HealthJobs,
} from '../../hooks/useHealthLenses';
import { dayMonHM, describeSchedule, prevRun } from './cronText';
import { plainJobName } from './jobNames';
import { countWord, hoursMins, joinAnd, plural } from './healthText';

export type IssueLens = 'golf' | 'app' | 'jobs';
export type IssueArea = 'eg' | 'pipeline' | 'matching' | 'echo' | 'push' | 'errors' | 'jobs' | 'deletion';
export interface Issue { tone: 'warn' | 'danger'; title: string; body?: string; lens: IssueLens; area: IssueArea }

const EG_SYNC = (name: string) => name.startsWith('sync-whs-due');

/** Missed = not_run, active, and its previous scheduled time falls inside the kept history (+5 min). */
export function isMissed(job: HealthJob, historyFrom: string | null, now: Date = new Date()): boolean {
  if (job.state !== 'not_run' || !job.active || !historyFrom) return false;
  const from = new Date(historyFrom).getTime();
  const prev = prevRun(job.schedule, now);
  if (!prev || Number.isNaN(from)) return false;
  return prev.getTime() > from + 5 * 60_000;
}

export interface JobProblems { neverOk: HealthJob[]; failing: HealthJob[]; missed: HealthJob[] }
export function jobProblems(jobs: HealthJobs | undefined, now: Date = new Date()): JobProblems {
  const list = jobs?.jobs ?? [];
  return {
    neverOk: list.filter((j) => j.state === 'never_ok'),
    failing: list.filter((j) => j.state === 'failing'),
    missed: list.filter((j) => isMissed(j, jobs?.history_from ?? null, now)),
  };
}

/** Crash-free percentage (App rule 1), or null while no session carries a build. */
export function crashFree(app: HealthApp | undefined): { pct: number; text: string } | null {
  const den = app?.sessions_7d_current;
  if (den == null || den === 0) return null;
  const crashed = app?.crashed_sessions_7d ?? 0;
  if (crashed === 0) return { pct: 100, text: '100%' };
  const p = Math.max(0, (100 * (den - crashed)) / den);
  const floored = Math.floor(p * 10) / 10;
  return { pct: floored, text: `${floored.toFixed(1).replace(/\.0$/, '')}%` };
}

function neverOkIssue(js: HealthJob[], now: Date): Issue {
  const names = js.map((j) => plainJobName(j.name));
  const words = js.map((j) => describeSchedule(j.schedule, now));
  const eg = js.some((j) => EG_SYNC(j.name));
  const one = js.length === 1;
  const allMonthly = words.every((w) => w.shape === 'monthly');
  const title = one
    ? `${names[0]} has never run successfully`
    : `${countWord(js.length)} ${allMonthly ? 'monthly' : 'scheduled'} jobs have never run successfully`;
  const shared = words.every((w) => w.phrase === words[0].phrase);
  const verb = one ? 'is' : 'are';
  const has = one ? 'has' : 'have';
  const sched = shared
    ? `${joinAnd(names)} ${verb} scheduled ${words[0].phrase}`
    : joinAnd(names.map((nm, i) => `${nm} (${words[i].text})`));
  const body = `${sched} and ${has} failed every time.${eg ? '' : ' Members are not affected yet.'}`;
  return { tone: eg ? 'danger' : 'warn', title, body, lens: 'jobs', area: 'jobs' };
}

export interface IssueInput {
  eg?: Partial<EgSyncHealth> | null;
  golf?: HealthGolf;
  app?: HealthApp;
  jobs?: HealthJobs;
  echoLatest?: { ok: boolean }[] | null;
  pushErrored24h?: number | null;
  deletion?: { live_sessions: number; unbanned: number } | null;
  now?: Date;
}

export function buildIssues(i: IssueInput): Issue[] {
  const now = i.now ?? new Date();
  const out: Issue[] = [];
  const add = (x: Issue) => out.push(x);

  // a. England Golf
  if (i.eg?.token_unavailable) add({ tone: 'danger', title: 'England Golf sign-in has expired', body: 'No rounds are syncing until the pre-auth token is renewed.', lens: 'golf', area: 'eg' });
  const fresh = i.eg?.freshest_hours_ago;
  if (fresh != null && fresh > 12) add({ tone: 'danger', title: `No England Golf sync for ${Math.round(fresh)} hours`, lens: 'golf', area: 'eg' });
  const c = i.golf?.connections;
  if (c) {
    if (c.connected && c.stale != null && c.stale / c.connected > 0.25) {
      add({ tone: 'danger', title: 'England Golf sync is behind', body: `${c.stale} of ${plural(c.connected, 'connection')} have not synced in 12 hours.`, lens: 'golf', area: 'eg' });
    }
    if ((c.reauth ?? 0) > 0) add({ tone: 'warn', title: `${plural(c.reauth!, 'member')} ${c.reauth === 1 ? 'needs' : 'need'} to reconnect England Golf`, lens: 'golf', area: 'eg' });
    if ((c.failing ?? 0) > 0) add({ tone: 'warn', title: `${plural(c.failing!, 'England Golf connection')} ${c.failing === 1 ? 'keeps' : 'keep'} failing`, lens: 'golf', area: 'eg' });
  }

  // b. Round analysis
  const st = i.golf?.stuck;
  if ((st?.stuck ?? 0) > 0) add({ tone: 'danger', title: `${plural(st!.stuck!, 'round')} stuck in analysis`, lens: 'golf', area: 'pipeline' });
  if ((st?.failed_7d ?? 0) > 0) add({ tone: 'warn', title: `${plural(st!.failed_7d!, 'round')} failed analysis this week`, lens: 'golf', area: 'pipeline' });
  const p = i.golf?.promise;
  if (p?.median_hrs != null && p.median_hrs > p.target_hrs) add({ tone: 'warn', title: `Rounds are taking ${hoursMins(p.median_hrs)} to reach members`, lens: 'golf', area: 'pipeline' });

  // c. Jobs
  if (i.jobs) {
    const jp = jobProblems(i.jobs, now);
    if (jp.neverOk.length) add(neverOkIssue(jp.neverOk, now));
    if (jp.failing.length === 1) add({ tone: 'warn', title: `${plainJobName(jp.failing[0].name)} failed its last run`, lens: 'jobs', area: 'jobs' });
    else if (jp.failing.length > 1) add({ tone: 'warn', title: `${countWord(jp.failing.length)} scheduled jobs failed their last run`, lens: 'jobs', area: 'jobs' });
    if (jp.missed.length === 1) {
      const j = jp.missed[0];
      add({ tone: 'warn', title: `${plainJobName(j.name)} missed its run on ${dayMonHM(prevRun(j.schedule, now))}`, lens: 'jobs', area: 'jobs' });
    } else if (jp.missed.length > 1) add({ tone: 'warn', title: `${countWord(jp.missed.length)} scheduled jobs missed a run`, lens: 'jobs', area: 'jobs' });
  }

  // d. App
  const e7 = i.app?.errors_7d_current ?? 0;
  if (e7 > 0) add({ tone: 'warn', title: `${plural(e7, 'error')} from the current build this week`, lens: 'app', area: 'errors' });
  const cf = crashFree(i.app);
  if (cf && cf.pct < 99) add({ tone: 'danger', title: `Crash-free sessions are down to ${cf.text}`, lens: 'app', area: 'errors' });

  // e. Services
  const latest = i.echoLatest ?? [];
  const bad = latest.filter((x) => !x.ok).length;
  if (bad > 0) add({ tone: 'warn', title: `${bad} of ${latest.length} Echo engines ${bad === 1 ? 'is' : 'are'} not answering`, lens: 'app', area: 'echo' });
  if ((i.pushErrored24h ?? 0) > 0) add({ tone: 'warn', title: `${plural(i.pushErrored24h!, 'push notification')} failed in 24h`, lens: 'app', area: 'push' });
  const del = (i.deletion?.live_sessions ?? 0) + (i.deletion?.unbanned ?? 0);
  if (del > 0) add({ tone: 'danger', title: `${plural(del, 'deleted account')} ${del === 1 ? 'is' : 'are'} not fully erased`, lens: 'jobs', area: 'deletion' });

  // f. Course matching
  const q = i.golf?.quality;
  if (q?.rounds && q.course_matched != null && q.course_matched / q.rounds < 0.95) {
    const off = q.rounds - q.course_matched;
    add({ tone: 'warn', title: `${plural(off, 'round')} ${off === 1 ? 'is' : 'are'} on unmatched courses`, lens: 'golf', area: 'matching' });
  }

  // Danger before warn, rule order kept within each.
  return [...out.filter((x) => x.tone === 'danger'), ...out.filter((x) => x.tone === 'warn')];
}

export function areaTone(issues: Issue[], area: IssueArea): 'ok' | 'warn' | 'danger' {
  const mine = issues.filter((x) => x.area === area);
  if (mine.some((x) => x.tone === 'danger')) return 'danger';
  return mine.length ? 'warn' : 'ok';
}

export function useHealthVerdict() {
  const golf = useHealthGolf();
  const app = useHealthApp();
  const jobs = useHealthJobs();
  const eg = useEgSyncHealth();
  const echo = useEchoEngineHealth();
  const push = usePushHealth();
  const deletion = useDeletionIntegrity();

  const issues = useMemo(() => buildIssues({
    eg: eg.data ?? null, golf: golf.data, app: app.data, jobs: jobs.data,
    echoLatest: echo.data?.latest ?? null, pushErrored24h: push.data?.queue.errored_24h ?? null,
    deletion: deletion.data ?? null,
  }), [eg.data, golf.data, app.data, jobs.data, echo.data, push.data, deletion.data]);

  const isLoading = golf.isLoading || app.isLoading || jobs.isLoading;
  const isError = (!golf.data && golf.isError) || (!app.data && app.isError) || (!jobs.data && jobs.isError);
  const checkedAt = Math.max(golf.dataUpdatedAt, app.dataUpdatedAt, jobs.dataUpdatedAt, push.dataUpdatedAt || 0);
  const retry = () => { void golf.refetch(); void app.refetch(); void jobs.refetch(); };
  return { issues, isLoading, isError, checkedAt, retry, retrying: golf.isFetching || app.isFetching || jobs.isFetching };
}
