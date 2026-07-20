import React from 'react';
import { adminTheme as t } from '../theme';
import { useCourseInsight } from '../hooks/useCourseInsight';

interface Props {
  courseId: string | null;
  /** When true, hide the outer chrome (already inside a sheet header). */
  compact?: boolean;
}

/**
 * C4-2: Course Insight section.
 * Uses ONE parallel fetch on mount via useCourseInsight.
 * "No activity yet" when views + ratings are both zero.
 */
export default function CourseInsight({ courseId, compact }: Props) {
  const { data, isLoading, isError } = useCourseInsight(courseId);
  if (!courseId) return null;
  if (isError) {
    return (
      <div style={{ color: t.dangerText, fontSize: 12, padding: 8 }}>
        Could not load course insights.
      </div>
    );
  }
  if (isLoading || !data) {
    return (
      <div style={{
        background: t.canvas, border: `1px solid ${t.line}`, borderRadius: t.radius.md,
        height: 120, animation: 'admin-pulse 1.4s ease-in-out infinite',
      }} />
    );
  }

  const empty = data.views.total === 0 && data.rating.count === 0;
  if (empty) {
    return (
      <div style={{
        border: `1px dashed ${t.line}`, borderRadius: t.radius.md,
        padding: 16, textAlign: 'center', color: t.inkMuted, fontSize: 13,
      }}>
        No activity yet.
      </div>
    );
  }

  const maxView = Math.max(1, ...data.views.daily.map(d => d.count));
  const trendVals = data.trend12w.map(w => w.avg ?? 0);
  const maxTrend = Math.max(5, ...trendVals);
  const monthDelta = data.reviewsThisMonth - data.reviewsLastMonth;

  const wrap: React.CSSProperties = compact
    ? { display: 'flex', flexDirection: 'column', gap: 12 }
    : {
        display: 'flex', flexDirection: 'column', gap: 12,
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg, padding: 14,
      };

  const Section: React.FC<{ title: string; children: React.ReactNode; right?: React.ReactNode }> = ({ title, children, right }) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ color: t.inkMuted, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );

  const DimBar: React.FC<{ label: string; value: number | null }> = ({ label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 78, color: t.inkMuted, fontSize: 11 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: t.neutralSoft, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          width: `${((value ?? 0) / 5) * 100}%`,
          height: '100%', background: t.brand,
        }} />
      </div>
      <div style={{ width: 28, textAlign: 'right', color: t.ink, fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value == null ? '-' : value.toFixed(1)}
      </div>
    </div>
  );

  // 12-week average line: tiny SVG polyline
  const trendW = 240, trendH = 44;
  const step = trendVals.length > 1 ? trendW / (trendVals.length - 1) : 0;
  const pts = trendVals.map((v, i) => {
    const x = i * step;
    const y = trendH - Math.round((v / maxTrend) * (trendH - 4)) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={wrap}>
      <Section
        title="Views - last 30 days"
        right={<div style={{ color: t.ink, fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{data.views.total}</div>}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 }}>
          {data.views.daily.map((d, i) => {
            const h = Math.max(2, Math.round((d.count / maxView) * 38));
            return (
              <div key={i} title={`${d.date}: ${d.count}`}
                style={{ flex: 1, height: h, borderRadius: 2, background: d.count ? t.brand : t.line }} />
            );
          })}
        </div>
      </Section>

      <Section
        title="Rating"
        right={
          <div style={{ color: t.ink, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ fontWeight: 700 }}>{data.rating.average != null ? data.rating.average.toFixed(1) : '-'}</span>
            <span style={{ color: t.inkFaint, marginLeft: 6, fontSize: 11 }}>({data.rating.count})</span>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <DimBar label="Design" value={data.rating.design} />
          <DimBar label="Condition" value={data.rating.condition} />
          <DimBar label="Facilities" value={data.rating.facilities} />
          <DimBar label="Clubhouse" value={data.rating.clubhouse} />
        </div>
      </Section>

      <Section title="12-week average">
        <svg viewBox={`0 0 ${trendW} ${trendH}`} width="100%" height={trendH} preserveAspectRatio="none">
          <polyline points={pts} fill="none" stroke={t.brand} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </Section>

      <Section title="Reviews">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{data.reviewsThisMonth}</div>
            <div style={{ color: t.inkMuted, fontSize: 11 }}>this month</div>
          </div>
          <div>
            <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{data.reviewsLastMonth}</div>
            <div style={{ color: t.inkMuted, fontSize: 11 }}>previous</div>
          </div>
          {(monthDelta !== 0) && (
            <div style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              fontSize: 11, fontWeight: 700,
              borderRadius: 999,
              background: monthDelta > 0 ? t.okSoft : t.dangerSoft,
              color: monthDelta > 0 ? t.okText : t.dangerText,
            }}>
              {monthDelta > 0 ? '+' : ''}{monthDelta}
            </div>
          )}
        </div>
      </Section>

      <style>{`@keyframes admin-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  );
}
