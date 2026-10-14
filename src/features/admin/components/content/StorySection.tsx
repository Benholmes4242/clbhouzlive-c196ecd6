/**
 * BRIEF_CONTENT_DESK Stage 2 — Story screen (Story.html). Figures are
 * get_admin_story_insight as returned; the hero (image, kicker, standfirst)
 * comes from the existing admin story list. Publish/unpublish reuse the
 * existing setPublishedAt mutation; Schedule and Edit open the existing editor.
 */
import React, { useState } from 'react';
import { toast } from '@/lib/toast';
import { adminTheme as t } from '../../theme';
import { radarDuration, londonTime } from '../../lib/memberRadarDisplay';
import ConfirmDialog from '../ConfirmDialog';
import { useStoryInsight, isPermissionError, type Beat } from '../../hooks/useContentDesk';
import { useTourStoriesAdmin } from '../../hooks/useTourStoriesAdmin';
import { useAmateurStoriesAdmin } from '../../hooks/useAmateurStoriesAdmin';
import { BEAT_NAME } from './NewsroomSection';
import { desk, SECTION, LIST_SECTION, H, H_RIGHT, FIG_LABEL, FIG, FIG_SUB } from './deskTokens';

const BLOCK_WORDS: Record<string, [string, string]> = {
  paragraph: ['paragraph', 'paragraphs'], subhead: ['subhead', 'subheads'], image: ['image', 'images'],
  player: ['player card', 'player cards'], player_card: ['player card', 'player cards'],
  leaderboard: ['leaderboard', 'leaderboards'], stat: ['stat block', 'stat blocks'], stats: ['stat block', 'stat blocks'],
  round: ['round block', 'round blocks'], quote: ['quote', 'quotes'],
};
const sinceText = (iso: string) => {
  const d = new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London' }).replace(',', '');
  return `since ${d}, ${londonTime(iso)}`;
};
const weekday = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/London' });

export default function StorySection({ beat, id, onBack, onEdit }: { beat: Beat; id: string; onBack: () => void; onEdit: () => void }) {
  const tour = useTourStoriesAdmin();
  const am = useAmateurStoriesAdmin();
  const src = beat === 'tour' ? tour : am;
  const story = (src.stories as any[]).find((s) => s.id === id) ?? null;
  const q = useStoryInsight(beat, id);
  const ins = q.data;
  const [confirm, setConfirm] = useState<'publish' | 'unpublish' | null>(null);

  const state = ins?.state ?? (story ? (!story.published_at ? 'draft' : new Date(story.published_at) > new Date() ? 'scheduled' : 'published') : 'draft');
  const live = state === 'published' || state === 'live';
  const sinceIso = ins?.published_at ?? story?.published_at ?? story?.updated_at ?? null;
  const href = story ? (beat === 'tour' ? `/tour/news/${story.slug}` : `/discover/news/${story.slug}`) : null;

  const act = async (publishedAt: string | null) => {
    try {
      await src.setPublishedAt.mutateAsync({ id, publishedAt });
      toast.success(publishedAt ? 'Published' : 'Back to draft');
    } catch (e: any) { toast.error(e?.message ?? 'Could not update'); }
    setConfirm(null);
  };

  const btn = (primary: boolean): React.CSSProperties => ({
    height: 40, borderRadius: 999, border: primary ? 0 : `1px solid ${t.line}`, background: primary ? t.brand : 'transparent',
    color: primary ? t.canvas : t.ink, fontSize: 12.5, fontWeight: primary ? 800 : 700, cursor: 'pointer',
  });

  const daily = (ins?.daily_new_readers ?? []).slice(-14);
  const maxDaily = Math.max(0, ...daily.map((d) => d.readers));
  const sources = ins?.sources ?? [];
  const maxSrc = Math.max(0, ...sources.map((s) => s.opens));
  const checks = ins?.checks ?? [];
  const passed = checks.filter((c) => c.ok).length;
  const blocks = Object.entries(ins?.blocks ?? {}).filter(([, n]) => n > 0);
  const blockTotal = blocks.reduce((a, [, n]) => a + n, 0);
  const pctMembers = ins?.readers != null && ins?.members ? Math.round((ins.readers / ins.members) * 100) : null;
  const throughOk = ins?.through != null && ins?.news_avg_through != null && ins.through >= ins.news_avg_through;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px 4px' }}>
        <button type="button" onClick={onBack} aria-label="Back to newsroom" style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.line}`, background: 'transparent', display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={t.ink} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M9 3L5 7l4 4" /></svg>
        </button>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.inkFaint }}>Newsroom</span>
          <span style={{ display: 'block', fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: t.ink }}>{BEAT_NAME[beat]} story</span>
        </span>
      </div>

      <section style={{ background: t.surface, borderRadius: 16, overflow: 'hidden' }}>
        {story?.image_url ? (
          <img src={story.image_url} alt="" style={{ display: 'block', width: '100%', height: 168, objectFit: 'cover' }} />
        ) : (
          <div style={{ height: 168, background: t.neutralSoft, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.inkFaint }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="17" height="14" rx="2.5" /><circle cx="8" cy="9" r="1.8" /><path d="M19.5 15l-5-5-8 8" /></svg>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Lead image</span>
          </div>
        )}
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 999,
              background: live ? t.okSoft : state === 'scheduled' ? t.brandSoft : desk.pillNeutral,
              color: live ? t.okText : state === 'scheduled' ? t.brandText : t.inkMuted,
            }}>{live ? 'Live' : state === 'scheduled' ? 'Scheduled' : 'Draft'}</span>
            {sinceIso && <span style={{ fontSize: 11, color: t.inkFaint }}>{sinceText(sinceIso)}</span>}
          </div>
          {story?.kicker && <div style={{ marginTop: 10, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkFaint }}>{story.kicker}</div>}
          <h1 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.25, color: t.ink }}>{story?.headline ?? ''}</h1>
          {story?.standfirst && <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.45, color: t.inkMuted }}>{story.standfirst}</p>}
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
            <button type="button" style={btn(true)} onClick={onEdit}>Edit</button>
            {state === 'draft' ? (
              <>
                <button type="button" style={btn(false)} onClick={() => setConfirm('publish')}>Publish</button>
                <button type="button" style={btn(false)} onClick={onEdit}>Schedule</button>
              </>
            ) : (
              <>
                <button type="button" style={btn(false)} disabled={!live || !href} onClick={() => href && window.open(href, '_blank', 'noopener')}>View live</button>
                <button type="button" style={btn(false)} onClick={() => setConfirm('unpublish')}>Unpublish</button>
              </>
            )}
          </div>
        </div>
      </section>

      {q.error ? (
        <section style={SECTION}><span style={{ fontSize: 13, color: t.inkFaint }}>{isPermissionError(q.error) ? 'Full admins only' : 'Could not load this story'}</span></section>
      ) : ins ? (
        <>
          <section style={SECTION}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={H}>How it read</span><span style={H_RIGHT}>since publish</span></div>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              <div><div style={FIG_LABEL}>Readers</div><div style={FIG}>{ins.readers ?? 0}</div><div style={FIG_SUB}>{pctMembers != null ? `${pctMembers}% of members` : '—'}</div></div>
              <div><div style={FIG_LABEL}>Avg read</div><div style={FIG}>{radarDuration(ins.avg_read_secs)}</div><div style={FIG_SUB}>of {radarDuration(ins.est_read_secs)} to read</div></div>
              <div><div style={FIG_LABEL}>Read through</div><div style={{ ...FIG, color: throughOk ? t.okText : t.ink }}>{ins.through != null ? `${ins.through}%` : '—'}</div><div style={FIG_SUB}>news avg {ins.news_avg_through != null ? `${ins.news_avg_through}%` : '—'}</div></div>
            </div>
            {daily.length > 0 && (
              <>
                <div style={{ marginTop: 14, height: 56, display: 'grid', gridTemplateColumns: `repeat(${daily.length}, minmax(0, 1fr))`, gap: 4, alignItems: 'end' }}>
                  {daily.map((d) => {
                    const r = maxDaily ? d.readers / maxDaily : 0;
                    return <div key={d.date} style={{ height: `${Math.round(r * 100)}%`, background: r >= 0.5 ? t.ink : r >= 0.15 ? desk.ink55 : desk.ink30, borderRadius: '3px 3px 1px 1px' }} />;
                  })}
                </div>
                <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 9.5, fontWeight: 700, color: t.inkFaint }}>
                  <span>{weekday(daily[0].date)}</span><span>new readers by day</span><span>{weekday(daily[daily.length - 1].date)}</span>
                </div>
              </>
            )}
          </section>

          <section style={SECTION}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={H}>Where readers came from</span><span style={H_RIGHT}>opens</span></div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {sources.map((s) => (
                <div key={s.label} style={{ display: 'grid', gridTemplateColumns: '112px minmax(0, 1fr) 36px', columnGap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{s.label}</span>
                  <span style={{ height: 10, borderRadius: 3, background: desk.trackBg }}>
                    <span style={{ display: 'block', height: '100%', width: `${maxSrc ? (s.opens / maxSrc) * 100 : 0}%`, borderRadius: 3, background: s.label === 'Shared link' ? t.brand : t.ink }} />
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, textAlign: 'right', color: t.ink }}>{s.opens}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: t.inkFaint }}>Shared link: the session started on this story, so someone outside the app sent it.</div>
          </section>

          <section style={LIST_SECTION}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 10px' }}>
              <span style={H}>Pre-flight</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: passed === checks.length ? t.okText : t.warnText }}>{passed} of {checks.length} pass</span>
            </div>
            {checks.map((c) => (
              <div key={c.key} style={{ display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '9px 16px', borderTop: `1px solid ${t.hairline}` }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: c.ok ? t.ok : t.warnText }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{c.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.ok ? t.inkMuted : t.warnText }}>{c.value ?? ''}</span>
              </div>
            ))}
          </section>

          <section style={SECTION}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={H}>Blocks</span><span style={H_RIGHT}>{blockTotal}</span></div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {blocks.map(([k, n]) => {
                const w = BLOCK_WORDS[k] ?? [k, k];
                return <span key={k} style={{ fontSize: 11.5, fontWeight: 600, padding: '5px 9px', borderRadius: 999, background: t.neutralSoft, color: t.inkMuted }}>{n} {n === 1 ? w[0] : w[1]}</span>;
              })}
            </div>
          </section>
        </>
      ) : (
        <section style={{ ...SECTION, height: 140 }} aria-busy="true" />
      )}

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => act(confirm === 'publish' ? new Date().toISOString() : null)}
        title={confirm === 'publish' ? `Publish to ${BEAT_NAME[beat]}?` : 'Unpublish this story?'}
        description={confirm === 'unpublish' ? `The story disappears from ${BEAT_NAME[beat]} and its link stops resolving. Nothing is deleted.` : undefined}
        confirmLabel={confirm === 'publish' ? 'Publish' : 'Unpublish'}
        tone={confirm === 'unpublish' ? 'danger' : 'default'}
        busy={src.setPublishedAt.isPending}
      />
    </>
  );
}
