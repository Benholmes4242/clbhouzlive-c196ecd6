/**
 * CB82 — Insights section 1: the headline and "from seen to acted".
 *
 * Signed-off mock: insights-s1.html (the brief wins where they differ).
 * Rules this file owns:
 *   - Bars fill value ÷ saw, capped at 100%, all empty when saw is 0.
 *   - Changes: absolute below a previous base of 20, whole-number percent from
 *     20 up; green only when up, a fall reads "N fewer" in dim grey. NEVER red.
 *   - The line under the rows is the first applicable of: nobody saw you
 *     (composer pill for owner/admin/editor, nothing for analysts), most stop
 *     before the profile (< 20% opened), opened and left (no follows, no taps).
 *   - First load renders nothing until the read settles; a failed read renders
 *     nothing; period switches keep the previous figures (hook placeholder).
 *
 * Title tracking: the brief's -0.02em is held at 0 under the standing
 * "letter spacing must be 0, not negative" ruling (see report).
 */
import { useTranslation } from 'react-i18next';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { formatNumber } from '@/i18n/format';
import type { BusinessInsightsFunnel } from '@/hooks/useBusinessInsightsFunnel';

export const FUNNEL_INK = '#F8FAFC';
export const FUNNEL_MUTE = 'rgba(248,250,252,0.62)';
export const FUNNEL_DIM = 'rgba(248,250,252,0.42)';
export const FUNNEL_GREEN = '#34D399';
const CARD = '#17171B';
const INSET = '#1E1E23';
const LINE = 'rgba(255,255,255,0.08)';
const HAIR = 'rgba(255,255,255,0.06)';
const ON_INK = '#0B0B0D';

/** Below this previous-period base a change is absolute, not a percentage. */
export const CHANGE_PCT_MIN_BASE = 20;
/** Below this opened ÷ saw ratio the leak line says most golfers stop early. */
export const OPEN_LEAK_RATIO = 0.2;
export const PREVIEW_MAX = 40;

export type Change =
  | null
  | { dir: 'up' | 'down'; mode: 'abs' | 'pct'; n: number; color: string };

export function changeOf(value: number, prev: number): Change {
  if (value === prev) return null;
  const dir = value > prev ? 'up' : 'down';
  const color = dir === 'up' ? FUNNEL_GREEN : FUNNEL_DIM;
  if (prev < CHANGE_PCT_MIN_BASE) return { dir, mode: 'abs', n: Math.abs(value - prev), color };
  return { dir, mode: 'pct', n: Math.round((Math.abs(value - prev) / prev) * 100), color };
}

/** "+2" / "6 fewer" / "+25%" / "25% fewer" — the English shape; copy via i18n. */
export function changeText(c: NonNullable<Change>): string {
  const n = c.mode === 'pct' ? `${c.n}%` : `${c.n}`;
  return c.dir === 'up' ? `+${n}` : `${n} fewer`;
}

export function barPct(value: number, saw: number): number {
  if (saw <= 0) return 0;
  return Math.min(100, Math.max(0, (value / saw) * 100));
}

export function clipPreview(raw: string): string {
  const s = stripMentionMarkup(raw ?? '').trim();
  return s.length > PREVIEW_MAX ? `${s.slice(0, PREVIEW_MAX)}…` : s;
}

export type LeakLine = 'empty' | 'stop' | 'left' | null;
export function leakLineOf(f: BusinessInsightsFunnel): LeakLine {
  const saw = f.saw.value, opened = f.opened.value;
  if (saw === 0) return 'empty';
  if (opened < saw && opened / saw < OPEN_LEAK_RATIO) return 'stop';
  if (opened > 0 && f.followed.value === 0 && f.tapped.value === 0) return 'left';
  return null;
}

const ChangeMark = ({ value, prev }: { value: number; prev: number }) => {
  const { t } = useTranslation('common');
  const c = changeOf(value, prev);
  if (!c) return null;
  const n = c.mode === 'pct' ? `${c.n}%` : String(c.n);
  return (
    <b
      data-change={changeText(c)}
      data-dir={c.dir}
      style={{ display: 'inline', fontSize: 11.5, fontWeight: 700, marginLeft: 6, color: c.color }}
    >
      {c.dir === 'up'
        ? t('business.insights.funnel.changeUp', { n, defaultValue: '' })
        : t('business.insights.funnel.changeDown', { n, defaultValue: '' })}
    </b>
  );
};

const Row = ({ id, label, sub, value, prev, saw, first }: {
  id: string; label: string; sub: string | null; value: number; prev: number; saw: number; first: boolean;
}) => (
  <div
    data-row={id}
    style={{
      display: 'grid', gridTemplateColumns: '1fr 52px', alignItems: 'center', gap: 10,
      padding: first ? '2px 0 9px' : '9px 0', borderTop: first ? 0 : `1px solid ${HAIR}`,
    }}
  >
    <div style={{ fontSize: 13, fontWeight: 600, color: FUNNEL_INK }}>
      <span data-label>{label}</span>
      <ChangeMark value={value} prev={prev} />
      {sub !== null && (
        <span data-sub style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: FUNNEL_DIM, marginTop: 1 }}>{sub}</span>
      )}
    </div>
    <div data-figure style={{ textAlign: 'right', fontSize: 20, fontWeight: 700, color: FUNNEL_INK, fontVariantNumeric: 'tabular-nums' }}>
      {formatNumber(value)}
    </div>
    <div style={{ gridColumn: '1 / 3', height: 6, borderRadius: 3, background: HAIR, position: 'relative', marginTop: -2 }}>
      <i data-fill style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3, background: FUNNEL_INK, width: `${barPct(value, saw)}%` }} />
    </div>
  </div>
);

export function InsightsFunnel({ funnel, businessName, days, canPost, onPost }: {
  funnel: BusinessInsightsFunnel;
  businessName: string;
  days: number;
  canPost: boolean;
  onPost: () => void;
}) {
  const { t } = useTranslation('common');
  const k = (key: string, o: Record<string, unknown> = {}) =>
    t(`business.insights.funnel.${key}`, { ...o, defaultValue: '' });
  const f = funnel;
  const saw = f.saw.value;
  const leak = leakLineOf(f);
  const preview = f.top_post ? clipPreview(f.top_post.preview) : null;
  const bold = { color: FUNNEL_INK, fontWeight: 700 } as const;

  return (
    <div data-section="insights-funnel">
      <div data-headline style={{ padding: '16px 20px 2px' }}>
        <p style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: 0, lineHeight: 1.2, color: FUNNEL_INK }}>
          {saw === 0 ? (
            <span data-variant="none">{k('headNone', { business: businessName })}</span>
          ) : (
            <>
              <span data-variant="saw" data-count={saw}>{k('headSaw', { count: saw, n: formatNumber(saw), business: businessName })}</span>
              <span data-opened={f.opened.value} style={{ color: FUNNEL_MUTE }}>
                {' '}{k('headOpened', { count: f.opened.value, n: formatNumber(f.opened.value) })}
              </span>
            </>
          )}
        </p>
        <p data-subline style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.45, color: FUNNEL_MUTE }}>
          {saw === 0 ? (
            <span data-variant="none">{k('subNone')}</span>
          ) : (
            <>
              <span>{k('subPeriod', { days })}</span>
              {preview !== null && (
                <span data-top-post={preview}>{' '}{k('subTopPost', { preview })}</span>
              )}
            </>
          )}
        </p>
      </div>

      <section
        data-card="funnel"
        style={{ margin: '14px 16px 0', background: CARD, border: `1px solid ${LINE}`, borderRadius: 18, padding: 16 }}
      >
        <div style={{
          fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: FUNNEL_MUTE,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span>{k('kicker')}</span>
          <span data-days={days} style={{ color: FUNNEL_DIM, letterSpacing: '0.12em' }}>{k('kickerDays', { days })}</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <Row id="saw" first label={k('rowSaw')} sub={k('subSaw')} value={saw} prev={f.saw.prev} saw={saw} />
          <Row
            id="opened" first={false} label={k('rowOpened')}
            sub={f.opened.visits > 0 ? k('subVisits', { count: f.opened.visits, n: formatNumber(f.opened.visits) }) : null}
            value={f.opened.value} prev={f.opened.prev} saw={saw}
          />
          <Row
            id="followed" first={false} label={k('rowFollowed')}
            sub={k('subFollowed', { count: f.followed.total, n: formatNumber(f.followed.total) })}
            value={f.followed.value} prev={f.followed.prev} saw={saw}
          />
          <Row id="tapped" first={false} label={k('rowTapped')} sub={k('subTapped')} value={f.tapped.value} prev={f.tapped.prev} saw={saw} />
        </div>

        {leak === 'empty' && canPost && (
          <button
            type="button"
            data-cta="post-as-business"
            onClick={onPost}
            style={{
              marginTop: 12, width: '100%', height: 40, borderRadius: 20, border: 'none',
              background: FUNNEL_INK, color: ON_INK, fontSize: 13.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {k('postAs', { business: businessName })}
          </button>
        )}
        {(leak === 'stop' || leak === 'left') && (
          <p
            data-leak={leak}
            style={{ margin: '10px 0 0', padding: '10px 12px', borderRadius: 12, background: INSET, fontSize: 12.5, lineHeight: 1.45, color: FUNNEL_MUTE }}
          >
            {leak === 'stop' ? (
              <>
                <b style={bold}>{k('leakStopLead')}</b>{' '}
                {k('leakStopBody', { opened: formatNumber(f.opened.value), saw: formatNumber(saw), business: businessName })}
              </>
            ) : (
              <>
                <b style={bold}>{k('leakLeftLead', { count: f.opened.value, n: formatNumber(f.opened.value) })}</b>{' '}
                {k('leakLeftBody')}
              </>
            )}
          </p>
        )}
      </section>
    </div>
  );
}

export default InsightsFunnel;
