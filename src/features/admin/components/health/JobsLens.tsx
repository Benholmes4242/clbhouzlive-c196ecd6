/** Health: Jobs lens (health_jobs.html). */
import React, { useState } from 'react';
import { adminTheme as t } from '../../theme';
import ConfirmDialog from '../ConfirmDialog';
import AdminSheet from '../AdminSheet';
import { Fig, FooterButton, Head, Muted, Panel, ROW_RULE, Slot, FIG_LABEL, KICKER } from '../analytics/analyticsUi';
import { num } from '../analytics/analyticsFormat';
import {
  useHealthJobs, useHealthLog, useRunJob, useSetJobActive,
  type HealthJob, type HealthJobs, type HealthLogRow, type LogKind,
} from '../../hooks/useHealthLenses';
import { useDeletionIntegrity } from '../../hooks/useDeletionIntegrity';
import { dayMonHM, describeSchedule, nextRun } from './cronText';
import { jobName } from './jobNames';
import { isMissed } from './healthIssues';
import { hasDetails, logLetter, logMeta, logTitle } from './healthLog';
import { ageOf, londonDayMon } from './healthText';
import { H, META, PillButton } from './healthUi';

type Problem = 'never_ok' | 'failing' | 'missed';
const problemOf = (j: HealthJob, from: string | null): Problem | null =>
  j.state === 'never_ok' ? 'never_ok' : j.state === 'failing' ? 'failing' : isMissed(j, from) ? 'missed' : null;

function ScheduleText({ schedule }: { schedule: string }) {
  const w = describeSchedule(schedule);
  return w.mono ? <span style={{ fontFamily: H.mono }}>{w.text}</span> : <>{w.text}</>;
}

const nextText = (j: HealthJob) => (j.active ? dayMonHM(nextRun(j.schedule)) : 'paused');

function JobActions({ job }: { job: HealthJob }) {
  const [ask, setAsk] = useState<'run' | 'pause' | null>(null);
  const run = useRunJob();
  const setActive = useSetJobActive();
  const name = jobName(job.name).name;
  return (
    <>
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <PillButton primary disabled={run.isPending} onClick={() => setAsk('run')}>Run now</PillButton>
        <PillButton disabled={setActive.isPending} onClick={() => setAsk('pause')}>{job.active ? 'Pause job' : 'Resume job'}</PillButton>
      </div>
      <ConfirmDialog
        open={ask === 'run'}
        onClose={() => setAsk(null)}
        busy={run.isPending}
        onConfirm={() => run.mutate({ id: job.id, name: job.name }, { onSettled: () => setAsk(null) })}
        title={`Run ${name} now?`}
        description="It runs exactly as if it were scheduled now, including anything it writes."
        confirmLabel="Run now"
      />
      <ConfirmDialog
        open={ask === 'pause'}
        onClose={() => setAsk(null)}
        busy={setActive.isPending}
        onConfirm={() => setActive.mutate({ id: job.id, name: job.name, active: !job.active }, { onSettled: () => setAsk(null) })}
        title={job.active ? `Pause ${name}?` : `Resume ${name}?`}
        description={job.active ? 'It will not run again until you resume it.' : 'It runs again on its schedule.'}
        confirmLabel={job.active ? 'Pause job' : 'Resume job'}
      />
    </>
  );
}

function lastRunText(j: HealthJob, from: string | null): string {
  if (!j.last_run_at) return `not since ${londonDayMon(from)}`;
  return `${londonDayMon(j.last_run_at)}, ${j.last_status === 'failed' ? 'failed' : 'ok'}`;
}

function Figures({ d }: { d: HealthJobs }) {
  const neverOk = d.jobs.filter((j) => j.state === 'never_ok').length;
  const failing = d.jobs.filter((j) => j.state === 'failing').length;
  const missed = d.jobs.filter((j) => isMissed(j, d.history_from)).length;
  const bad = neverOk + failing + missed;
  const sub = neverOk > 0 ? 'never succeeded' : missed > 0 && !failing ? 'missed a run' : 'last run failed';
  return (
    <Panel style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
      <Fig label="Jobs" value={num(d.total)} sub="scheduled" />
      <Fig label="Healthy" value={num(d.healthy)} sub="last run ok" valueColor={H.okText} />
      <Fig label="Failing" value={bad} sub={sub} valueColor={bad ? H.amber : H.okText} />
    </Panel>
  );
}

const PROBLEM_LABEL: Record<Problem, { text: string; color: string }> = {
  never_ok: { text: 'Never succeeded', color: H.dangerText },
  failing: { text: 'Failed last run', color: H.dangerText },
  missed: { text: 'Missed a run', color: H.amber },
};

function JobBlock({ j, from, problem }: { j: HealthJob; from: string | null; problem: Problem | null }) {
  const info = jobName(j.name);
  const err = j.last_error?.split('\n')[0]?.trim() || 'none recorded';
  return (
    <div style={{ padding: '12px 16px', borderTop: ROW_RULE }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'baseline' }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{info.name}</span>
        {problem && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: PROBLEM_LABEL[problem].color }}>{PROBLEM_LABEL[problem].text}</span>}
      </div>
      <div style={{ marginTop: 3, fontSize: 11, color: t.inkFaint }}>
        <span style={{ fontFamily: H.mono }}>{j.name}</span> &middot; <ScheduleText schedule={j.schedule} />
      </div>
      {info.what && <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.45, color: t.inkMuted }}>{info.what}</div>}
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, fontSize: 11 }}>
        <span><span style={{ display: 'block', ...FIG_LABEL }}>Last run</span>{lastRunText(j, from)}</span>
        <span><span style={{ display: 'block', ...FIG_LABEL }}>Next</span>{nextText(j)}</span>
        <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}><span style={{ display: 'block', ...FIG_LABEL }}>Error</span>{err}</span>
      </div>
      <JobActions job={j} />
    </div>
  );
}

function NeedsAttention({ d }: { d: HealthJobs }) {
  const list = d.jobs.map((j) => ({ j, p: problemOf(j, d.history_from) })).filter((x) => x.p);
  if (!list.length) return null;
  return (
    <Panel list>
      <div style={{ padding: '0 16px 10px' }}><span style={{ ...KICKER, color: H.amber }}>Needs attention</span></div>
      {list.map(({ j, p }) => <JobBlock key={j.id} j={j} from={d.history_from} problem={p} />)}
    </Panel>
  );
}

function runColor(s: string | null): string {
  if (s == null) return H.track;
  if (s === 'succeeded') return H.okBar;
  if (s === 'failed') return H.dangerBar;
  return H.amber;
}

function rowStatus(j: HealthJob): string {
  if (!j.active) return 'paused';
  if (!j.last_run_at) return 'not run yet';
  if (j.last_status === 'failed') return `failed ${londonDayMon(j.last_run_at)}`;
  return `ran ${ageOf(j.last_run_at)} ago`;
}

function AllJobs({ d }: { d: HealthJobs }) {
  const [open, setOpen] = useState<HealthJob | null>(null);
  const live = open ? d.jobs.find((x) => x.id === open.id) ?? open : null;
  return (
    <Panel list>
      <Head inset title="All jobs" side="last 10 runs" />
      {!d.jobs.length && <Muted style={{ padding: '10px 16px', borderTop: ROW_RULE }}>No scheduled jobs.</Muted>}
      {d.jobs.map((j) => {
        const recent = j.recent.slice(-10);
        const cells: (string | null)[] = [...Array(10 - recent.length).fill(null), ...recent];
        const quietNotRun = j.state === 'not_run' && j.active && !isMissed(j, d.history_from);
        return (
          <button key={j.id} type="button" onClick={() => setOpen(j)} style={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '10px 16px',
            border: 0, borderTop: ROW_RULE, background: 'transparent', color: t.ink, width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
          }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{jobName(j.name).name}</span>
              <span style={META}>
                <ScheduleText schedule={j.schedule} /> &middot; {quietNotRun ? `next ${dayMonHM(nextRun(j.schedule))}` : rowStatus(j)}
              </span>
            </span>
            <span style={{ display: 'inline-flex', gap: 3 }}>
              {cells.map((c, i) => <span key={i} style={{ width: 7, height: 14, borderRadius: 2, background: runColor(c) }} />)}
            </span>
          </button>
        );
      })}
      <AdminSheet open={!!live} onClose={() => setOpen(null)} title={live ? jobName(live.name).name : ''} subtitle={live?.name}>
        {live && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: t.ink }}>
            <div style={{ fontSize: 12, color: t.inkMuted }}>
              <ScheduleText schedule={live.schedule} /> &middot; next {nextText(live)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
              <Fig label="Runs" value={num(live.runs)} sub={`since ${londonDayMon(d.history_from)}`} />
              <Fig label="Ok" value={num(live.ok)} valueColor={H.okText} />
              <Fig label="Failed" value={num(live.failed)} valueColor={(live.failed ?? 0) > 0 ? H.dangerText : undefined} />
              <Fig label="Last took" value={live.last_secs == null ? '-' : `${Math.round(live.last_secs * 10) / 10}s`} />
            </div>
            <div>
              <div style={FIG_LABEL}>Last error</div>
              <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: H.mono, fontSize: 11.5, color: t.inkMuted }}>
                {live.last_error || 'none recorded'}
              </pre>
            </div>
            <JobActions job={live} />
          </div>
        )}
      </AdminSheet>
    </Panel>
  );
}

function Deletions() {
  const del = useDeletionIntegrity();
  if (del.isLoading) return <Panel style={{ height: 92 }}><span /></Panel>;
  const d = del.data;
  const live = d?.live_sessions ?? null; const unb = d?.unbanned ?? null;
  const need = (live ?? 0) + (unb ?? 0);
  const hot = (v: number | null) => (v != null && v > 0 ? H.dangerText : undefined);
  return (
    <Panel>
      <Head title="Account deletions" side={!d ? '-' : need === 0 ? 'all erased' : `${need} need action`}
        sideStyle={{ fontWeight: 700, color: !d ? t.inkFaint : need === 0 ? H.okText : H.dangerText }} />
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
        <Fig label="Still signed in" value={num(live)} valueColor={hot(live)} />
        <Fig label="Not erased" value={num(unb)} valueColor={hot(unb)} />
        <Fig label="Erased" value={num(d?.orphan_profiles)} />
      </div>
    </Panel>
  );
}

const CHIPS: { id: LogKind; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'courses', label: 'Courses' }, { id: 'accounts', label: 'Accounts' }, { id: 'content', label: 'Content' },
];

function AdminLog() {
  const [kind, setKind] = useState<LogKind>('all');
  const [open, setOpen] = useState<HealthLogRow | null>(null);
  const log = useHealthLog(kind);
  const rows = log.data?.pages.flatMap((p) => p.rows) ?? [];
  return (
    <Panel list>
      <Head inset title="Admin log" side="who did what" />
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
        {CHIPS.map((c) => {
          const on = c.id === kind;
          return (
            <button key={c.id} type="button" onClick={() => setKind(c.id)} aria-pressed={on} style={{
              height: 30, padding: '0 12px', borderRadius: 999, border: 0, fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              background: on ? t.ink : H.chip, color: on ? t.canvas : t.ink,
            }}>{c.label}</button>
          );
        })}
      </div>
      {log.isLoading && <div style={{ height: 180 }} />}
      {log.isError && !log.data && (
        <div style={{ padding: '10px 16px', borderTop: ROW_RULE, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Muted>Couldn't load the log.</Muted>
          <PillButton onClick={() => { void log.refetch(); }}>Retry</PillButton>
        </div>
      )}
      {log.data && !rows.length && <Muted style={{ padding: '10px 16px 12px', borderTop: ROW_RULE }}>Nothing logged yet.</Muted>}
      {rows.map((r) => {
        const ic = logLetter(r.kind);
        const clickable = hasDetails(r);
        const inner = (
          <>
            <span style={{ width: 28, height: 28, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: t.canvas, background: ic.bg }}>{ic.letter}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{logTitle(r)}</span>
              <span style={{ ...META, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{logMeta(r) || '\u00a0'}</span>
            </span>
            <span style={{ fontSize: 11, color: t.inkFaint }}>{ageOf(r.at, Date.now(), true)}</span>
          </>
        );
        const style: React.CSSProperties = {
          display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '10px 16px',
          border: 0, borderTop: ROW_RULE, background: 'transparent', color: t.ink, width: '100%', textAlign: 'left', fontFamily: 'inherit',
        };
        return clickable
          ? <button key={r.id} type="button" onClick={() => setOpen(r)} style={{ ...style, cursor: 'pointer' }}>{inner}</button>
          : <div key={r.id} style={style}>{inner}</div>;
      })}
      {log.hasNextPage && (
        <FooterButton onClick={() => { void log.fetchNextPage(); }}>{log.isFetchingNextPage ? 'Loading…' : 'Show older'}</FooterButton>
      )}
      <AdminSheet open={!!open} onClose={() => setOpen(null)} title={open ? logTitle(open) : ''} subtitle={open ? logMeta(open) : undefined}>
        {open && (
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: H.mono, fontSize: 11.5, color: t.inkMuted }}>
            {JSON.stringify(open.details, null, 2)}
          </pre>
        )}
      </AdminSheet>
    </Panel>
  );
}

export default function JobsLens() {
  const jobs = useHealthJobs();
  return (
    <>
      <Slot q={jobs} height={78}>{(d) => <Figures d={d} />}</Slot>
      <Slot q={jobs} height={0}>{(d) => <NeedsAttention d={d} />}</Slot>
      <Slot q={jobs} height={640}>{(d) => <AllJobs d={d} />}</Slot>
      <Deletions />
      <AdminLog />
    </>
  );
}
