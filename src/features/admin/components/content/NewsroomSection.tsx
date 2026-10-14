/**
 * BRIEF_CONTENT_DESK Stage 2 — Newsroom (Main.html). Every figure is
 * get_admin_newsroom as returned. Editors are the existing hosts.
 */
import React, { useMemo, useState } from 'react';
import { adminTheme as t } from '../../theme';
import { formatAgo } from '../../lib/formatAgo';
import { radarDuration, londonDate, londonTime } from '../../lib/memberRadarDisplay';
import { categoryLabel } from '@/features/amateur/news/categories';
import { useNewsroom, isPermissionError, type Beat, type NewsroomQueueItem, type NewsroomStory } from '../../hooks/useContentDesk';
import { TourStoryEditorHost } from '../wire/TheWireTab';
import { AmateurStoryEditorHost } from '../amateur/AmateurNewsTab';
import StorySection from './StorySection';
import { desk, SECTION, LIST_SECTION, H, H_RIGHT, FIG_LABEL, FIG, FIG_SUB, MORE, ROW_BTN, DOT, chip, beatColour } from './deskTokens';

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
    case 'players': return { text: `${plural(Number.isFinite(n) ? n : 0, 'player', 'players')} not matched`, tone: 'danger' };
    case 'category': return { text: 'No category', tone: 'danger' };
    case 'headline': return { text: `Headline ${v ?? ''}`.trim(), tone: 'danger' };
    case 'standfirst': return { text: v == null || v === '' ? 'No standfirst' : `Standfirst ${v}`, tone: 'warn' };
    case 'credit': return { text: 'No lead credit', tone: 'warn' };
    case 'b2b': return { text: 'Images back to back', tone: 'warn' };
    case 'emdash': return { text: plural(Number.isFinite(n) ? n : 0, 'em dash', 'em dashes'), tone: 'warn' };
    case 'images': return { text: `${v ?? ''} images`.trim(), tone: 'warn' };
    default: return { text: c.label ?? c.key, tone: 'warn' };
  }
}

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
    return <section style={SECTION}><span style={{ fontSize: 13, color: t.inkFaint }}>{isPermissionError(q.error) ? 'Full admins only' : 'Could not load the newsroom'}</span></section>;
  }
  if (!d) return <section style={{ ...SECTION, height: 160 }} aria-busy="true" />;

  const today = londonYmd(new Date());
  const week = d.week ?? [];
  const sum = (k: keyof (typeof week)[number]) => week.reduce((a, w) => a + (Number(w[k]) || 0), 0);
  const first = week[0]?.date, last = week[week.length - 1]?.date;
  const range = first && last
    ? `${londonDate(dayDate(first).toISOString(), { day: 'numeric' })} to ${londonDate(dayDate(last).toISOString(), { day: 'numeric', month: 'short' })}`
    : '';

  return (
    <>
      <section style={SECTION}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={H}>This week</span><span style={H_RIGHT}>{range}</span>
        </div>
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
              <div key={w.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  height: 40, width: '100%', borderRadius: 8, background: desk.cellBg, boxSizing: 'border-box',
                  boxShadow: isToday ? desk.todayRing : undefined,
                  display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 3, paddingBottom: marks.length ? 6 : 0,
                }}>
                  {marks.map((m, i) => (
                    <span key={i} style={{
                      width: 18, height: 6, borderRadius: 2,
                      background: m.scheduled ? undefined : beatColour(m.beat),
                      boxShadow: m.scheduled ? `inset 0 0 0 1.5px ${beatColour(m.beat)}` : undefined,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 9, fontWeight: isToday ? 800 : 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isToday ? t.ink : t.inkFaint }}>
                  {isToday ? 'Today' : weekday(dayDate(w.date).toISOString())}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.hairline}`, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          {(['tour', 'amateur'] as Beat[]).map((b) => {
            const pub = sum(b); const sch = sum(`${b}_scheduled` as any);
            return (
              <div key={b}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: beatColour(b) }} />
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint }}>{BEAT_NAME[b]}</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: t.ink }}>
                  {pub} <span style={{ fontSize: 11, fontWeight: 700, color: t.inkMuted }}>of 3 to 4{sch > 0 ? `${DOT}${sch} queued` : ''}</span>
                </div>
                <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 3 }}>
                  {[0, 1, 2, 3].map((i) => {
                    const filled = i < Math.min(pub, 4);
                    const outlined = !filled && i < Math.min(pub + sch, 4);
                    return <span key={i} style={{
                      height: 4, borderRadius: 2,
                      background: filled ? beatColour(b) : outlined ? undefined : i === 3 ? desk.trackFaint : desk.trackBg,
                      boxShadow: outlined ? `inset 0 0 0 1.5px ${beatColour(b)}` : undefined,
                    }} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ ...SECTION, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <div><div style={FIG_LABEL}>Readers 7d</div><div style={FIG}>{d.readers_7d ?? '—'} <span style={{ fontSize: 11, fontWeight: 700, color: t.inkMuted }}>of {d.active_7d ?? '—'}</span></div><div style={FIG_SUB}>active members</div></div>
        <div><div style={FIG_LABEL}>Avg read</div><div style={FIG}>{radarDuration(d.avg_read_secs_30d)}</div><div style={FIG_SUB}>per story opened</div></div>
        <div><div style={FIG_LABEL}>Live</div><div style={FIG}>{(d.live?.tour ?? 0) + (d.live?.amateur ?? 0)}</div><div style={FIG_SUB}>{d.live?.tour ?? 0} tour{DOT}{d.live?.amateur ?? 0} am</div></div>
      </section>

      <section style={LIST_SECTION}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 10px' }}>
          <span style={H}>Up next</span>
          <span style={{ display: 'flex', gap: 6 }}>
            {(['tour', 'amateur'] as Beat[]).map((b) => (
              <button key={b} type="button" onClick={() => onCreate(b)} style={{ height: 30, padding: '0 12px', borderRadius: 999, border: 0, background: t.brand, color: t.canvas, fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
                + {b === 'tour' ? 'Tour' : 'Amateur'}
              </button>
            ))}
          </span>
        </div>
        {(d.queue ?? []).map((item) => <QueueRow key={`${item.kind}:${item.id}`} item={item} onOpen={() => onOpen(item.kind, item.id)} />)}
      </section>

      <div style={{ display: 'flex', gap: 6, overflow: 'hidden' }}>
        {(['all', 'tour', 'amateur'] as const).map((b) => {
          const on = beat === b;
          return (
            <button key={b} type="button" onClick={() => { setBeat(b); setShown(6); }} style={{
              flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 999, border: 0,
              fontSize: 12, fontWeight: 700, background: on ? t.ink : t.surface, color: on ? t.canvas : t.ink, cursor: 'pointer',
            }}>
              {b === 'all' ? 'All' : b === 'tour' ? 'Tour' : 'Amateur'} <span style={{ fontWeight: 800 }}>{counts[b]}</span>
            </button>
          );
        })}
      </div>

      <section style={LIST_SECTION}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 10px' }}>
          <span style={H}>Published</span>
          <span style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 999, background: t.neutralSoft }}>
            {(['newest', 'read'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSort(s)} style={{
                height: 26, padding: '0 10px', borderRadius: 999, border: 0, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: sort === s ? t.ink : 'transparent', color: sort === s ? t.canvas : t.inkMuted,
              }}>{s === 'newest' ? 'Newest' : 'Most read'}</button>
            ))}
          </span>
        </div>
        {list.slice(0, shown).map((s) => <PublishedRow key={`${s.kind}:${s.id}`} s={s} onOpen={() => onOpen(s.kind, s.id)} />)}
        {list.length > shown && (
          <button type="button" style={MORE} onClick={() => setShown((n) => n + 20)}>{list.length - shown} more</button>
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
    <button type="button" onClick={onOpen} style={ROW_BTN}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 999,
          background: scheduled ? t.brandSoft : desk.pillNeutral, color: scheduled ? t.brandText : t.inkMuted,
        }}>
          {scheduled ? `${weekday(item.publish_at!)} ${londonTime(item.publish_at!)}` : 'Draft'}
        </span>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: beatColour(item.kind) }} />
        <span style={{ fontSize: 11, color: t.inkFaint }}>{meta}</span>
      </span>
      <span style={{ display: 'block', marginTop: 6, fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>{item.headline}</span>
      {failing.length > 0 ? (
        <span style={{ marginTop: 7, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {failing.map((c) => { const f = faultChip(c); return <span key={c.key} style={chip(f.tone)}>{f.text}</span>; })}
        </span>
      ) : (
        <span style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: t.okText }}>
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
  return (
    <button type="button" onClick={onOpen} style={{ ...ROW_BTN, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 64px', columnGap: 12, alignItems: 'center' }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ flex: 'none', width: 8, height: 8, borderRadius: 2, background: beatColour(s.kind) }} />
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.kicker}</span>
        </span>
        <span style={{ display: 'block', marginTop: 4, fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{s.headline}</span>
        <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: t.inkFaint }}>{meta}</span>
      </span>
      <span style={{ textAlign: 'right' }}>
        <span style={{ display: 'block', fontSize: 17, fontWeight: 800 }}>{s.readers ?? 0}</span>
        <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.inkFaint }}>readers</span>
        <span style={{ display: 'block', marginTop: 5, height: 4, borderRadius: 2, background: desk.trackBg, overflow: 'hidden' }}>
          {through != null && <span style={{ display: 'block', height: '100%', width: `${Math.max(0, Math.min(100, through))}%`, borderRadius: 2, background: through >= 60 ? t.ink : desk.ink45 }} />}
        </span>
        <span style={{ display: 'block', marginTop: 3, fontSize: 10, fontWeight: 700, color: t.inkMuted }}>{through == null || s.avg_read_secs == null ? '-' : radarDuration(s.avg_read_secs)}</span>
      </span>
    </button>
  );
}
