/**
 * BusinessEmptyState — CB102 welcome for every golf business (biz-welcome.html).
 * Supersedes V3. Renders inside MyBusinessesPage → ManagePageShell only when the
 * member has no businesses.
 *
 * - The "Your insights" card is a FIXED SAMPLE (SAMPLE_INSIGHTS), labelled
 *   Sample. It fetches nothing and must never show real data.
 * - "On clbhouz today" reads get_platform_reach_v2 (rounds, reviews only; no
 *   golfers row). A failed read hides the card and its footnote.
 * - Amber appears only inside the real VerifiedBadge. Green only for deltas.
 * - Nothing implies verified businesses rank higher in discovery.
 */
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Search, MessageSquare, MessageCircle, BarChart3 } from 'lucide-react';
import { usePlatformReachV2 } from '@/hooks/usePlatformReachV2';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Skeleton } from '@/components/ui/skeleton';

const CANVAS = '#0B0B0D';
const CARD = '#17171B';
const INSET = '#1E1E23';
const HAIR = 'rgba(255,255,255,0.08)';
const INK = '#F8FAFC';
const MUTE = 'rgba(248,250,252,0.62)';
const DIM = 'rgba(248,250,252,0.42)';
const GREEN = '#34D399';

export const SAMPLE_INSIGHTS = {
  funnel: [
    { value: 46, label: 'golfers saw your posts' },
    { value: 12, label: 'opened your profile' },
    { value: 5, label: 'new followers' },
  ],
  bands: [
    { label: 'Plus–5', pct: 50, count: 3 },
    { label: '6–12', pct: 100, count: 6 },
    { label: '13–20', pct: 67, count: 4 },
    { label: '21+', pct: 17, count: 1 },
  ],
} as const;

const GETS = [
  { Icon: Search, title: 'A profile golfers can find', line: 'In search and the directory, next to the courses golfers already browse.' },
  { Icon: MessageSquare, title: 'Posts in the Clubhouse feed', line: 'News, offers and events go straight to the golfers who follow you.' },
  { Icon: MessageCircle, title: 'Golfers can message you', line: 'One tap from your profile to a conversation.' },
  { Icon: BarChart3, title: 'Insights from real golfers', line: 'Who saw you, who followed, and how they play.' },
];

const TYPES = [
  ['Golf clubs', 'Also get every round on your courses read hole by hole, and reply to your course reviews.'],
  ['Ranges, academies, coaches and colleges', 'Show golfers your sessions and teams, and see the handicaps of who follows you.'],
  ['Shops and club fitters', 'Put new stock and fitting days in front of golfers who follow you.'],
  ['Resorts and hotels', 'Show your courses and stays to golfers who follow you.'],
  ['Restaurants, cafes and bars', 'Be found by golfers on their way to or from a round.'],
  ['Brands and creators', 'Post to golfers and see who engages, band by band.'],
];

/** Grouped figures, tolerant of a malformed language tag. */
function fmt(n: number, locale: string): string {
  try {
    return n.toLocaleString(locale);
  } catch {
    return n.toLocaleString('en');
  }
}

const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTE };
const rightLabel: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM, whiteSpace: 'nowrap' };
const cardStyle: React.CSSProperties = { background: CARD, border: `1px solid ${HAIR}`, borderRadius: 18, padding: 16, marginBottom: 14 };
const titleStyle: React.CSSProperties = { fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3, color: INK, margin: 0 };
const rowTitle: React.CSSProperties = { display: 'block', fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: INK };
const rowLine: React.CSSProperties = { display: 'block', fontSize: 13, lineHeight: 1.4, color: MUTE, marginTop: 3 };

function CreatePill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-create-pill=""
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', height: 42, padding: '0 18px 0 20px',
        borderRadius: 999, background: INK, color: CANVAS, fontSize: 15, fontWeight: 600,
        letterSpacing: '-0.005em', border: 'none', cursor: 'pointer',
      }}
    >
      Create a business profile
      <ArrowRight size={16} style={{ marginLeft: 8 }} aria-hidden />
    </button>
  );
}

function Card({ id, children, style }: { id: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return <section data-card={id} style={{ ...cardStyle, ...style }}>{children}</section>;
}

function Figures({ locale }: { locale: string }) {
  const { data, isLoading, isError } = usePlatformReachV2();
  if (isError) return null;
  const rows = data
    ? [
        { label: 'Rounds read hole by hole', total: data.rounds, delta: data.roundsDelta },
        { label: 'Course reviews', total: data.reviews, delta: data.reviewsDelta },
      ]
    : null;
  return (
    <>
      <Card id="figures" style={{ marginBottom: 8 }}>
        <div style={{ ...kicker, marginBottom: 10 }}>On clbhouz today</div>
        {isLoading || !rows ? (
          <div data-figures-loading="" style={{ display: 'grid', gap: 12, padding: '11px 0' }}>
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        ) : (
          rows.map((r, i) => (
            <div
              key={r.label}
              data-figure-row=""
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '11px 0',
                fontSize: 15, color: INK, borderTop: i === 1 ? `1px solid ${HAIR}` : undefined,
              }}
            >
              <span>{r.label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {fmt(r.total, locale)}
                {r.delta > 0 && (
                  <span data-delta="" style={{ color: GREEN, fontSize: 13.5, marginLeft: 8 }}>+{fmt(r.delta, locale)}</span>
                )}
              </span>
            </div>
          ))
        )}
      </Card>
      <p data-figures-footnote="" style={{ fontSize: 12.5, lineHeight: 1.45, color: DIM, margin: '2px 4px 14px' }}>
        Green figures are the last 30 days.
      </p>
    </>
  );
}

export function BusinessEmptyState({ onCreate }: { onCreate: () => void }) {
  const { i18n } = useTranslation();
  const locale = i18n?.language || 'en';

  return (
    <div style={{ padding: '4px 0 0', background: CANVAS, color: INK }}>
      {/* 1. Opening */}
      <div data-card="opening" style={{ padding: '6px 2px 22px' }}>
        <div style={kicker}>Golf businesses on clbhouz</div>
        <h2 style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.16, marginTop: 10, color: INK }}>
          Reach golfers who track every round.<span style={{ color: MUTE }}> And know exactly who they are.</span>
        </h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.45, color: MUTE, marginTop: 10 }}>
          For every golf business: clubs, ranges, academies, coaches, shops, fitters, resorts, hotels, restaurants and brands. Free, and it takes about a minute.
        </p>
        <div style={{ marginTop: 18 }}><CreatePill onClick={onCreate} /></div>
      </div>

      {/* 2. What every business gets */}
      <Card id="gets">
        <div style={{ ...kicker, marginBottom: 10 }}>What every business gets</div>
        {GETS.map(({ Icon, title, line }) => (
          <div key={title} data-row="" style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr)', gap: 12, padding: '12px 0', borderTop: `1px solid ${HAIR}`, alignItems: 'start' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: INSET, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={17} strokeWidth={1.9} color="rgba(248,250,252,0.85)" aria-hidden />
            </span>
            <div><b style={rowTitle}>{title}</b><span style={rowLine}>{line}</span></div>
          </div>
        ))}
      </Card>

      {/* 3. Your insights — fixed sample, fetches nothing */}
      <Card id="sample">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
          <div style={kicker}>Your insights</div>
          <div style={rightLabel}>Sample</div>
        </div>
        <p style={titleStyle}>Know who follows you, by handicap.<span style={{ color: MUTE }}> No other platform can tell you.</span></p>
        <p style={{ fontSize: 13.5, lineHeight: 1.45, color: MUTE, marginTop: 6 }}>
          Handicaps come from each golfer's own WHS record, so the bands are real, not guessed.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {SAMPLE_INSIGHTS.funnel.map((f) => (
            <div key={f.label} data-funnel="" style={{ flex: 1, background: INSET, borderRadius: 13, padding: '11px 10px' }}>
              <b data-value="" style={{ display: 'block', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: INK }}>{f.value}</b>
              <span style={{ display: 'block', fontSize: 11.5, lineHeight: 1.3, color: MUTE, marginTop: 3 }}>{f.label}</span>
            </div>
          ))}
        </div>
        <div style={{ ...rightLabel, margin: '16px 0 4px' }}>Your golfers</div>
        {SAMPLE_INSIGHTS.bands.map((b) => (
          <div key={b.label} data-band="" style={{ display: 'grid', gridTemplateColumns: '62px minmax(0,1fr) 26px', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: MUTE }}>{b.label}</span>
            <span style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${b.pct}%`, background: 'rgba(248,250,252,0.78)', borderRadius: 4 }} />
            </span>
            <span data-count="" style={{ textAlign: 'right', fontWeight: 600, color: INK }}>{b.count}</span>
          </div>
        ))}
      </Card>

      {/* 4. Built for your kind of business */}
      <Card id="types">
        <div style={{ ...kicker, marginBottom: 10 }}>Built for your kind of business</div>
        {TYPES.map(([title, line]) => (
          <div key={title} data-row="" style={{ padding: '12px 0', borderTop: `1px solid ${HAIR}` }}>
            <b style={rowTitle}>{title}</b><span style={rowLine}>{line}</span>
          </div>
        ))}
      </Card>

      {/* 5. How it works */}
      <Card id="steps">
        <div style={{ ...kicker, marginBottom: 10 }}>How it works</div>
        {[
          { n: 1, title: <>Create a profile</>, line: 'Free, about a minute. A name and a category.' },
          { n: 2, title: <>Post and grow</>, line: 'Golfers find you, follow you and message you. Your insights fill in as they do.' },
          {
            n: 3,
            title: <>Get verified<span style={{ marginLeft: 4, display: 'inline-flex', verticalAlign: 'middle' }}><VerifiedBadge size="sm" /></span></>,
            line: 'Free, checked by a person. Golf clubs also claim their courses here.',
          },
        ].map((s) => (
          <div key={s.n} data-step="" style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', gap: 12, padding: '12px 0', borderTop: `1px solid ${HAIR}`, alignItems: 'start' }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: INK }}>{s.n}</span>
            <div><b style={rowTitle}>{s.title}</b><span style={rowLine}>{s.line}</span></div>
          </div>
        ))}
      </Card>

      {/* 6. On clbhouz today */}
      <Figures locale={locale} />

      {/* 7. Foot */}
      <div data-card="foot" style={{ textAlign: 'center', paddingTop: 6 }}>
        <CreatePill onClick={onCreate} />
        <p style={{ fontSize: 12.5, color: DIM, marginTop: 10 }}>Free. About a minute.</p>
      </div>
    </div>
  );
}

export default BusinessEmptyState;
