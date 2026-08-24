/**
 * StatBrowse — stat-led browse over the courses this community actually
 * plays. Sits in the Courses explore tab ahead of the directory sheet.
 *
 * Presentation only: rows arrive already ordered from the RPC and are
 * rendered in the order received.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  Crown,
  Globe,
  Ruler,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,

} from '@/components/ui/select';
import CountryFlag from '@/components/ui/country-flag';
import UnifiedCourseCard, { getRegionalBadgeSlug } from './UnifiedCourseCard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserStatsCourseMap } from '@/contexts/UserStatsCoursesContext';
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
  type LensCounts,

} from './useStatBrowse';
import { A, KICKER, LABEL } from '@/features/courses/components/holes/analytical/tokens';
import { ReviewRailSlot } from './ReviewRailSlot';
import { ReviewFeaturedSlot } from './ReviewFeaturedSlot';
import { allocateReviewSlots } from './reviewSlots';
import { useBrowseReviews } from './useBrowseReviews';
import { LatestReviewsSheet } from '@/components/explore-tab-new/courseled/LatestReviewsSheet';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import {
  AMBER,
  HAIRLINE_INK_8,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SURFACE,
  SLATE_50,
} from '@/features/courses/_shared/tokens';

/**
 * Emphasise only the figures inside a sentence: INK 700 with tabular figures
 * against the surrounding INK_MUTE body. Splits on digit runs so initialisms
 * like WHS stay in body weight and are not mistaken for a number.
 */
const FIGURE_SPLIT = /(\p{Nd}[\p{Nd}.,\u00A0\u202F\u2009]*)/gu;
const HAS_DIGIT = /\p{Nd}/u;
const emphasiseFigures = (sentence: string): React.ReactNode[] =>
  sentence.split(FIGURE_SPLIT).map((part, i) =>
    HAS_DIGIT.test(part) ? (
      <span
        key={i}
        style={{ color: INK, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );



interface StatBrowseProps {
  /** Open the course directory sheet — owned by the parent. */
  onOpenDirectory: (country: string | null) => void;
}

/**
 * Scanning aid inside the dropdowns only - never in the headline copy.
 * Icons follow the MEANING of each lens: toughest / scoreable are opposites
 * and read as a pair, and `chase` reuses the Crown that marks a course record
 * everywhere else in the app.
 */
const LENS_ICON: Record<StatLens, LucideIcon> = {
  toughest: TrendingUp,
  scoreable: TrendingDown,
  played: Users,
  longest: Ruler,
  rated: Star,
  chase: Crown,
};

/** Dropdown icon geometry — mirrors Discover's quiet Everywhere control. */
const DD_ICON = { size: 12, strokeWidth: 2.4, 'aria-hidden': true } as const;

function LensIcon({ lens }: { lens: StatLens }) {
  const Icon = LENS_ICON[lens];
  return <Icon {...DD_ICON} />;
}



/** Short list labels for the verdict explainer sheet. */
const LIST_LABEL: Record<string, string> = {
  global: 'Global',
  'gb-i': 'GB&I',
  usa: 'USA',
  europe: 'Europe',
};

/**
 * SelectTrigger's base carries `[&>span]:line-clamp-1`, which sets
 * `display:-webkit-box` on our direct child span and kills its `flex` — the
 * icon then stacks ABOVE the label. Every trigger here re-asserts the row.
 */
/**
 * The 5px band between cards. Same convention as the feed, declared locally
 * on purpose: that is a different feature and must not become a dependency of
 * this one. The locality decision survives the dark migration.
 */
const CARD_BAND = 'rgba(255,255,255,0.06)';

/** Discover's Everywhere trigger geometry, kept full-width inside the Courses
 * row so area and region remain an equal 50/50 pair. */
const WELL_TRIGGER_CLS =
  'flex h-auto w-full border-0 p-0 shadow-none focus:ring-0 disabled:opacity-100 ' +
  '[&>span]:!flex [&>svg]:hidden';

/** The lens uses the same trigger at its natural content width. */
const WELL_TRIGGER_AUTO_CLS =
  'inline-flex h-auto w-auto max-w-full border-0 p-0 shadow-none focus:ring-0 ' +
  '[&>span]:!flex [&>svg]:hidden';

const wellStyle = (applied: boolean): React.CSSProperties => ({
  background: applied ? 'rgba(255,255,255,0.14)' : A.PANEL,
  border: `1px solid ${A.BORDER}`,
  borderRadius: 8,
  padding: '8px 12px',
  color: applied ? INK : INK_MUTE,
});

const triggerLabelStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  letterSpacing: '-0.01em',
};

const menuStyle: React.CSSProperties = {
  background: SURFACE,
  borderColor: HAIRLINE_INK_10,
  color: INK,
};


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
   *   1. ?lens= URL param (if a known lens id) — an EXPLICIT choice, never
   *      reassigned and never disabled, even when it returns no rows.
   *   2. otherwise 'rated', resolved against the facet counts for the current
   *      area so a DEFAULTED lens never lands on a dead combination. The
   *      resolution is never written to the URL: it must keep following the
   *      data as the member changes area.
   */
  const urlLens = searchParams.get('lens');
  const lensExplicit = isStatLens(urlLens);

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

  const countryEntry = facets?.countries.find((c) => c.sub_country === country) ?? null;
  const regionEntry =
    country && region
      ? facets?.regions.find((r) => r.sub_country === country && r.region === region) ?? null
      : null;

  /**
   * Lens availability for the CURRENT scope: region entry, else country entry,
   * else the platform-wide counts. Counts come from get_stat_browse_facets —
   * see the drift-trap note in useStatBrowse.ts. FAILS OPEN: unsettled facets
   * or a pre-lens_counts cached payload leave every lens selectable.
   * Derives from country/region only — never from `lens` — so the resolved
   * default below can read it without a cycle.
   */
  const scopeLensCounts: LensCounts | null = region
    ? regionEntry?.lens_counts ?? null
    : country
      ? countryEntry?.lens_counts ?? null
      : facets?.lens_counts_all ?? null;

  const lens: StatLens = lensExplicit
    ? urlLens
    : scopeLensCounts && (scopeLensCounts.rated ?? 0) === 0
      ? STAT_LENSES.find((l) => (scopeLensCounts[l] ?? 0) > 0) ?? 'rated'
      : 'rated';


  const { rows, totalCount, isLoading, isPaging, loadMore } = useStatBrowseList({
    lens,
    country,
    region,
  });

  /* ── Review slots (BRIEF_REVIEWS_TO_COURSES_AND_TOUR_REMOVAL) ───── */
  /**
   * A review is decision content, so it lives where the decision is made. The
   * pool follows COUNTRY and REGION only — the lens is an ordering and a review
   * is not ordered by toughness, so changing the lens must not change which
   * reviews appear. Placement and consumption are pure (reviewSlots.ts): the
   * same list length yields the same slots in the same places on every load,
   * which is what keeps scroll restoration honest.
   */
  const { pool: reviewPool } = useBrowseReviews(country, region);
  const reviewSlots = useMemo(
    () => allocateReviewSlots(reviewPool, rows.length),
    [reviewPool, rows.length],
  );
  const [reviewsSheet, setReviewsSheet] = useState(false);
  const openReviewSheet = useReviewSheetStore((s) => s.open);
  const openReviewsSheet = useCallback(() => {
    analyticsEvents.track('stat_browse_reviews_sheet_open', {
      country,
      region,
      pool: reviewPool.length,
    });
    setReviewsSheet(true);
  }, [country, region, reviewPool.length]);
  /** Inside the sheet a tile opens the single review, exactly as on Discover. */
  const handleReviewTile = useCallback(
    (r: LatestReview) => {
      openReviewSheet({
        user: {
          id: r.userId ?? '',
          name: r.reviewerName,
          username: r.reviewerUsername ?? undefined,
          avatar: r.reviewerAvatar,
        },
        courseId: r.courseId,
        courseName: r.courseName,
        rating: r.rating,
        reviewId: r.reviewId,
        courseCountry: r.courseCountry,
        courseRegion: r.courseRegion,
        courseSubCountry: r.courseSubCountry,
        reviewText: r.quote,
        breakdown: r.breakdown,
      });
    },
    [openReviewSheet],
  );


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
  /**
   * Viewer status resolver — same shape as VirtualizedCourseList's, which is the
   * reference. Enrichment answers for ranked courses; the user-stats map covers
   * the unranked majority of this tab. Rated outranks played.
   */
  const yourRoundsMap = useUserStatsCourseMap();
  const viewerStatusFor = useCallback(
    (courseId: string): 'rated' | 'played' | null => {
      const data = enrichment.get(courseId);
      if (data?.ratedByYou) return 'rated';
      if ((data?.yourRounds ?? 0) > 0) return 'played';
      return (yourRoundsMap.get(courseId) ?? 0) > 0 ? 'played' : null;
    },
    [enrichment, yourRoundsMap],
  );
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

  const description = useMemo(
    () => t(`statBrowse.lens.${lens}.description`),
    [t, lens],
  );




  /**
   * Count sentence appended to the lens description: location, figures and a
   * single provenance phrase. Renders nothing until facets have landed — an
   * unresolved figure is not an absent figure, so no partial or zero counts.
   * A region that facets cannot resolve falls back to the country sentence.
   */
  const countSentence = useMemo(() => {
    if (!facets) return null;
    const plural = (n: number) => (n === 1 ? '_one' : '_other');

    if (country && region && regionEntry) {
      return t(`statBrowse.countRegion${plural(regionEntry.courses)}`, {
        count: formatNumber(regionEntry.courses),
        region,
        country,
      });
    }

    if (country) {
      if (!countryEntry) return null;
      return t(`statBrowse.countCountry${plural(countryEntry.courses)}`, {
        count: formatNumber(countryEntry.courses),
        total: formatNumber(countryEntry.directory_total),
        country,
      });
    }

    return t(`statBrowse.countAll${plural(facets.played_total)}`, {
      count: formatNumber(facets.played_total),
      total: formatNumber(facets.directory_total),
    });
  }, [t, facets, country, region, countryEntry, regionEntry]);

  const regionDisabled = !country || regionsForCountry.length <= 1;
  const remaining = Math.max(0, totalCount - rows.length);
  // eslint-disable-next-line settled/no-not-loading-empty-check -- useStatBrowseList owns a manual isLoading initialised to true, so it is never false before the first fetch.
  const showEmpty = !isLoading && rows.length === 0;

  /**
   * Why the list is empty. Derived from the FACET counts, never from the row
   * list: rows can be empty because the area has nothing tracked (case a) or
   * because the area has tracked courses and none satisfies the active lens
   * (case b, e.g. Best rated needs a review). Until facets land the cause is
   * UNKNOWN and neither empty state may render — an empty state is a claim
   * about the data.
   */
  const trackedInArea = region
    ? regionEntry?.courses ?? null
    : country
      ? countryEntry?.courses ?? null
      : facets?.played_total ?? null;
  const areaHasTracked = facets == null || trackedInArea == null ? null : trackedInArea > 0;




  const lensUnavailableReason = useCallback(
    (l: StatLens): string | null => {
      // The current selection is never disabled: hiding or greying it would
      // break the Radix trigger label and silently reassign the member's view.
      if (l === lens) return null;
      if (!scopeLensCounts) return null;
      if ((scopeLensCounts[l] ?? 0) > 0) return null;
      if (l === 'rated' || l === 'longest' || l === 'chase') {
        return t(`statBrowse.lensUnavailable.${l}`);
      }
      // played/toughest/scoreable cannot be 0 while the area has courses.
      return t('statBrowse.lensUnavailable.nothing');
    },
    [lens, scopeLensCounts, t],
  );



  const countryTriggerLabel = country ?? t('statBrowse.allAreas');

  /**
   * Area items grouped by macro-region (facets.countries[].country). Groups are
   * ordered by their largest member's course count DESC, never alphabetically.
   * Within a group the RPC's own order is preserved. Entries with a missing
   * country (e.g. a cached payload predating the RPC change) fall into a final
   * unlabelled group.
   */
  const countryGroups = useMemo(() => {
    type Entry = NonNullable<typeof facets>['countries'][number];
    const entries: Entry[] = facets?.countries ?? [];
    const map = new Map<string, Entry[]>();
    entries.forEach((c) => {
      const key = c.country || '';
      const list = map.get(key);
      if (list) list.push(c);
      else map.set(key, [c]);
    });
    return [...map.entries()]
      .map(([countryKey, list]) => ({
        country: countryKey,
        entries: list,
        peak: list.reduce((m, e) => Math.max(m, e.courses), 0),
      }))
      .sort((a, b) => {
        if (!a.country) return 1;
        if (!b.country) return -1;
        return b.peak - a.peak;
      });
  }, [facets]);

  const countrySelect = (_compact: boolean) => (
    <Select value={country ?? 'all'} onValueChange={onCountryChange}>
      <SelectTrigger
        className={WELL_TRIGGER_CLS}
        style={wellStyle(!!country)}
        aria-label={t('statBrowse.selectCountryA11y')}
      >
        <span className="flex w-full items-center" style={{ gap: 6 }}>
          <Globe {...DD_ICON} />
          <span className="truncate flex-1 min-w-0" style={triggerLabelStyle}>{countryTriggerLabel}</span>
          <ChevronDown {...DD_ICON} style={{ color: INK_FAINT }} />
        </span>
      </SelectTrigger>
      <SelectContent className="z-50 max-h-[60vh] rounded-sq-sm shadow-lg" style={menuStyle}>
        <SelectItem value="all" className="[&>span:last-child]:w-full" style={{ color: INK }}>
          <span className="flex w-full items-center gap-2">
            <Globe {...DD_ICON} />
            <span className="flex-1 min-w-0 truncate">{t('statBrowse.allAreas')}</span>
          </span>
        </SelectItem>
        {countryGroups.map((g) => (
          <SelectGroup key={g.country || '__ungrouped'}>
            {g.country ? (
              <SelectLabel className="flex w-full items-center py-2 pl-8 pr-2">
                <span style={LABEL}>{g.country}</span>
              </SelectLabel>
            ) : null}
            {g.entries.map((c) => (
              <SelectItem
                key={c.sub_country}
                value={c.sub_country}
                className="[&>span:last-child]:w-full"
                style={{ color: INK }}
              >
                <span className="flex w-full items-center gap-2">
                  <CountryFlag country={c.sub_country} size="sm" />
                  <span className="flex-1 min-w-0 truncate">{c.sub_country}</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>

    </Select>
  );

  const regionSelect = (_compact: boolean) => (
    <Select value={region ?? 'all'} onValueChange={onRegionChange} disabled={regionDisabled}>
      <SelectTrigger
        className={WELL_TRIGGER_CLS}
        style={regionDisabled
          ? { ...wellStyle(false), opacity: 0.55, color: INK_FAINT }
          : wellStyle(!!region)}
        aria-label={t('statBrowse.selectRegionA11y')}
      >
        <span className="flex w-full items-center" style={{ gap: 6 }}>
          <span className="truncate flex-1 min-w-0" style={triggerLabelStyle}>
            {regionDisabled
              ? t('statBrowse.allRegions')
              : region ?? (country ? t('statBrowse.allOf', { country }) : t('statBrowse.allRegions'))}
          </span>
          <ChevronDown {...DD_ICON} style={{ color: INK_FAINT }} />
        </span>
      </SelectTrigger>
      <SelectContent className="z-50 max-h-[60vh] rounded-sq-sm shadow-lg" style={menuStyle}>
        <SelectGroup>
          <SelectLabel
            className="sticky top-0 z-10 flex w-full items-center py-2 pl-8 pr-2"
            style={{
              borderBottom: `1px solid ${HAIRLINE_INK_8}`,
              backgroundColor: 'hsl(var(--card))',
            }}
          >
            <span style={LABEL}>{t('statBrowse.colRegion')}</span>
          </SelectLabel>
          <SelectItem value="all" className="[&>span:last-child]:w-full" style={{ color: INK }}>
            <span className="flex w-full items-center gap-2">
              <span className="flex-1 min-w-0 truncate">
                {country ? t('statBrowse.allOf', { country }) : t('statBrowse.allRegions')}
              </span>
            </span>
          </SelectItem>
          {regionsForCountry.map((r) => (
            <SelectItem key={r.region} value={r.region} className="[&>span:last-child]:w-full" style={{ color: INK }}>
              <span className="flex w-full items-center gap-2">
                <span className="flex-1 min-w-0 truncate">{r.region}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  const lensSelect = (_compact: boolean) => (
    <Select value={lens} onValueChange={(v) => onLensChange(v as StatLens)}>
      <SelectTrigger
        className={WELL_TRIGGER_AUTO_CLS}
        style={wellStyle(true)}
        aria-label={t('statBrowse.selectLensA11y')}
      >
        <span className="flex min-w-0 items-center" style={{ gap: 6 }}>
          <LensIcon lens={lens} />
          <span className="truncate" style={triggerLabelStyle}>{t(`statBrowse.lens.${lens}.label`)}</span>
          <ChevronDown {...DD_ICON} style={{ color: INK_FAINT }} />
        </span>
      </SelectTrigger>
      <SelectContent className="z-50 max-h-[60vh] rounded-sq-sm shadow-lg" style={menuStyle}>
        {/* Fixed order, nothing hidden or reordered: a lens with no qualifying
            course in this area is disabled with the reason beside it. */}
        {STAT_LENSES.map((l) => {
          const reason = lensUnavailableReason(l);
          return (
            <SelectItem key={l} value={l} disabled={!!reason} style={{ color: INK }}>
              <span className="flex items-center gap-2 w-full">
                <LensIcon lens={l} />
                <span style={{ opacity: reason ? 0.9 : 1 }}>
                  {t(`statBrowse.lens.${l}.label`)}
                </span>
                {reason ? (
                  <span style={{ ...LABEL, marginLeft: 'auto', paddingLeft: 10 }}>{reason}</span>
                ) : null}
              </span>
            </SelectItem>
          );
        })}

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
      className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} shrink-0 flex items-center justify-center`}
      style={{ background: A.PANEL, border: `1px solid ${A.BORDER}`, borderRadius: 8 }}
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
          // The bar now uses the canonical dark glass token. The light
          // translucent equivalent existed only while Courses was a light page.
          background: 'var(--glass-bg)',
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
            {/* Row 1: country and region are a genuine 50/50 pair. */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">{countrySelect(false)}</div>
              <div className="flex-1 min-w-0">{regionSelect(false)}</div>
            </div>

            {/* Row 2: toolbar — lens at its natural width, search at the end. */}
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">{lensSelect(false)}</div>
              {directorySearchButton(false)}
            </div>


          </>
        )}
      </div>

      {/* ── Headline ────────────────────────────────────────────── */}
      <div className="pt-4">

        <div
          style={{
            ...KICKER,
          }}
        >
          {t('statBrowse.eyebrow')}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, marginTop: 4 }}>
          {t(`statBrowse.lens.${lens}.title`)}
        </h2>
        <p style={{ fontSize: 12.5, color: INK_MUTE, marginTop: 4, lineHeight: 1.45 }}>
          {description}
          {countSentence ? emphasiseFigures(countSentence) : null}

        </p>
      </div>

      {/* ── List ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="mt-4 -mx-4 space-y-2 sm:space-y-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-full aspect-[16/9.5] animate-pulse"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          ))}
        </div>
      ) : showEmpty && areaHasTracked === null ? null : showEmpty &&
        areaHasTracked &&
        lens !== 'played' ? (

        /* Case (b): the area HAS tracked courses, none satisfies this lens.
           No Connect CTA — the handicap is what produced the tracked round. */
        <div className="mt-6 text-center">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: INK }}>
            {t('statBrowse.empty.lensTitle', { lens: t(`statBrowse.lens.${lens}.label`) })}
          </h3>
          <p
            style={{
              fontSize: 13,
              color: INK_MUTE,
              marginTop: 4,
              lineHeight: 1.5,
              maxWidth: 320,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {country
              ? t('statBrowse.empty.lensBody', {
                  count: trackedInArea ?? 0,
                  formatted: formatNumber(trackedInArea ?? 0),
                  country,
                })
              : t('statBrowse.empty.lensBodyAll', {
                  count: trackedInArea ?? 0,
                  formatted: formatNumber(trackedInArea ?? 0),
                })}
          </p>
          {/* 'played' has no eligibility filter, so it is guaranteed to have
              rows whenever the area has tracked courses. */}
          <button
            type="button"
            onClick={() => onLensChange('played')}
            className="w-full mt-4 h-11 rounded-xl text-[14px] font-bold"
            style={{ background: INK, color: '#15171F' }}
          >
            {country
              ? t('statBrowse.empty.lensSwitch', { country })
              : t('statBrowse.empty.lensSwitchAll')}
          </button>
          {country ? (

            <button
              type="button"
              onClick={() => openDirectory(country, 'empty_state')}
              className="w-full mt-2 h-11 rounded-xl text-[14px] font-semibold"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE_INK_10}`, color: INK }}
            >
              {t('statBrowse.empty.browse', { country })}
            </button>
          ) : null}
        </div>
      ) : showEmpty ? (
        country ? (

          <div
            className="mt-4 p-5"
            style={{
              background: 'rgba(247,147,30,0.10)',
              border: `1px solid rgba(247,147,30,0.42)`,
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: 28, lineHeight: 1 }}>
              <CountryFlag country={country} size="lg" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: INK, marginTop: 10 }}>
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
        <div className="mt-4 -mx-4">
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
                  viewerStatus={viewerStatusFor(row.course_id)}
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
                {/*
                  BETWEEN items only — index against length, never :last-child,
                  because this list appends pages and a trailing band would
                  flash during load. Single stack at every width, so it is
                  unconditional.
                */}
                {i < rows.length - 1 && (
                  <div aria-hidden style={{ height: 5, background: CARD_BAND }} />
                )}

                {/*
                  REVIEW SLOT (BRIEF_REVIEWS_TO_COURSES_AND_TOUR_REMOVAL §3).
                  Full-bleed between two 5px bands: the band above is the one
                  the card just drew, the band below is drawn here, so the
                  list's rhythm is unbroken. Only rendered when a card follows,
                  for the same reason the band is.
                */}
                {i < rows.length - 1 && reviewSlots.get(i + 1) ? (
                  <>
                    {reviewSlots.get(i + 1)!.kind === 'rail' ? (
                      <ReviewRailSlot
                        reviews={reviewSlots.get(i + 1)!.reviews}
                        onReviewPress={handleReviewTile}
                      />
                    ) : (
                      <ReviewFeaturedSlot
                        review={reviewSlots.get(i + 1)!.reviews[0]}
                        onReviewPress={handleReviewTile}
                      />
                    )}

                    <div aria-hidden style={{ height: 5, background: CARD_BAND }} />
                  </>
                ) : null}
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

      {/* The SHIPPED reviews sheet, reused from Discover unchanged. Opened by
          a slot's see-all and by tapping a review in a slot. It carries the
          scoped pool, so a filtered browse opens a filtered sheet. */}
      <LatestReviewsSheet
        open={reviewsSheet}
        onClose={() => setReviewsSheet(false)}
        reviews={reviewPool}
        totalCount={reviewPool.length}
        viewerId={user?.id}
        onTilePress={handleReviewTile}
      />
    </div>
  );
};

export default StatBrowse;
