/**
 * BusinessEmptyState — the "no businesses yet" surface on MyBusinessesPage.
 *
 * BRIEF_BUSINESS_EMPTY_STATE. This is the one page in the app a business owner
 * sees before they own anything, so it is a CINEMATIC SELL, not a form:
 *
 *   HERO          full-bleed photograph under the canonical SCRIM_STANDOUT.
 *   THE NUMBERS   one figure leads (courses), two support under a hairline.
 *                 All three are LIVE from get_platform_reach() — never typed.
 *   EXAMPLES      miniatures of what a business page looks like, in a snapping
 *                 rail, on real supplied photography.
 *   BENEFITS      three numbered rows, each anchored to something concrete.
 *   CTA           sticky, blurred, the only filled button on the page.
 *
 * HONESTY RULES (§4.4, §4.5):
 *   - NO INVENTED STATISTICS. The example miniatures carry NO follower/view/
 *     rating row, because the platform has no claimed business accounts whose
 *     real figures could be shown. A fabricated figure on a page that names a
 *     real club is a false claim about that club.
 *   - A photograph that fails to load DROPS its example entirely. No
 *     placeholder, no gradient card.
 *   - Each miniature is tagged EXAMPLE so nothing here reads as a claim about
 *     a named business.
 *
 * DELTA COLOUR RULE. A delta is an up triangle plus a figure in A.GREEN — a
 * figure with an ARROW is a MOVEMENT and takes the improvement convention. A
 * zero or missing delta renders NOTHING: a flat month must read as "no news",
 * never as "stalled".
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { A, LABEL } from '@/features/courses/components/holes/analytical/tokens';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { usePlatformReach } from '@/hooks/usePlatformReach';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { BUSINESS_CATEGORIES } from '@/types/profile';
// HERO (§3.4) — a range at dusk, NOT a course: a links clubhouse said "venues".
import heroPhoto from '@/assets/business/driving-range.webp.asset.json';
import clubPhoto from '@/assets/business/club-green.webp.asset.json';
import coachPhoto from '@/assets/business/coach-lesson.jpg';
import fitterPhoto from '@/assets/business/fitting-bay.jpg';
import brandPhoto from '@/assets/business/brand-product.jpg';

interface BusinessEmptyStateProps {
  onCreate: () => void;
}

const COUNT_UP_MS = 900;
const DARK = '#0E1216';
const DARK_HAIR = 'rgba(255,255,255,0.14)';
const DARK_MUTE = 'rgba(255,255,255,0.56)';

/** Grouped figures, tolerant of a malformed language tag. */
function fmt(n: number, locale: string): string {
  try {
    return n.toLocaleString(locale);
  } catch {
    return n.toLocaleString('en');
  }
}

/** Figures ARRIVE at their value: ease-out cubic, once per mount. */
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

const Delta = ({ delta, locale, label }: { delta: number | null; locale: string; label: string }) => {
  if (delta == null || delta <= 0) return null;
  return (
    <span
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 10.5,
        fontWeight: 700,
        color: A.GREEN,
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}
    >
      <span aria-hidden style={{ fontSize: 7.5 }}>{'\u25B2'}</span>
      {fmt(delta, locale)}
    </span>
  );
};

/* ───────────────────────── example miniature ───────────────────────── */

interface ExampleSpec {
  id: string;
  src: string;
  name: string;
  meta: string;
}

function ExampleCard({ spec, tabs, tag }: { spec: ExampleSpec; tabs: string[]; tag: string }) {
  const [failed, setFailed] = useState(false);
  // §4.5 — a photograph that will not load drops the example entirely.
  if (failed) return null;

  return (
    <div
      style={{
        flex: '0 0 auto',
        width: 232,
        scrollSnapAlign: 'start',
        background: A.PANEL,
        border: `1px solid ${A.BORDER}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', height: 118, background: A.TRACK }}>
        <img
          src={spec.src}
          alt={spec.name}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            ...LABEL,
            fontSize: 7.5,
            color: 'rgba(255,255,255,0.86)',
            background: 'rgba(10,14,10,0.42)',
            padding: '3px 6px',
            borderRadius: 4,
          }}
        >
          {tag}
        </div>
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            {spec.name}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.76)', marginTop: 1 }}>
            {spec.meta}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, padding: '9px 10px' }}>
        {tabs.map((tabLabel, i) => (
          <span
            key={tabLabel}
            style={{
              ...LABEL,
              fontSize: 7.5,
              color: i === 0 ? A.INK : A.DIM,
              borderBottom: i === 0 ? `1.5px solid ${A.AMBER}` : '1.5px solid transparent',
              paddingBottom: 3,
            }}
          >
            {tabLabel}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── the surface ─────────────────────────── */

export function BusinessEmptyState({ onCreate }: BusinessEmptyStateProps) {
  const { t, i18n } = useTranslation('common');
  const { data, isSuccess } = usePlatformReach();
  const locale = i18n.language || 'en';
  const [heroFailed, setHeroFailed] = useState(false);

  const courses = useCountUp(data?.coursesTotal ?? null, isSuccess);
  const coursesLive = data?.coursesTotal ?? null;
  const upLabel = (n: number) => t('business.emptyState.reach.up', { count: n });

  /**
   * FOUR EXAMPLES, ONE VENUE (§3.1). The photographs carry the argument: a
   * fitting bay and a product shot look nothing like a green, and that visual
   * distance is what says "any golf business".
   *
   * §3.3 — every label is read out of BUSINESS_CATEGORIES verbatim, so the word
   * Ben sees here is the word he picks in the category list. `category()` throws
   * nothing but returns '' if the list is ever edited, and an example with no
   * resolvable category drops rather than showing an invented name.
   *
   * §3.6 — WHEN REAL BUSINESSES EXIST this becomes a DATA CHANGE, not a rebuild:
   * ExampleSpec already carries the optional `name` (a real trading name) and
   * `stats` (a real figure row) that a claimed account would supply. Swap this
   * literal array for the rows of a `useExampleBusinesses()` query mapped into
   * the same shape, drop `isExample` on those rows, and ExampleCard renders the
   * real name and the stats row with no layout work.
   */
  const category = (value: string) => BUSINESS_CATEGORIES.find((c) => c === value) ?? '';

  const examples: ExampleSpec[] = [
    {
      id: 'club',
      src: clubPhoto.url,
      category: category('Golf Club'),
      meta: t('business.emptyState.examples.club.meta'),
      isExample: true,
    },
    {
      id: 'coach',
      src: coachPhoto,
      category: category('Coach / Instructor'),
      meta: t('business.emptyState.examples.coach.meta'),
      isExample: true,
    },
    {
      id: 'fitter',
      src: fitterPhoto,
      category: category('Club Fitter'),
      meta: t('business.emptyState.examples.fitter.meta'),
      isExample: true,
    },
    {
      id: 'brand',
      src: brandPhoto,
      category: category('Brand / Manufacturer'),
      meta: t('business.emptyState.examples.brand.meta'),
      isExample: true,
    },
  ].filter((spec) => spec.category !== '');

  const tabs = [
    t('business.emptyState.examples.tabs.home'),
    t('business.emptyState.examples.tabs.about'),
    t('business.emptyState.examples.tabs.reviews'),
  ];

  const benefits = [
    {
      n: '01',
      title: t('business.emptyState.rows.found.title'),
      body: t('business.emptyState.rows.found.body', {
        count: coursesLive ?? 0,
        courses: coursesLive == null ? '' : fmt(coursesLive, locale),
      }),
      hasFigure: coursesLive != null,
    },
    {
      n: '02',
      title: t('business.emptyState.rows.trusted.title'),
      body: t('business.emptyState.rows.trusted.body'),
      hasFigure: true,
    },
    {
      n: '03',
      title: t('business.emptyState.rows.reach.title'),
      body: t('business.emptyState.rows.reach.body'),
      hasFigure: true,
    },
  ];

  return (
    <div className="w-full" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 116px)' }}>
      {/* ── HERO ── */}
      <div style={{ position: 'relative', height: 340, background: DARK, overflow: 'hidden' }}>
        {!heroFailed && (
          <img
            src={heroPhoto.url}
            alt=""
            onError={() => setHeroFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 18 }}>
          <div style={{ ...LABEL, fontSize: 9, color: A.AMBER }}>
            {t('business.emptyState.hero.kicker')}
          </div>
          <h2
            style={{
              margin: '8px 0 0',
              fontSize: 32,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              color: '#FFFFFF',
            }}
          >
            {t('business.emptyState.hero.title')}
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.80)' }}>
            {t('business.emptyState.hero.body')}
          </p>
        </div>
      </div>

      {/* ── THE NUMBERS: one leads, two support ── */}
      <div style={{ background: DARK, padding: '18px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              letterSpacing: '-0.045em',
              lineHeight: 1,
              color: '#FFFFFF',
              fontVariantNumeric: 'tabular-nums lining-nums',
              minHeight: 46,
            }}
          >
            {courses == null ? '' : fmt(courses, locale)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK_MUTE, letterSpacing: '-0.01em' }}>
            {t('business.emptyState.numbers.courses')}
          </div>
        </div>

        <div style={{ height: 1, background: DARK_HAIR, margin: '14px 0 12px' }} />

        <div style={{ display: 'flex', gap: 28 }}>
          {[
            {
              key: 'rounds',
              label: t('business.emptyState.numbers.rounds'),
              total: data?.roundsTotal ?? null,
              delta: data?.roundsDelta ?? null,
            },
            {
              key: 'reviews',
              label: t('business.emptyState.numbers.reviews'),
              total: data?.reviewsTotal ?? null,
              delta: data?.reviewsDelta ?? null,
            },
          ].map((cell) => (
            <div key={cell.key} style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: '#FFFFFF',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                    minHeight: 20,
                  }}
                >
                  {isSuccess && cell.total != null ? fmt(cell.total, locale) : ''}
                </span>
                {isSuccess && <Delta delta={cell.delta} locale={locale} label={upLabel(cell.delta ?? 0)} />}
              </div>
              <div style={{ ...LABEL, fontSize: 8, color: DARK_MUTE, marginTop: 3 }}>{cell.label}</div>
            </div>
          ))}
        </div>

        <div style={{ ...LABEL, fontSize: 7.5, color: 'rgba(255,255,255,0.38)', textAlign: 'right', marginTop: 10 }}>
          {t('business.emptyState.numbers.greenNote')}
        </div>
      </div>

      {/* ── EXAMPLES ── */}
      <div style={{ paddingTop: 22 }}>
        <div style={{ padding: '0 16px' }}>
          <div style={{ ...LABEL, fontSize: 8, color: A.DIM }}>
            {t('business.emptyState.examples.kicker')}
          </div>
          <h3
            style={{
              margin: '6px 0 0',
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: A.INK,
            }}
          >
            {t('business.emptyState.examples.heading')}
          </h3>
        </div>
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            padding: '12px 16px 2px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {examples.map((spec) => (
            <ExampleCard
              key={spec.id}
              spec={spec}
              tabs={tabs}
              tag={t('business.emptyState.examples.tag')}
            />
          ))}
        </div>
      </div>

      {/* ── BENEFITS ── */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ ...LABEL, fontSize: 8, color: A.DIM, marginBottom: 4 }}>
          {t('business.emptyState.guidanceHeading')}
        </div>
        {benefits.map((row) => (
          <div
            key={row.n}
            style={{
              display: 'flex',
              gap: 12,
              padding: '14px 0',
              borderTop: `1px solid ${A.BORDER}`,
            }}
          >
            <div
              style={{
                ...LABEL,
                fontSize: 9,
                color: A.AMBER,
                paddingTop: 2,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {row.n}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, letterSpacing: '-0.02em' }}>
                {row.title}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: A.BODY, marginTop: 3, lineHeight: 1.45 }}>
                {row.body}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── STICKY CTA — the only filled button on the page ── */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: `1px solid ${A.BORDER}`,
          padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 10px)',
        }}
      >
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <button
            type="button"
            onClick={onCreate}
            className="w-full active:opacity-90"
            style={{
              minHeight: 50,
              borderRadius: 14,
              background: A.AMBER,
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              border: 'none',
            }}
          >
            {t('business.emptyState.cta')}
          </button>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: A.MUTE, textAlign: 'center', marginTop: 7 }}>
            {t('business.emptyState.footnote')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessEmptyState;
