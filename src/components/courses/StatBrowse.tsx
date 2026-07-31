/**
 * StatBrowse — stat-led browse over the courses this community actually
 * plays. Sits in the Courses explore tab ahead of the directory sheet.
 *
 * Presentation only: rows arrive already ordered from the RPC and are
 * rendered in the order received.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CountryFlag from '@/components/ui/country-flag';
import UnifiedCourseCard, { getRegionalBadgeSlug } from './UnifiedCourseCard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100Enrichment } from '@/hooks/top100/useTop100Enrichment';
import { useTop100Config } from '@/hooks/top100/useTop100Config';
import { computeVerdict, type Verdict } from '@/components/top100/verdict';
import { Top100EnrichmentBlock } from '@/components/top100/Top100EnrichmentBlock';
import { useCourseRatingStanding } from '@/hooks/top100/useCourseRatingStanding';
import { Top100VerdictExplainerSheet } from '@/components/top100/sheets/Top100VerdictExplainerSheet';
import { fromStatBrowseRow } from '@/lib/mappers/toCourseCardModel';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatNumber } from '@/i18n/format';
import { isEarlyData } from '@/lib/earlyData';
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
  /** Open the course directory sheet — owned by the parent. */
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


/** Short list labels for the verdict explainer sheet. */
const LIST_LABEL: Record<string, string> = {
  global: 'Global',
  'gb-i': 'GB&I',
  usa: 'USA',
  europe: 'Europe',
};

const TRIGGER_CLS =
  'h-10 rounded-xl border bg-white px-3 text-[13px] font-semibold justify-between focus:outline-none';

/** Condensed sticky bar control. */
const COMPACT_TRIGGER_CLS =
  'h-8 w-full rounded-xl border bg-white px-3 text-[12px] font-semibold justify-between focus:outline-none';


/**
 * Wraps the enrichment block so the standing line can be fetched per course
 * WITHOUT calling a hook for every visible row: the query is enabled only when
 * the course already qualifies for the verdict band (ranked and rated).
 * p_list_slug is left NULL so the server picks the list by sort_order — a
 * course in both Global and GB&I resolves to Global and names it.
 */
const RankedEnrichment: React.FC<
  React.ComponentProps<typeof Top100EnrichmentBlock> & { hasVerdict: boolean }
> = ({ hasVerdict, ...props }) => {
  const { data: standing } = useCourseRatingStanding(props.courseId, null, hasVerdict);
  return (
    <Top100EnrichmentBlock
      {...props}
      ratingRank={
        standing ? { position: standing.standing, poolSize: standing.poolSize } : null
      }
      listLabel={standing?.listLabel ?? undefined}
    />
  );
};

export const StatBrowse: React.FC<StatBrowseProps> = ({ onOpenDirectory }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
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
   *   2. 'rated' — the landing default, never persisted across visits
   */
  const urlLens = searchParams.get('lens');
  const lens: StatLens = isStatLens(urlLens) ? urlLens : 'rated';

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

  /* ── Top 100 enrichment (ranked rows only) ─────────────────────── */
  /**
   * Only rows carrying a published rank get the verdict band + COURSE STATS
   * panel, so only those ids are fetched. The set grows a page at a time and
   * the hook is keyed on the whole set, so each page refetches it — acceptable
   * at the current ceiling (121 tracked courses, fewer ranked). Do not widen.
   */
  const rankedRows = useMemo(
    () => rows.filter((r) => r.global_rank != null || r.regional_rank != null),
    [rows],
  );
  const rankedIds = useMemo(() => rankedRows.map((r) => r.course_id), [rankedRows]);
  const enrichment = useTop100Enrichment(rankedIds, user?.id);
  const verdictConfig = useTop100Config();
  const [verdictSheet, setVerdictSheet] = useState<{
    courseId: string;
    courseName: string;
    verdict: Verdict;
    canRate: boolean;
    listLabel: string;
    listCount: number;
  } | null>(null);



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

  /* Depth reached, once per lens/country the member actually browsed. */
  const depthRef = useRef({ rows: 0, total: 0, lens, country, sent: false });
  useEffect(() => {
    depthRef.current.rows = rows.length;
    depthRef.current.total = totalCount;
  }, [rows.length, totalCount]);

  const flush = useCallback(() => {
    if (depthRef.current.sent) return;
    if (depthRef.current.rows === 0) return;
    depthRef.current.sent = true;
    analyticsEvents.track('stat_browse_scroll_depth', {
      lens: depthRef.current.lens,
      country: depthRef.current.country,
      rows_loaded: depthRef.current.rows,
      total_count: depthRef.current.total,
    });
  }, []);

  /* Lens or country change: flush the OUTGOING measurement, then reset. */
  const firstDepthScope = useRef(true);
  useEffect(() => {
    if (firstDepthScope.current) {
      firstDepthScope.current = false;
      return;
    }
    flush();
    depthRef.current.sent = false;
    depthRef.current.rows = 0;
    depthRef.current.total = 0;
    depthRef.current.lens = lens;
    depthRef.current.country = country;
  }, [lens, country, flush]);

  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  const directoryRemaining = Math.max(
    0,
    (facets?.directory_total ?? 0) - (facets?.played_total ?? 0),
  );

  /**
   * Tracked total denominator — derived from the same filters the numerator
   * uses so the sentence compares the same population. Falls back to 0 on a
   * missing facet row rather than silently showing the global total.
   */
  const trackedTotal = (() => {
    if (!facets) return 0;
    if (country && region) {
      return (
        facets.regions.find(
          (r) => r.sub_country === country && r.region === region,
        )?.courses ?? 0
      );
    }
    if (country) {
      return (
        facets.countries.find((c) => c.sub_country === country)?.courses ?? 0
      );
    }
    return facets.played_total;
  })();




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

  /* Top-of-page door into the full directory — a member whose course is
     missing should not have to exhaust the list to go looking. */
  const directorySearchButton = (compact: boolean) => (
    <button
      type="button"
      onClick={() => openDirectory(country, 'filter_bar')}
      aria-label={t('directorySheet.openA11y')}
      className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} shrink-0 rounded-xl bg-white flex items-center justify-center`}
      style={{ border: `1px solid ${HAIRLINE_INK_10}` }}
    >
      <Search className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} style={{ color: INK }} aria-hidden="true" />
    </button>
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
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '5px 11px',
                  borderRadius: 999,
                  background: 'rgba(15,23,42,0.05)',
                  border: `0.5px solid rgba(15,23,42,0.08)`,
                  fontSize: 12,
                  fontWeight: 600,
                  color: INK,
                  lineHeight: 1.35,
                }}
              >
                {trackedTotal > 0
                  ? t(`statBrowse.countLens.${lens}`, {
                      count: totalCount,
                      total: formatNumber(trackedTotal),
                    })
                  : t('statBrowse.countTracked', { count: totalCount })}
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
          {rows.map((row, i) => {
            const model = fromStatBrowseRow(row);
            const rank = row.global_rank ?? row.regional_rank ?? null;
            const listSlug =
              row.global_rank != null ? 'global' : getRegionalBadgeSlug(model) ?? 'regional';
            const data = rank != null ? enrichment.get(row.course_id) : undefined;
            /* No ratingRank here by decision: a course can sit in two lists at
               once and this surface has no single list loaded, so "Nth of N on
               this list" has no correct answer. First line only. */
            const verdict =
              rank != null && data
                ? computeVerdict({
                    rank,
                    rating: data.rating,
                    ratingCount: data.ratingCount,
                    config: verdictConfig,
                  })
                : null;

            return (
              <div key={row.course_id}>
                <UnifiedCourseCard
                  course={model}
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
                {rank != null && (
                  <RankedEnrichment
                    hasVerdict={!!verdict}
                    courseId={row.course_id}
                    courseName={row.name}
                    rank={rank}
                    list={listSlug}
                    data={data}
                    verdict={verdict}
                    onOpenVerdict={() => {
                      if (!verdict) return;
                      setVerdictSheet({
                        courseId: row.course_id,
                        courseName: row.name,
                        verdict,
                        canRate: !!data && !data.ratedByYou,
                        listLabel: LIST_LABEL[listSlug] ?? '',
                        listCount:
                          (row.global_rank != null ? 1 : 0) +
                          (row.regional_rank != null ? 1 : 0),
                      });
                    }}
                    onRate={() => navigate(`/courses/${row.course_id}/rate`)}
                  />
                )}
              </div>
            );
          })}


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
              count: directoryRemaining,
              total: formatNumber(directoryRemaining),
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

      {verdictSheet && (
        <Top100VerdictExplainerSheet
          open
          onClose={() => setVerdictSheet(null)}
          courseId={verdictSheet.courseId}
          courseName={verdictSheet.courseName}
          listLabel={verdictSheet.listLabel}
          rank={verdictSheet.verdict.rank}
          rating={verdictSheet.verdict.rating}
          ratingCount={verdictSheet.verdict.ratingCount}
          listCount={verdictSheet.listCount}
          ratingRank={null}
          ratingPoolSize={null}
          canRate={verdictSheet.canRate}
          onRate={() => navigate(`/courses/${verdictSheet.courseId}/rate`)}
        />
      )}
    </div>
  );
};

export default StatBrowse;
