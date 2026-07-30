/**
 * StatBrowse — stat-led browse over the courses this community actually
 * plays. Sits in the Courses explore tab ahead of the full directory.
 *
 * Presentation only: rows arrive already ordered from the RPC and are
 * rendered in the order received.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CountryFlag from '@/components/ui/country-flag';
import UnifiedCourseCard from './UnifiedCourseCard';
import { fromStatBrowseRow } from '@/lib/mappers/toCourseCardModel';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatNumber } from '@/i18n/format';
import { isEarlyData } from '@/lib/earlyData';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import {
  chipForLens,
  isStatLens,
  STAT_BROWSE_PAGE_SIZE,
  STAT_LENSES,
  useStatBrowseFacets,
  useStatBrowseList,
  type StatBrowseRow,
  type StatLens,
} from './useStatBrowse';
import {
  AMBER,
  HAIRLINE_INK_8,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SURFACE,
  SLATE_50,
} from '@/features/courses/_shared/tokens';

interface StatBrowseProps {
  /** Reveal CourseExplorer (the full directory) — owned by the parent. */
  onOpenDirectory: (country: string | null) => void;
}

/** Scanning aid inside the dropdowns only - never in the headline copy. */
const LENS_EMOJI: Record<StatLens, string> = {
  toughest: '\u{1F624}',
  scoreable: '\u{1F3AF}',
  played: '\u26F3',
  longest: '\u{1F4CF}',
  rated: '\u2B50',
  chase: '\u{1F451}',
};

/** Remembers the member's last lens choice across visits. */
const LENS_STORAGE_KEY = 'clbhouz.statBrowse.lens';

const TRIGGER_CLS =
  'h-10 rounded-xl border bg-white px-3 text-[13px] font-semibold justify-between focus:outline-none';

/** Condensed sticky bar control. */
const COMPACT_TRIGGER_CLS =
  'h-8 w-full rounded-xl border bg-white px-3 text-[12px] font-semibold justify-between focus:outline-none';

export const StatBrowse: React.FC<StatBrowseProps> = ({ onOpenDirectory }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadSentinelRef = useRef<HTMLDivElement | null>(null);
  const [condensed, setCondensed] = useState(false);
  const viewedRef = useRef(false);

  const { data: facets } = useStatBrowseFacets();

  /* ── URL state: read + validate against the facets ─────────────── */
  /**
   * Lens precedence, highest first:
   *   1. ?lens= URL param (if a known lens id)
   *   2. localStorage, the member's last choice (if a known lens id)
   *   3. 'rated'
   * Country and region are never persisted — only the lens.
   */
  const urlLens = searchParams.get('lens');
  const storedLens = useMemo(() => safeLocalStorage.get(LENS_STORAGE_KEY), []);
  const lens: StatLens = isStatLens(urlLens)
    ? urlLens
    : isStatLens(storedLens)
      ? storedLens
      : 'rated';

  const urlCountry = searchParams.get('country');
  const country = useMemo(() => {
    if (!urlCountry || urlCountry === 'all') return null;
    if (!facets) return urlCountry;
    return facets.countries.some((c) => c.sub_country === urlCountry) ? urlCountry : null;
  }, [urlCountry, facets]);

  const regionsForCountry = useMemo(
    () => (country && facets ? facets.regions.filter((r) => r.sub_country === country) : []),
    [country, facets],
  );

  const urlRegion = searchParams.get('region');
  const region = useMemo(() => {
    if (!country || !urlRegion || urlRegion === 'all') return null;
    if (!facets) return urlRegion;
    return regionsForCountry.some((r) => r.region === urlRegion) ? urlRegion : null;
  }, [country, urlRegion, facets, regionsForCountry]);

  const { rows, totalCount, isLoading, isPaging, loadMore } = useStatBrowseList({
    lens,
    country,
    region,
  });

  /* ── URL state: write ──────────────────────────────────────────── */
  const writeUrl = useCallback(
    (next: { lens?: StatLens; country?: string | null; region?: string | null }) => {
      const params = new URLSearchParams(searchParams);
      if (next.lens !== undefined) params.set('lens', next.lens);
      if (next.country !== undefined) {
        if (next.country) params.set('country', next.country);
        else params.delete('country');
        params.delete('region');
      }
      if (next.region !== undefined) {
        if (next.region) params.set('region', next.region);
        else params.delete('region');
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  /* Condense on scroll: sentinel above the bar leaves the viewport top. */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setCondensed(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px 0px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Continuous scroll: sentinel below the last card pulls the next page. */
  useEffect(() => {
    const el = loadSentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isPaging) loadMore();
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, isPaging, rows.length]);

  /* Depth reached, once per page load. */
  const depthRef = useRef({ rows: 0, total: 0, lens, country, sent: false });
  useEffect(() => {
    depthRef.current.rows = rows.length;
    depthRef.current.total = totalCount;
    depthRef.current.lens = lens;
    depthRef.current.country = country;
  }, [rows.length, totalCount, lens, country]);
  useEffect(() => {
    const send = () => {
      if (depthRef.current.sent) return;
      depthRef.current.sent = true;
      analyticsEvents.track('stat_browse_scroll_depth', {
        lens: depthRef.current.lens,
        country: depthRef.current.country,
        rows_loaded: depthRef.current.rows,
        total_count: depthRef.current.total,
      });
    };
    window.addEventListener('pagehide', send);
    return () => {
      window.removeEventListener('pagehide', send);
      send();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  /* ── Analytics ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    analyticsEvents.track('stat_browse_viewed', { lens, country, region });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emptyTrackedFor = useRef<string | null>(null);
  useEffect(() => {
    if (isLoading || rows.length > 0 || !country) return;
    if (emptyTrackedFor.current === country) return;
    emptyTrackedFor.current = country;
    analyticsEvents.track('stat_browse_empty_shown', { country });
  }, [isLoading, rows.length, country]);

  const onLensChange = (next: StatLens) => {
    analyticsEvents.track('stat_browse_lens_changed', { from: lens, to: next });
    safeLocalStorage.set(LENS_STORAGE_KEY, next);
    writeUrl({ lens: next });
  };

  const onCountryChange = (value: string) => {
    const next = value === 'all' ? null : value;
    analyticsEvents.track('stat_browse_country_changed', { country: next });
    writeUrl({ country: next });
  };

  const onRegionChange = (value: string) => {
    const next = value === 'all' ? null : value;
    analyticsEvents.track('stat_browse_region_changed', { country, region: next });
    writeUrl({ region: next });
  };

  const openDirectory = (
    withCountry: string | null,
    entry: 'filter_bar' | 'footer' | 'empty_state',
  ) => {
    analyticsEvents.track('stat_browse_directory_opened', { lens, country, entry });
    onOpenDirectory(withCountry);
  };

  /* ── Derivations ───────────────────────────────────────────────── */
  const unitLabel = useCallback((key: string) => t(`statBrowse.unit.${key}`), [t]);

  const sampleLine = useCallback(
    (row: StatBrowseRow): { text: string; earlyData?: boolean } | null => {
      let text: string | null = null;
      if (lens === 'toughest' || lens === 'scoreable') {
        text = t('statBrowse.sample.rounds', { count: row.rounds });
      } else if (lens === 'played') {
        text = t('statBrowse.sample.members', { count: row.members });
      } else if (lens === 'longest') {
        text = row.tee_label ? t('statBrowse.sample.tees', { tee: row.tee_label }) : null;
      } else if (lens === 'rated') {
        text = t('statBrowse.sample.reviews', { count: row.review_count });
      } else if (lens === 'chase') {
        text = row.course_record != null
          ? t('statBrowse.sample.record', { score: row.course_record })
          : null;
      }
      if (!text) return null;
      return { text, earlyData: isEarlyData(row.rounds) };
    },
    [lens, t],
  );

  const description = useMemo(() => {
    const base = t(`statBrowse.lens.${lens}.description`);
    if (region && country) return base + t('statBrowse.inRegion', { region, country });
    if (country) return base + t('statBrowse.inCountry', { country });
    return base;
  }, [t, lens, country, region]);

  const countryEntry = facets?.countries.find((c) => c.sub_country === country) ?? null;
  const regionDisabled = !country || regionsForCountry.length <= 1;
  const remaining = Math.max(0, totalCount - rows.length);
  const showEmpty = !isLoading && rows.length === 0;

  const countryTriggerLabel = country ?? t('statBrowse.allAreas');

  const countrySelect = (compact: boolean) => (
    <Select value={country ?? 'all'} onValueChange={onCountryChange}>
      <SelectTrigger
        className={compact ? COMPACT_TRIGGER_CLS : TRIGGER_CLS}
        style={{ borderColor: HAIRLINE_INK_10, color: country ? INK : INK_MUTE }}
        aria-label={t('statBrowse.selectCountryA11y')}
      >
        {compact ? (
          <span className="truncate">
            {'\u{1F30D}  '}
            {countryTriggerLabel}
          </span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg">
        <SelectItem value="all">
          <span>{'\u{1F30D}  '}{t('statBrowse.allAreas')}</span>
        </SelectItem>
        {(facets?.countries ?? []).map((c) => (
          <SelectItem key={c.sub_country} value={c.sub_country}>
            <span className="flex items-center gap-2">
              <CountryFlag country={c.sub_country} size="sm" />
              {t('statBrowse.countryOption', {
                country: c.sub_country,
                count: c.courses,
              })}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const regionSelect = (compact: boolean) => (
    <Select value={region ?? 'all'} onValueChange={onRegionChange} disabled={regionDisabled}>
      <SelectTrigger
        className={`${compact ? COMPACT_TRIGGER_CLS : TRIGGER_CLS} disabled:opacity-60`}
        style={{ borderColor: HAIRLINE_INK_10, color: region ? INK : INK_MUTE }}
        aria-label={t('statBrowse.selectRegionA11y')}
      >
        {regionDisabled && !compact ? (
          <span className="truncate">{t('statBrowse.allRegions')}</span>
        ) : compact ? (
          <span className="truncate">{region}</span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg">
        <SelectItem value="all">
          {country ? t('statBrowse.allOf', { country }) : t('statBrowse.allRegions')}
        </SelectItem>
        {regionsForCountry.map((r) => (
          <SelectItem key={r.region} value={r.region}>
            {t('statBrowse.regionOption', { region: r.region, count: r.courses })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const lensSelect = (compact: boolean) => (
    <Select value={lens} onValueChange={(v) => onLensChange(v as StatLens)}>
      <SelectTrigger
        className={
          compact
            ? COMPACT_TRIGGER_CLS
            : 'h-8 rounded-xl border bg-white px-3 text-[12px] font-semibold w-auto'
        }
        style={{ borderColor: HAIRLINE_INK_10, color: INK }}
        aria-label={t('statBrowse.selectLensA11y')}
      >
        {compact ? (
          <span className="truncate">
            {`${LENS_EMOJI[lens]}  `}
            {t(`statBrowse.lens.${lens}.label`)}
          </span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg">
        {STAT_LENSES.map((l) => (
          <SelectItem key={l} value={l}>
            {`${LENS_EMOJI[l]}  `}
            {t(`statBrowse.lens.${l}.label`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="w-full">
      {/* Sentinel: once this leaves the top, the sticky bar condenses. */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

      {/* ── Pickers (sticky) ────────────────────────────────────── */}
      <div
        className="-mx-4 px-4 pt-1.5 pb-2 sticky"
        style={{
          top: 'calc(var(--sat, 0px))',
          zIndex: 20,
          // Light-page glass: canonical --glass-bg is a dark token, so the
          // bar uses the light translucent equivalent to keep ink controls legible.
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          borderBottom: `1px solid ${HAIRLINE_INK_8}`,
        }}
      >
        {condensed ? (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              {region ? regionSelect(true) : countrySelect(true)}
            </div>
            <div className="min-w-0 flex-1">{lensSelect(true)}</div>
            {directorySearchButton(true)}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">{countrySelect(false)}</div>
              <div className="flex-1 min-w-0">{regionSelect(false)}</div>
              {directorySearchButton(false)}
            </div>


            {/* Count + lens */}
            <div className="flex items-center justify-between gap-3 mt-2.5">
              <span style={{ fontSize: 13, color: INK_MUTE, lineHeight: 1.3 }}>
                <strong style={{ color: INK, fontWeight: 800 }}>{formatNumber(totalCount)}</strong>{' '}
                {t('statBrowse.countTracked', { count: totalCount })}
              </span>
              {lensSelect(false)}
            </div>
          </>
        )}
      </div>

      {/* ── Headline ────────────────────────────────────────────── */}
      <div className="pt-4">

        <div
          style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: AMBER,
          }}
        >
          {t('statBrowse.eyebrow')}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, marginTop: 4 }}>
          {t(`statBrowse.lens.${lens}.title`)}
        </h2>
        <p style={{ fontSize: 12.5, color: INK_MUTE, marginTop: 4, lineHeight: 1.45 }}>
          {description}
        </p>
      </div>

      {/* ── List ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="mt-4 -mx-4 space-y-2 sm:space-y-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-full aspect-[16/9.5] animate-pulse"
              style={{ background: 'rgba(15,23,42,0.06)' }}
            />
          ))}
        </div>
      ) : showEmpty ? (
        country ? (
          <div
            className="mt-4 p-5"
            style={{
              background: 'rgba(247,147,30,0.06)',
              border: `1px solid rgba(247,147,30,0.35)`,
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: 28, lineHeight: 1 }}>
              <CountryFlag country={country} size="lg" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: INK, marginTop: 10 }}>
              {t('statBrowse.empty.title', { country })}
            </h3>
            <p style={{ fontSize: 13.5, color: INK_MUTE, marginTop: 6, lineHeight: 1.5 }}>
              {t('statBrowse.empty.body', {
                count: countryEntry?.directory_total ?? 0,
                country,
              })}
            </p>
            <button
              type="button"
              onClick={() => {
                analyticsEvents.track('stat_browse_connect_tapped', {
                  country,
                  source: 'stat_browse_empty',
                });
                navigate('/handicap');
              }}
              className="w-full mt-4 h-11 rounded-xl text-white text-[14px] font-bold"
              style={{ background: AMBER }}
            >
              {t('statBrowse.empty.connect')}
            </button>
            <button
              type="button"
              onClick={() => openDirectory(country, 'empty_state')}
              className="w-full mt-2 h-11 rounded-xl text-[14px] font-semibold"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}`, color: INK }}
            >
              {t('statBrowse.empty.browse', { country })}
            </button>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: INK }}>
              {t('statBrowse.empty.nothingTitle')}
            </h3>
            <p style={{ fontSize: 13, color: INK_MUTE, marginTop: 4 }}>
              {t('statBrowse.empty.nothingBody')}
            </p>
          </div>
        )
      ) : (
        <div className="mt-4 -mx-4 space-y-2 sm:space-y-6">
          {rows.map((row, i) => (
            <UnifiedCourseCard
              key={row.course_id}
              course={fromStatBrowseRow(row)}
              variant="vertical"
              showRankBadges
              showRating
              showPlayedStatus
              /* The lens chip renders unless it would duplicate a figure
                 already on the card — 'rated' repeats the community rating. */
              statChip={lens === 'rated' ? null : chipForLens(lens, row, unitLabel)}
              statLine={sampleLine(row)}
              onClick={() => {
                analyticsEvents.track('stat_browse_course_opened', {
                  course_id: row.course_id,
                  lens,
                  rank: i + 1,
                });
                navigate(`/courses/${row.course_id}`);
              }}
            />
          ))}

          {isPaging && (
            <div className="px-4" style={{ fontSize: 12.5, color: INK_MUTE }}>
              {t('statBrowse.loadingMore')}
            </div>
          )}

          {rows.length < totalCount && (
            <div ref={loadSentinelRef} style={{ height: 1 }} aria-hidden="true" />
          )}
        </div>
      )}

      {/* ── Directory floor ─────────────────────────────────────── */}
      {rows.length >= totalCount && (
        <div
          className="mt-6 p-4"
          style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_8}`, borderRadius: 14 }}
        >
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: INK }}>
            {t('statBrowse.directory.title')}
          </h3>
          <p style={{ fontSize: 12.5, color: INK_MUTE, marginTop: 4, lineHeight: 1.45 }}>
            {t('statBrowse.directory.body', {
              count: formatNumber(
                Math.max(0, (facets?.directory_total ?? 0) - (facets?.played_total ?? 0)),
              ),
            })}
          </p>
          <button
            type="button"
            onClick={() => openDirectory(null, 'footer')}
            className="w-full mt-3 h-11 rounded-xl text-[13.5px] font-semibold"
            style={{ background: SLATE_50, border: `1px solid ${HAIRLINE_INK_10}`, color: INK }}
          >
            {t('statBrowse.directory.cta')}
          </button>
        </div>
      )}
    </div>
  );
};

export default StatBrowse;
