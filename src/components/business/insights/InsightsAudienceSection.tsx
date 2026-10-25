/**
 * CB84 — Insights section 3 "Your golfers". Replaces the permanently locked
 * "Who's viewing you" card. Draws nothing until the read settles; a failed
 * read draws no card. The server owns every privacy merge — bands and regions
 * render exactly as returned, in the returned order, and the card ignores the
 * 7/30/90 picker. Styled as sections 1–2 (insights-visits-card family).
 */
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import {
  useBusinessAudience, bandLabel, largestBand, formatMedian, type BusinessAudience,
} from '@/hooks/useBusinessAudience';

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const BarRow = ({ label, count, max, elsewhere = false, dataAttr }: {
  label: string; count: number; max: number; elsewhere?: boolean; dataAttr: Record<string, string | number>;
}) => (
  <div className="insights-audience-row" data-elsewhere={elsewhere || undefined} {...dataAttr}>
    <span>{label}</span>
    <div className="insights-audience-track">
      <i style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }} />
    </div>
    <span className="insights-audience-value">{formatNumber(count)}</span>
  </div>
);

const Kicker = ({ left, right }: { left: string; right?: string }) => (
  <div className="insights-visits-kicker"><span>{left}</span>{right !== undefined && <span>{right}</span>}</div>
);

const ReadyCard = ({ a, k }: { a: BusinessAudience; k: (key: string, o?: Record<string, unknown>) => string }) => {
  const best = largestBand(a.bands);
  const oneBand = a.bands.length === 1 || !best;
  const title = oneBand
    ? k('titleOneBand', { count: a.with_handicap, n: formatNumber(a.with_handicap) })
    : k('titleMost', { band: lowerFirst(bandLabel(best.from, best.to)) });
  const bandMax = Math.max(1, ...a.bands.map(b => b.count));
  const regionRows: { region: string; count: number; elsewhere: boolean }[] = [
    ...a.regions.map(r => ({ ...r, elsewhere: false })),
    ...(a.elsewhere ? [{ region: k('elsewhere'), count: a.elsewhere, elsewhere: true }] : []),
  ];
  const regionMax = Math.max(1, ...regionRows.map(r => r.count));
  return (
    <>
      <h3 className="insights-audience-title" data-title={oneBand ? 'one-band' : 'most'} data-band={oneBand || !best ? undefined : bandLabel(best.from, best.to)}>{title}</h3>
      <div className="insights-audience-tiles">
        <div className="insights-audience-tile" data-tile="handicap" data-value={a.with_handicap}>
          <div className="n">{formatNumber(a.with_handicap)}</div>
          <div className="l">{k('tileHandicap')}</div>
        </div>
        <div className="insights-audience-tile" data-tile="median" data-value={a.median ?? undefined}>
          <div className="n">{a.median == null ? '–' : formatMedian(a.median)}</div>
          <div className="l">{k('tileMedian', { n: formatNumber(a.with_handicap) })}</div>
        </div>
      </div>
      <div className="insights-visits-kicker insights-audience-sub"><span>{k('handicapsKicker')}</span></div>
      <div className="insights-audience-rows" data-rows="bands">
        {a.bands.map(b => (
          <BarRow key={`${b.from}-${b.to}`} label={bandLabel(b.from, b.to)} count={b.count} max={bandMax}
            dataAttr={{ 'data-band': `${b.from}-${b.to}`, 'data-count': b.count }} />
        ))}
      </div>
      {a.elsewhere != null && (
        <>
          <div className="insights-visits-kicker insights-audience-sub"><span>{k('regionsKicker')}</span></div>
          <div className="insights-audience-rows" data-rows="regions">
            {regionRows.map(r => (
              <BarRow key={r.elsewhere ? 'elsewhere' : r.region} label={r.region} count={r.count} max={regionMax}
                elsewhere={r.elsewhere} dataAttr={{ 'data-region': r.elsewhere ? 'elsewhere' : r.region, 'data-count': r.count }} />
            ))}
          </div>
        </>
      )}
      <p className="insights-audience-fine">{k('fine')}</p>
    </>
  );
};

export function InsightsAudienceSection({ businessId, businessName }: { businessId: string; businessName: string }) {
  const { t } = useTranslation('common');
  const q = useBusinessAudience(businessId);
  if (!q.isFetched || q.isError || !q.data) return null;
  const a = q.data;
  const k = (key: string, options: Record<string, unknown> = {}) =>
    t(`business.insights.golfers.${key}`, { ...options, defaultValue: '' });
  const followers = k('followers', { count: a.followers_total, n: formatNumber(a.followers_total) });

  return (
    <section className="insights-audience-card" data-card="audience" data-state={a.state}>
      <Kicker left={k('kicker')} right={followers} />
      {a.state === 'ready' && <ReadyCard a={a} k={k} />}
      {a.state === 'not_enough' && (
        <>
          <h3 className="insights-audience-title" data-title="not-enough">{k('notEnoughTitle')}</h3>
          <div className="insights-audience-wait" data-with-handicap={a.with_handicap}>
            <b>{a.with_handicap === 0 ? k('leadZero') : k('lead', { count: a.with_handicap, n: formatNumber(a.with_handicap) })}</b>{' '}
            {k('notEnoughBody')}
            <div className="insights-audience-progress">
              <i data-progress={a.with_handicap} style={{ width: `${Math.min(100, (a.with_handicap / 10) * 100)}%` }} />
            </div>
          </div>
          <p className="insights-audience-fine">{k('notAffected')}</p>
        </>
      )}
      {a.state === 'none' && (
        <>
          <h3 className="insights-audience-title" data-title="none">{k('noneTitle', { business: businessName })}</h3>
          <p className="insights-audience-fine">{k('notAffected')}</p>
        </>
      )}
    </section>
  );
}
