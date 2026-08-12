/**
 * BusinessEmptyState - the "no businesses yet" surface on MyBusinessesPage.
 *
 * ANALYTICAL TREATMENT, NOT A BESPOKE PANEL. The layout, the kicker, the INK
 * pill and the guidance rows all come from the shared EmptyState in
 * analytical/tokens.tsx. No icon tile at any size, no tinted surface, no
 * filled amber, no shadow, no per-benefit card.
 *
 * THE ARGUMENT IS THE FIGURES. The strongest thing the platform can say to a
 * business is its actual scale, so three LIVE figures from get_platform_reach()
 * sit where three sentences of adjectives used to. Member count is deliberately
 * absent: it is the one figure a business would most want and the one that does
 * not yet argue for us.
 *
 * DELTA COLOUR RULE. Each delta is an up triangle plus a figure in A.GREEN - a
 * figure with an ARROW is a MOVEMENT and takes the improvement convention
 * (green better). A figure with a sign or an "E" would be a SCORE and take the
 * tour convention (under par red). The arrow is what tells a reader which one
 * they are looking at, so it is not optional. A zero or missing delta renders
 * NOTHING: a flat month must read as "no news", never as "stalled".
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { A, LABEL, EmptyState } from '@/features/courses/components/holes/analytical/tokens';
import { usePlatformReach } from '@/hooks/usePlatformReach';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface BusinessEmptyStateProps {
  onCreate: () => void;
}

const COUNT_UP_MS = 900;

/**
 * Grouped figures, tolerant of a malformed language tag: i18n can hand us
 * values Intl rejects (e.g. "en-US@posix"), and a marketing figure must never
 * be the thing that throws.
 */
function fmt(n: number, locale: string): string {
  try {
    return n.toLocaleString(locale);
  } catch {
    return n.toLocaleString('en');
  }
}

/**
 * Figures ARRIVE at their value rather than scrolling past one: ease-out cubic
 * over 900ms, once per mount (the value is latched in a ref, so a re-render
 * never restarts it). prefers-reduced-motion: reduce renders the final value
 * immediately with no frames at all.
 */
function useCountUp(value: number | null, enabled: boolean): number | null {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [shown, setShown] = useState<number | null>(null);
  const startedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || value == null) return;
    if (startedFor.current === value) return;
    startedFor.current = value;

    if (prefersReducedMotion) {
      setShown(value);
      return;
    }

    let raf = 0;
    let t0 = 0;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / COUNT_UP_MS);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, value, prefersReducedMotion]);

  return shown;
}

const ReachCell = ({
  label,
  total,
  delta,
  ready,
  locale,
  upLabel,
}: {
  label: string;
  total: number | null;
  delta: number | null;
  ready: boolean;
  locale: string;
  upLabel: (n: number) => string;
}) => {
  const shown = useCountUp(total, ready);
  return (
    <div style={{ minWidth: 0, textAlign: 'center' }}>
      <div style={{ ...LABEL, fontSize: 8 }}>{label}</div>
      <div
        style={{
          marginTop: 5,
          fontSize: 25,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: A.INK,
          fontVariantNumeric: 'tabular-nums lining',
          // The query is a claim about the platform: while it is in flight the
          // cell renders NOTHING, never a zero. The box holds its height.
          minHeight: 28,
        }}
      >
        {shown == null ? '' : fmt(shown, locale)}
      </div>
      <div style={{ minHeight: 15, marginTop: 1 }}>
        {ready && delta != null && delta > 0 && (
          <span
            aria-label={upLabel(delta)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 10.5,
              fontWeight: 700,
              color: A.GREEN,
              fontVariantNumeric: 'tabular-nums lining',
            }}
          >
            <span aria-hidden style={{ fontSize: 7.5 }}>
              {'\u25B2'}
            </span>
            {fmt(delta, locale)}
          </span>
        )}
      </div>
    </div>
  );
};

export function BusinessEmptyState({ onCreate }: BusinessEmptyStateProps) {
  const { t, i18n } = useTranslation('common');
  const { data, isSuccess } = usePlatformReach();
  const locale = i18n.language || 'en';
  const upLabel = (n: number) => t('business.emptyState.reach.up', { count: n });

  const reach = (
    <div style={{ width: '100%', marginTop: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
        <ReachCell
          label={t('business.emptyState.reach.courses')}
          total={data?.coursesTotal ?? null}
          delta={data?.coursesDelta ?? null}
          ready={isSuccess}
          locale={locale}
          upLabel={upLabel}
        />
        <ReachCell
          label={t('business.emptyState.reach.rounds')}
          total={data?.roundsTotal ?? null}
          delta={data?.roundsDelta ?? null}
          ready={isSuccess}
          locale={locale}
          upLabel={upLabel}
        />
        <ReachCell
          label={t('business.emptyState.reach.reviews')}
          total={data?.reviewsTotal ?? null}
          delta={data?.reviewsDelta ?? null}
          ready={isSuccess}
          locale={locale}
          upLabel={upLabel}
        />
      </div>
      <div style={{ ...LABEL, fontSize: 7.5, textAlign: 'center', marginTop: 10 }}>
        {t('business.emptyState.reach.footnote')}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto" style={{ paddingTop: 8, paddingBottom: 24 }}>
      <EmptyState
        scale="business"
        kicker={t('business.emptyState.kicker')}
        title={t('business.emptyState.title')}
        body={t('business.emptyState.body')}
        slot={reach}
        primary={{ label: t('business.emptyState.cta'), onClick: onCreate }}
        footnote={t('business.emptyState.footnote')}
        guidanceHeading={t('business.emptyState.guidanceHeading')}
        guidance={[
          {
            title: t('business.emptyState.benefits.discoverable.claim'),
            body: t('business.emptyState.benefits.discoverable.tail'),
          },
          {
            title: t('business.emptyState.benefits.trust.claim'),
            body: t('business.emptyState.benefits.trust.tail'),
          },
          {
            title: t('business.emptyState.benefits.reach.claim'),
            body: t('business.emptyState.benefits.reach.tail'),
          },
        ]}
      />
    </div>
  );
}

export default BusinessEmptyState;
