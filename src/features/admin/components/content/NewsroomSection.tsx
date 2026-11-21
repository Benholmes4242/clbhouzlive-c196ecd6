/**
 * BRIEF_CONTENT_DESK Stage 2 — Newsroom (Main.html). Every figure is
 * get_admin_newsroom as returned. Editors are the existing hosts.
 */
import React, { useMemo, useState } from 'react';
import { formatAgo } from '../../lib/formatAgo';
import { radarDuration, londonDate, londonTime } from '../../lib/memberRadarDisplay';
import { categoryLabel } from '@/features/amateur/news/categories';
import { useNewsroom, isPermissionError, type Beat, type NewsroomQueueItem, type NewsroomStory } from '../../hooks/useContentDesk';
import { TourStoryEditorHost } from '../wire/TheWireTab';
import { AmateurStoryEditorHost } from '../amateur/AmateurNewsTab';
import StorySection from './StorySection';
import { DOT, beatColour } from './deskTokens';
import { CC3, NUM, PANEL3, LIST3, PANEL_TITLE, PANEL_META } from '../InboxPanels';
import { btnOutline } from '../InboxQueueRow';
import {
  LABEL10, FIG18, FIG_SMALL, CAPTION, STATS, RULE, LIST_HEAD, PANEL_HEAD, ROW, SUB, MORE3, EMPTY,
  ochip, CHIP_ROW, chipStyle, chipCount, SORT_WRAP, sortBtn, RAIL_FIG, RAIL_LABEL, INK_55,
} from './v3Styles';

export const BEAT_NAME: Record<Beat, string> = { tour: 'Tour News', amateur: 'Amateur News' };

function londonYmd(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}
const weekday = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/London' });
const dayDate = (d: string) => new Date(`${d}T12:00:00Z`);

function plural(n: number, one: string, many: string) { return `${n} ${n === 1 ? one : many}`; }

/** One chip per failing check, worded per the brief. */
export function faultChip(c: { key: string; label?: string; value?: string | number | null }): { text: string; tone: 'danger' | 'warn' } {
  const v = c.value;
  const n = typeof v === 'number' ? v : Number.parseInt(String(v ?? ''), 10);
  switch (c.key) {
    case 'image': return { text: 'No lead image', tone: 'danger' };
    case 'body': return { text: 'No body', tone: 'danger' };
    case 'players': {
      // value is "{matched} of {total} matched"
      const m = /^(\d+)\s+of\s+(\d+)/.exec(String(v ?? ''));
      const unmatched = m ? Math.max(0, Number(m[2]) - Number(m[1])) : 0;
      return { text: `${plural(unmatched, 'player', 'players')} not matched`, tone: 'danger' };
    }
    case 'category': return { text: 'No category', tone: 'danger' };
    case 'headline': return { text: `Headline ${v ?? ''}`.trim(), tone: 'danger' };
    case 'standfirst': return { text: v === 'Missing' ? 'No standfirst' : `Standfirst ${v ?? ''}`.trim(), tone: 'warn' };
    case 'credit': return { text: 'No lead credit', tone: 'warn' };
    case 'b2b': return { text: 'Images back to back', tone: 'warn' };
    case 'emdash': return { text: plural(Number.isFinite(n) ? n : 0, 'em dash', 'em dashes'), tone: 'warn' };
    case 'images': return { text: `${v ?? ''} images`.trim(), tone: 'warn' };
    default: return { text: c.label ?? c.key, tone: 'warn' };
  }
}

const DASH = '\u2014';

/** CONTENT_V3_1 cadence: three stories a week per beat. daysLeft counts today through Sunday (Saturday is 2). */
export function cadenceState(published: number, scheduled: number, daysLeft: number): { tone: 'good' | 'bad' | 'neutral'; caption: string } {
  let tone: 'good' | 'bad' | 'neutral'; let caption: string;
  if (published >= 3) { tone = 'good'; caption = 'on target'; }
  else if (3 - published - scheduled > daysLeft) { tone = 'bad'; caption = `${3 - published} short, ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`; }
  else { tone = 'neutral'; caption = `${3 - published} to go`; }
  if (scheduled > 0) caption += `${DOT}${scheduled} queued`;
  return { tone, caption };
}

/** Days from today (Europe/London) to Sunday inclusive. */
export function daysLeftInWeek(now: Date = new Date()): number {
  const wd = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short' }).format(now);
  const idx = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(wd);
  return idx < 0 ? 1 : 7 - idx;
}

/** The last 12 published stories oldest-left; empty slots pad the LEFT so the newest is right-most. */
export function storyColumns(stories: NewsroomStory[]): (NewsroomStory | null)[] {
  const last = [...stories].sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()).slice(-12);
  return [...Array.from({ length: 12 - last.length }, () => null), ...last];
}
const LABEL_COLS = new Set([0, 3, 6, 11]);
const TONE_INK = { good: CC3.good, bad: CC3.bad, neutral: CC3.ink } as const;
const SQ = (b: Beat): React.CSSProperties => ({ flex: 'none', display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: beatColour(b) });

type View = { kind: 'list' } | { kind: 'story'; beat: Beat; id: string } | { kind: 'edit'; beat: Beat; id: string; back: View };

export default function NewsroomSection() {
  const [view, setView] = useState<View>({ kind: 'list' });

  if (view.kind === 'edit') {
    const Host = view.beat === 'tour' ? TourStoryEditorHost : AmateurStoryEditorHost;
    return <Host id={view.id} onBack={() => setView(view.back)} />;
  }
  if (view.kind === 'story') {
    const self = view;
    return (
      <StorySection
        beat={view.beat}
        id={view.id}
        onBack={() => setView({ kind: 'list' })}
        onEdit={() => setView({ kind: 'edit', beat: self.beat, id: self.id, back: self })}
      />
    );
  }
  return (
    <NewsroomList
      onOpen={(beat, id) => setView({ kind: 'story', beat, id })}
      onCreate={(beat) => setView({ kind: 'edit', beat, id: 'new', back: { kind: 'list' } })}
    />
  );
}

function NewsroomList({ onOpen, onCreate }: { onOpen: (b: Beat, id: string) => void; onCreate: (b: Beat) => void }) {
  const q = useNewsroom();
  const [beat, setBeat] = useState<'all' | Beat>('all');
  const [sort, setSort] = useState<'newest' | 'read'>('newest');
  const [shown, setShown] = useState(6);

  const d = q.data;
  const stories = d?.stories ?? [];
  const counts = { all: stories.length, tour: stories.filter((s) => s.kind === 'tour').length, amateur: stories.filter((s) => s.kind === 'amateur').length };
  const list = useMemo(() => {
    const l = stories.filter((s) => beat === 'all' || s.kind === beat);
    return [...l].sort((a, b) => sort === 'read'
      ? (b.readers ?? 0) - (a.readers ?? 0)
      : new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }, [stories, beat, sort]);

  if (q.error) {
    return <section style={PANEL3}><div style={{ ...EMPTY, borderTop: 0, padding: 0 }}>{isPermissionError(q.error) ? 'Full admins only' : 'Could not load the newsroom'}</div></section>;
  }
  if (!d) return <section style={{ ...PANEL3, height: 160 }} aria-busy="true" />;

  const today = londonYmd(new Date());
  const daysLeft = daysLeftInWeek();
  const week = d.week ?? [];
  const sum = (k: keyof (typeof week)[number]) => week.reduce((a, w) => a + (Number(w[k]) || 0), 0);
  const first = week[0]?.date, last = week[week.length - 1]?.date;
  const range = first && last
    ? `${londonDate(dayDate(first).toISOString(), { day: 'numeric' })} to ${londonDate(dayDate(last).toISOString(), { day: 'numeric', month: 'short' })}`
    : '';
  const reachPct = d.active_7d ? `${Math.round(((d.readers_7d ?? 0) / d.active_7d) * 100)}%` : DASH;
  const cols = storyColumns(stories);
  const maxReaders = Math.max(1, ...cols.map((c) => c?.readers ?? 0));

  return (
    <>
      <section style={PANEL3} data-newsroom-week="">
        <div style={PANEL_HEAD}><span style={PANEL_TITLE}>This week</span><span style={PANEL_META}>{range}</span></div>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
          {week.map((w) => {
            const isToday = w.date === today;
            const marks: { beat: Beat; scheduled: boolean }[] = [
              ...Array.from({ length: w.tour }, () => ({ beat: 'tour' as Beat, scheduled: false })),
              ...Array.from({ length: w.amateur }, () => ({ beat: 'amateur' as Beat, scheduled: false })),
              ...Array.from({ length: w.tour_scheduled }, () => ({ beat: 'tour' as Beat, scheduled: true })),
              ...Array.from({ length: w.amateur_scheduled }, () => ({ beat: 'amateur' as Beat, scheduled: true })),
            ].slice(0, 4);
            return (
              <div key={w.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <div style={{
                  height: 40, width: '100%', borderRadius: 8, background: CC3.inset, boxSizing: 'border-box',
                  boxShadow: isToday ? 'inset 0 0 0 1px rgba(233,237,243,0.5)' : undefined,
                  display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 3, paddingBottom: 6,
                }}>
                  {marks.map((m, i) => (
                    <span key={i} style={{
                      display: 'block', width: 18, height: 6, borderRadius: 2,
                      background: m.scheduled ? undefined : beatColour(m.beat),
                      boxShadow: m.scheduled ? `inset 0 0 0 1.5px ${beatColour(m.beat)}` : undefined,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isToday ? CC3.ink : CC3.faint }}>
                  {isToday ? 'Today' : weekday(dayDate(w.date).toISOString())}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ ...STATS(2), ...RULE, gap: 12 }}>
          {(['tour', 'amateur'] as Beat[]).map((b) => {
            const pub = sum(b); const sch = sum(`${b}_scheduled` as any);
            const c = cadenceState(pub, sch, daysLeft);
            return (
              <div key={b} data-cadence={b} data-tone={c.tone}>
                <div style={{ ...LABEL10, display: 'flex', alignItems: 'center', gap: 6 }}><span style={SQ(b)} />{BEAT_NAME[b]}</div>
                <div style={{ ...FIG18, marginTop: 4, color: TONE_INK[c.tone] }}>{pub}<span style={FIG_SMALL}> of 3 to 4</span></div>
                <div style={CAPTION}>{c.caption}</div>
                <div style={{ marginTop: 7, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 3 }}>
                  {[0, 1, 2, 3].map((i) => {
                    const filled = i < Math.min(pub, 4);
                    const outlined = !filled && i < Math.min(pub + sch, 4);
                    return <span key={i} style={{
                      display: 'block', height: 4, borderRadius: 2,
                      background: filled ? beatColour(b) : outlined ? undefined : CC3.track,
                      boxShadow: outlined ? `inset 0 0 0 1.5px ${beatColour(b)}` : undefined,
                    }} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={PANEL3} data-newsroom-readers="">
        <div style={PANEL_HEAD}><span style={PANEL_TITLE}>Readers</span><span style={PANEL_META}>admins excluded</span></div>
        <div style={STATS(3)}>
          <div data-fig="reach"><div style={LABEL10}>Reach 7d</div><div style={{ ...FIG18, marginTop: 3 }}>{d.readers_7d ?? DASH}<span style={FIG_SMALL}> of {d.active_7d ?? DASH}</span></div><div style={{ ...CAPTION, ...NUM }}>{reachPct === DASH ? DASH : `${reachPct} of active members`}</div></div>
          <div data-fig="avg-read"><div style={LABEL10}>Avg read</div><div style={{ ...FIG18, marginTop: 3 }}>{radarDuration(d.avg_read_secs_30d)}</div><div style={CAPTION}>per story opened, 30d</div></div>
          <div data-fig="through"><div style={LABEL10}>Read through</div><div style={{ ...FIG18, marginTop: 3 }}>{d.avg_through == null ? DASH : `${Math.round(d.avg_through)}%`}</div><div style={CAPTION}>average per story</div></div>
        </div>
        <div style={RULE}>
          <div style={PANEL_HEAD}>
            <span style={LABEL10}>Story by story</span>
            <span style={{ ...PANEL_META, display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 9 }}>
              {(['tour', 'amateur'] as Beat[]).map((b) => <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={SQ(b)} />{b}</span>)}
            </span>
          </div>
          <div style={{ marginTop: 12 }}>
            <div data-story-bars="" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 4, height: 64, alignItems: 'end' }}>
              {cols.map((c, i) => {
                if (!c) return <span key={`pad-${i}`} data-slot="empty" />;
                const n = c.readers ?? 0;
                return <span key={`${c.kind}:${c.id}`} data-slot={n > 0 ? 'bar' : 'stub'} title={`${c.headline}: ${n} readers`} style={{
                  display: 'block', borderRadius: '3px 3px 0 0',
                  height: n > 0 ? Math.max(2, (n / maxReaders) * 64) : 2, background: n > 0 ? beatColour(c.kind) : CC3.track,
                }} />;
              })}
            </div>
            <div style={{ height: 1, background: CC3.line }} />
            <div data-story-labels="" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 4, marginTop: 5 }}>
              {cols.map((c, i) => <span key={i} style={{ fontSize: 10, fontWeight: 600, color: CC3.faint, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {c && LABEL_COLS.has(i) ? londonDate(c.published_at, { day: 'numeric', month: 'short' }) : ''}
              </span>)}
            </div>
          </div>
          <div style={{ ...CAPTION, marginTop: 6 }}>Readers of each of the last 12 stories, oldest left.</div>
        </div>
      </section>

      <section style={LIST3} data-newsroom-next="">
        <div style={LIST_HEAD}>
          <span style={PANEL_TITLE}>Up next</span>
          <span style={{ display: 'flex', gap: 6 }}>
            {(['tour', 'amateur'] as Beat[]).map((b) => (
              <button key={b} type="button" data-create={b} onClick={() => onCreate(b)} style={{ ...btnOutline(), textTransform: 'uppercase' }}>
                + {b === 'tour' ? 'Tour' : 'Amateur'}
              </button>
            ))}
          </span>
        </div>
        {(d.queue ?? []).length === 0
          ? <div style={EMPTY}>Nothing drafted or scheduled</div>
          : (d.queue ?? []).map((item) => <QueueRow key={`${item.kind}:${item.id}`} item={item} onOpen={() => onOpen(item.kind, item.id)} />)}
      </section>

      <div style={CHIP_ROW} data-beat-chips="">
        {(['all', 'tour', 'amateur'] as const).map((b) => {
          const on = beat === b;
          return (
            <button key={b} type="button" aria-pressed={on} onClick={() => { setBeat(b); setShown(6); }} style={chipStyle(on)}>
              {b === 'all' ? 'All' : b === 'tour' ? 'Tour' : 'Amateur'} <span style={chipCount(on)}>{counts[b]}</span>
            </button>
          );
        })}
      </div>

      <section style={LIST3} data-newsroom-published="">
        <div style={LIST_HEAD}>
          <span style={PANEL_TITLE}>Published</span>
          <span style={SORT_WRAP}>
            {(['newest', 'read'] as const).map((s) => (
              <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)} style={sortBtn(sort === s)}>{s === 'newest' ? 'Newest' : 'Most read'}</button>
            ))}
          </span>
        </div>
        {list.slice(0, shown).map((s) => <PublishedRow key={`${s.kind}:${s.id}`} s={s} onOpen={() => onOpen(s.kind, s.id)} />)}
        {list.length > shown && (
          <button type="button" style={MORE3} onClick={() => setShown((n) => n + 20)}>{list.length - shown} more</button>
        )}
      </section>
    </>
  );
}

function categoriesText(c: string[] | null | undefined) {
  return (c ?? []).map((v) => categoryLabel(v)).join(', ');
}

function QueueRow({ item, onOpen }: { item: NewsroomQueueItem; onOpen: () => void }) {
  const failing = (item.checks ?? []).filter((c) => !c.ok);
  const total = (item.checks ?? []).length;
  const scheduled = item.state === 'scheduled' && item.publish_at;
  const meta = item.kind === 'tour'
    ? `${BEAT_NAME.tour}${DOT}edited ${formatAgo(item.updated_at, { suffix: true, empty: '' })}`
    : `${BEAT_NAME.amateur}${categoriesText(item.categories) ? DOT + categoriesText(item.categories) : ''}`;
  return (
    <button type="button" onClick={onOpen} style={{ ...ROW, gridTemplateColumns: 'minmax(0, 1fr)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
        <span data-state={scheduled ? 'scheduled' : 'draft'} style={{
          ...NUM, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 999,
          border: `1px solid ${scheduled ? CC3.ink : CC3.line}`, color: scheduled ? CC3.ink : CC3.mute,
        }}>
          {scheduled ? `${weekday(item.publish_at!)} ${londonTime(item.publish_at!)}` : 'Draft'}
        </span>
        <span style={SQ(item.kind)} />
        <span style={{ fontSize: 11, color: CC3.faint, overflowWrap: 'anywhere' }}>{meta}</span>
      </span>
      <span style={{ display: 'block', marginTop: 6, fontSize: 14, fontWeight: 700, lineHeight: 1.3, overflowWrap: 'anywhere' }}>{item.headline}</span>
      {failing.length > 0 ? (
        <span style={{ ...CHIP_ROW, marginTop: 7 }}>
          {failing.map((c) => { const f = faultChip(c); return <span key={c.key} style={ochip(f.tone === 'danger' ? 'bad' : 'neutral')}>{f.text}</span>; })}
        </span>
      ) : (
        <span style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: CC3.good, ...NUM }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>
          All {total} checks pass
        </span>
      )}
    </button>
  );
}

function PublishedRow({ s, onOpen }: { s: NewsroomStory; onOpen: () => void }) {
  const cat = s.kind === 'amateur' ? categoriesText(s.categories) : '';
  const noImage = (s.faults ?? []).includes('image');
  const meta = [BEAT_NAME[s.kind], cat, formatAgo(s.published_at, { empty: '' }), s.blocks != null ? `${s.blocks} blocks` : '']
    .filter(Boolean).join(DOT) + (noImage ? `${DOT}no lead image` : '');
  const through = s.through;
  const readers = s.readers ?? 0;
  const known = through != null && s.avg_read_secs != null;
  return (
    <button type="button" onClick={onOpen} data-published-row="" style={{ ...ROW, gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12 }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: CC3.faint, overflowWrap: 'anywhere' }}>
          <span style={SQ(s.kind)} />
          <span style={{ minWidth: 0 }}>{s.kicker}</span>
        </span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 700, lineHeight: 1.3, overflowWrap: 'anywhere' }}>{s.headline}</span>
        <span style={SUB}>{meta}</span>
      </span>
      <span style={{ textAlign: 'right' }}>
        <span style={RAIL_FIG}>{readers}</span>
        <span style={RAIL_LABEL}>{readers === 1 ? 'reader' : 'readers'}</span>
        <span style={{ display: 'block', width: 56, height: 4, borderRadius: 2, background: CC3.track, marginTop: 5, marginLeft: 'auto', overflow: 'hidden' }}>
          {through != null && <span data-through-fill="" style={{ display: 'block', height: '100%', width: `${Math.max(0, Math.min(100, through))}%`, borderRadius: 2, background: through >= 60 ? CC3.ink : INK_55 }} />}
        </span>
        <span data-through-line="" style={{ ...NUM, display: 'block', marginTop: 3, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', color: known ? CC3.mute : CC3.faint }}>
          {known ? `${Math.round(through!)}%${DOT}${radarDuration(s.avg_read_secs)}` : DASH}
        </span>
      </span>
    </button>
  );
}
