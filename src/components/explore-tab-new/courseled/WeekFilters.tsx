import { useTranslation } from 'react-i18next';
import { ChevronDown, MapPin } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select';
import { A, DISCOVER_FACT, DISCOVER_QUIET, LABEL, SANS, SCOPE_PILL_RADIUS } from './tokens';
import { PillFilterRow } from './PillFilterRow';
import { WEEK_SCOPES, type WeekScope } from './hooks/useGolfThisWeek';
import type { RegionSelection, WeekRegions } from './hooks/useWeekRegionCounts';

/**
 * THE ROUNDS SECTION'S FILTERS (BRIEF_MERGE_CIRCLE_AND_GOLF_THIS_WEEK §S2/§S3).
 *
 * SCOPE IS PILLS, GEOGRAPHY IS A DROPDOWN. Two axes, two controls, one row: the
 * scope is a short closed list a member flicks through, geography is a long list
 * where the honest answer is usually "nowhere this week" and so must carry its
 * COUNT on every row (§S3.2) with zero rows greyed and unselectable (§S3.3).
 *
 * Both are the existing chrome: the pills are the retired ScopePills' pill, the
 * dropdown is the Courses browse's shadcn Select. Nothing new is designed.
 *
 * CANON RECORDED (MICRO_BRIEF_REGION_WELL_TRUNCATES §0). Written down here
 * because a canon that lives only in chat is how input.tsx stayed light through
 * five migrations.
 *
 * §0.1 THE SCOPE PILLS ARE CANONICAL. PillFilterRow.tsx is the app's
 * filter-pill treatment: A.PANEL fill, A.BORDER hairline, SCOPE_PILL_RADIUS
 * (8), 8px 14px padding, 12.5/700 type; the selected pill INVERTS to an A.INK
 * fill with an A.PANEL label. It has two consumers already (week scope, media
 * type) and IS NOT TO BE FORKED — add an option, not a second pill.
 *
 * §0.2 THE REGION WELL IS THE CANONICAL FILTER-BAR CONTROL, as shipped by
 * MICRO_BRIEF_DISCOVER_REGION_WELL: a filled well with a hairline, its radius
 * matched to the pill directly beneath it, an applied state that brightens BOTH
 * the fill and the label, and a chevron that stays quiet in either state.
 *
 * §0.3 SIZING. The well sizes to its CONTENT up to the space available; past
 * that it TRUNCATES its place name with an ellipsis. It does not wrap, and the
 * row it sits on does not wrap either. Wrapping was the previous escape hatch
 * and it did not look deliberate.
 */

const ALL = '__all__';

export function WeekScopePills({
  scope,
  onChange,
  style,
}: {
  scope: WeekScope;
  onChange: (s: WeekScope) => void;
  style?: React.CSSProperties;
}) {
  const { t } = useTranslation('courses');
  return (
    <PillFilterRow
      value={scope}
      onChange={onChange}
      ariaLabel={t('discover.week.scopeAria', 'Rounds scope')}
      style={style}
      options={WEEK_SCOPES.map((id) => ({
        value: id,
        label: t(scopeLabelKey(id).key, scopeLabelKey(id).fallback),
      }))}
    />
  );
}

export function scopeLabelKey(scope: WeekScope): { key: string; fallback: string } {
  switch (scope) {
    case 'circle':
      return { key: 'discover.week.scope.circle', fallback: 'Your Circle' };
    case 'suggested':
      return { key: 'discover.week.scope.suggested', fallback: 'Suggested' };
    case 'top_100':
      return { key: 'discover.week.scope.top100', fallback: 'Top 100' };
    case 'played':
      return { key: 'discover.week.scope.played', fallback: 'Played' };
    case 'worldwide':
    default:
      return { key: 'discover.week.scope.worldwide', fallback: 'Worldwide' };
  }
}

/** "No rounds from your circle in the last 14 days." — one sentence per scope (§S2.5). */
export function scopeEmptyKey(scope: WeekScope): { key: string; fallback: string } {
  switch (scope) {
    case 'circle':
      return {
        key: 'discover.week.empty.circle',
        fallback: 'No rounds from your circle in the last 14 days.',
      };
    case 'suggested':
      return {
        key: 'discover.week.empty.suggested',
        fallback: 'No suggested rounds in the last 14 days.',
      };
    case 'top_100':
      return {
        key: 'discover.week.empty.top100',
        fallback: 'No Top 100 rounds in the last 14 days.',
      };
    case 'played':
      return {
        key: 'discover.week.empty.played',
        fallback: 'No rounds at your courses in the last 14 days.',
      };
    case 'worldwide':
    default:
      return { key: 'discover.week.empty.worldwide', fallback: 'No rounds in the last 14 days.' };
  }
}

export function RegionDropdown({
  regions,
  selection,
  onChange,
  style,
}: {
  regions: WeekRegions;
  selection: RegionSelection | null;
  onChange: (sel: RegionSelection | null) => void;
  style?: React.CSSProperties;
}) {
  const { t } = useTranslation('courses');

  const value = selection ? `${selection.kind}:${selection.value}` : ALL;
  const triggerLabel = selection
    ? selection.value
    : t('discover.week.allRegions', 'Everywhere');

  return (
    // flex: '0 1 auto' + minWidth: 0, NOT flex: 'none'. flex: none is
    // 0 0 auto, which forbids shrinking outright: with it the well could never
    // give up width and the row had to wrap instead. Sized to content, allowed
    // to shrink, never allowed to grow.
    <div style={{ flex: '0 1 auto', minWidth: 0, ...style }}>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v === ALL) {
            onChange(null);
            return;
          }
          const [kind, ...rest] = v.split(':');
          onChange({ kind: kind as RegionSelection['kind'], value: rest.join(':') });
        }}
      >
        {/* A FILLED WELL CONTROL, NOT A QUIET INLINE LABEL (§S1.3 OVERTURNED):
            the control sits directly above WeekScopePills, which renders a
            filled bordered pill at PillFilterRow.tsx:50-53. Both are filters on
            the same section, 12px apart, and only one of them looked tappable.
            Quiet was the right instinct for a control paired with prose; it
            stopped being right once a boxed control landed underneath it.

            WHY THE FIRST ATTEMPT DID NOT LAND (CORRECTION §S1.4): shadcn's
            SelectTrigger base class carries TWO rules that beat a child's own
            styles —
              justify-between   pushed its built-in chevron to the far right,
                                detached from the label; and
              [&>span]:line-clamp-1  sets the direct child span to
                                -webkit-box, which OVERRODE our flex and stacked
                                the pin above the label.
            So the fix is not a wrapper: the base chevron is HIDDEN
            ([&>svg]:hidden), justify-start replaces justify-between, and the
            inner span is forced back to flex. Pin, label and chevron are then
            three children of ONE inline flex line, 4px apart, sharing a
            baseline — no absolute positioning, no marginLeft auto. */}
        <SelectTrigger
          /* max-w-full min-w-0 replace w-auto so the trigger can shrink below
             its content width; whitespace-nowrap STAYS — it turns the overflow
             into an ellipsis, not a second line inside the well. */
          className="inline-flex h-auto max-w-full min-w-0 justify-start whitespace-nowrap border-0 shadow-none focus:ring-0 [&>span]:!flex [&>svg]:hidden"
          style={{
            background: selection ? 'rgba(255,255,255,0.14)' : A.PANEL,
            border: `1px solid ${A.BORDER}`,
            borderRadius: SCOPE_PILL_RADIUS,
            /* COLLAPSED AT "Everywhere" (BRIEF_DISCOVER_REGION_WELL_ON_PILL_ROW):
               pin + chevron only, tighter side padding. The wrapper KEEPS
               flex '0 1 auto' — collapsed the control has no elastic child left,
               so the pills beside it absorb the row's pressure. */
            padding: selection ? '8px 12px' : '8px 10px',
            fontFamily: SANS,
            color: selection ? DISCOVER_FACT : DISCOVER_QUIET,
          }}
          aria-label={t('discover.week.selectRegionA11y', 'Filter rounds by area')}
        >
          <span className="flex min-w-0 items-center" style={{ gap: 4 }}>
            <MapPin
              size={12}
              strokeWidth={2.4}
              style={{ color: selection ? DISCOVER_FACT : DISCOVER_QUIET, flex: 'none' }}
            />
            {/* THE ONLY ELASTIC CHILD. The pin and the chevron are flex: none
                and never truncate — a control that loses its chevron stops
                looking like a dropdown. title carries the full name for a
                screen reader and as a native tooltip once the label clips. */}
            {selection && (
            <span
              title={triggerLabel}
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: selection ? DISCOVER_FACT : DISCOVER_QUIET,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {triggerLabel}
            </span>
            )}
            <ChevronDown size={13} strokeWidth={2.4} style={{ color: DISCOVER_QUIET, flex: 'none' }} />
          </span>
        </SelectTrigger>



        <SelectContent
          className="z-50 max-h-[60vh] rounded-sq-sm shadow-lg"
          style={{ background: A.PANEL, borderColor: A.BORDER, color: DISCOVER_FACT }}
        >
          <SelectItem value={ALL} style={{ color: DISCOVER_FACT }}>
            <span className="flex w-full items-center justify-between gap-3">
              <span className="truncate">{t('discover.week.allRegions', 'Everywhere')}</span>
              <span style={{ ...LABEL, color: DISCOVER_QUIET }}>{regions.total}</span>
            </span>
          </SelectItem>

          {regions.groups.map((g) => (
            <SelectGroup key={g.country}>
              <SelectLabel className="py-2 pl-8 pr-2">
                <span style={{ ...LABEL, color: DISCOVER_QUIET }}>
                  {t('discover.week.areaLabel', 'Area')}
                </span>
              </SelectLabel>
              {/* THE MACRO AREA IS SELECTABLE — "Britain & Ireland 16". */}
              <SelectItem value={`country:${g.country}`} disabled={g.count === 0} style={{ color: DISCOVER_FACT }}>
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="truncate">{g.country}</span>
                  <span style={{ ...LABEL, color: DISCOVER_QUIET }}>{g.count}</span>
                </span>
              </SelectItem>
              {g.subs.map((s) => (
                <SelectItem
                  key={`${g.country}:${s.sub_country}`}
                  value={`sub_country:${s.sub_country}`}
                  /* ZERO IS GREYED AND UNSELECTABLE (§S3.3) — it stays on the
                     list because its absence is the answer. */
                  disabled={s.count === 0}
                  style={{ color: DISCOVER_FACT }}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="truncate pl-2" style={{ color: DISCOVER_FACT }}>
                      {s.sub_country}
                    </span>
                    <span style={{ ...LABEL, color: DISCOVER_QUIET }}>{s.count}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default WeekScopePills;
