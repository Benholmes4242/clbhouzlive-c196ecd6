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
import { A, DISCOVER_FACT, DISCOVER_QUIET, LABEL, SANS } from './tokens';
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

/** "No rounds from your circle this week." — one honest sentence per scope (§S2.5). */
export function scopeEmptyKey(scope: WeekScope): { key: string; fallback: string } {
  switch (scope) {
    case 'circle':
      return {
        key: 'discover.week.empty.circle',
        fallback: 'No rounds from your circle this week.',
      };
    case 'suggested':
      return {
        key: 'discover.week.empty.suggested',
        fallback: 'No suggested rounds this week.',
      };
    case 'top_100':
      return {
        key: 'discover.week.empty.top100',
        fallback: 'No Top 100 rounds this week.',
      };
    case 'played':
      return {
        key: 'discover.week.empty.played',
        fallback: 'No rounds at your courses this week.',
      };
    case 'worldwide':
    default:
      return { key: 'discover.week.empty.worldwide', fallback: 'No rounds this week.' };
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
    <div style={{ flex: 'none', ...style }}>
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
        {/* A QUIET INLINE CONTROL, NOT A FIELD (§S1.3): no border, no
            background, no padding box. And NO COUNT (§S1.2) — the readout to
            its left already states how many rounds are rendered.

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
          className="inline-flex h-auto w-auto justify-start gap-0 whitespace-nowrap border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>span]:!flex [&>svg]:hidden"
          style={{ color: DISCOVER_QUIET, fontFamily: SANS, padding: '4px 0' }}
          aria-label={t('discover.week.selectRegionA11y', 'Filter rounds by area')}
        >
          <span className="flex min-w-0 items-center" style={{ gap: 4 }}>
            <MapPin size={12} strokeWidth={2.4} style={{ color: DISCOVER_QUIET, flex: 'none' }} />
            <span
              style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.01em', color: DISCOVER_QUIET }}
            >
              {triggerLabel}
            </span>
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
