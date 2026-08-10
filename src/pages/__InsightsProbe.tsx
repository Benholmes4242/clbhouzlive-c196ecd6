import { MetricCell, Delta } from './BusinessInsightsPageV2';
import { BusinessEmptyState } from '@/components/business/BusinessEmptyState';
import {
  A, BIZ_KICKER, BIZ_LABEL,
} from '@/features/courses/components/holes/analytical/tokens';

const V = [
  ['Profile views', 1240, 980],
  ['Unique visitors', 3, 1],
  ['Directory impressions', 0, 0],
  ['Click-outs', 13, 1],
  ['New followers', 0, 0],
  ['Message clicks', 0, 2],
] as const;

export default function InsightsProbe() {
  return (
    <div style={{ background: A.CANVAS, minHeight: '100vh', padding: 16 }}>
      <section style={{ background: '#fff', border: `1px solid ${A.BORDER}`, borderRadius: 18, padding: 16 }}>
        <p style={{ ...BIZ_KICKER, marginBottom: 18 }}>OVERVIEW</p>
        <div className="grid grid-cols-3" style={{ rowGap: 24, columnGap: 10 }}>
          {V.map(([l, v, p]) => (
            <MetricCell key={l} label={l as string} value={v as number} prev={p as number} loading={false} />
          ))}
        </div>
        <p style={{ ...BIZ_LABEL, marginTop: 18, textAlign: 'center' }}>Change vs the previous 30 days</p>
      </section>
      <div style={{ height: 16 }} />
      <div style={{ display: 'flex', gap: 8, padding: 8 }}>
        <Delta value={13} prev={1} />
        <Delta value={120} prev={80} />
        <Delta value={5} prev={5} />
        <Delta value={2} prev={9} />
      </div>
      <BusinessEmptyState onCreate={() => {}} />
    </div>
  );
}
