import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { TourPageShell } from '../components/TourPageShell';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';
import { useLeaderCategories, type LeaderCategoryDef } from './data/useLeaderCategories';
import { FullListSheet } from './FullListSheet';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { AMBER, FONT, INK, INK_MUTE, WHITE_ALPHA_06 } from '../_shared/tokens';
import { FIELD_PAINT_RAISED_CLASS } from '@/lib/tokens/field';
import { TourPickerSheet } from '../components/TourPickerSheet';
import { useTourLensFromPicker } from '../hooks/useTourLensFromPicker';
import { ChevronDown } from 'lucide-react';
import { NAV_CLEARANCE } from '@/lib/navClearance';

const GROUPS: LeaderCategoryDef['group'][] = ['season', 'scoring', 'tee', 'approach', 'putting', 'strokesGained', 'ranking'];

export function SeasonStatsIndex() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const requested = params.get('tour');
  const initialTour: TourId = requested && requested in TOUR_CONFIG && requested !== 'champ' ? requested as TourId : 'pga';
  const [tour, setTour] = useState<TourId>(initialTour);
  const [pickerOpen, setPickerOpen] = useState(false);
  const applyTour = useCallback((next: TourId) => { setTour(next); navigate(`/tourhub/season-stats?tour=${next}`, { replace: true }); }, [navigate]);
  useTourLensFromPicker<TourId>((slug) => slug !== 'champ' && slug in TOUR_CONFIG ? slug as TourId : undefined, applyTour, tour);
  const { data, isLoading } = useLeaderCategories(tour);
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Earnings is excluded from magazine-module selection, not from this measured index.
  const categories = useMemo(() => data?.categories ?? [], [data?.categories]);
  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? categories.filter((category) => `${t(category.labelKey)} ${category.rows[0]?.name ?? ''}`.toLowerCase().includes(search)) : categories;
  }, [categories, query, t]);
  const active = categories.find((category) => category.key === openKey) ?? null;
  const tourLabel = t(`leaders.tourChip.${tour}`);
  const lens = <button type="button" onClick={() => setPickerOpen(true)} aria-label={tourLabel} style={{ height: 30, padding: '0 11px', display: 'inline-flex', alignItems: 'center', gap: 5, border: `1px solid ${WHITE_ALPHA_06}`, borderRadius: 999, background: A.PANEL, color: A.INK, fontSize: 12, fontWeight: 750, cursor: 'pointer' }}>{tourLabel}<ChevronDown size={14} /></button>;
  return <TourPageShell title={t('leaders.index.title')} backFallback="/tourhub?tab=leaderboards" leftAccessory={lens}>
    <main style={{ minHeight: '100vh', paddingBottom: NAV_CLEARANCE, background: A.CANVAS, fontFamily: FONT }}>
      <header style={{ padding: '28px 24px 20px', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}><p style={{ margin: 0, color: AMBER, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('leaders.index.kicker')}</p><h1 style={{ margin: '7px 0 0', color: INK, fontSize: 32, lineHeight: 1, fontWeight: 900 }}>{t('leaders.index.title')}</h1><p style={{ margin: '10px 0 0', color: INK_MUTE, fontSize: 12 }}>{t('leaders.index.standfirst')}</p><label className={FIELD_PAINT_RAISED_CLASS} style={{ marginTop: 18, height: 40, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Search size={15} color={INK_MUTE} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('leaders.index.search')} style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: INK, fontSize: 13 }} /></label></header>
      {isLoading ? <p style={{ padding: 24, color: INK_MUTE }}>{t('leaders.index.loading')}</p> : !visible.length ? <TourHubEmptyState variant="leaderboard" /> : GROUPS.map((group) => { const grouped = visible.filter((category) => category.group === group); if (!grouped.length) return null; return <section key={group}><h2 style={{ margin: 0, padding: '24px 24px 8px', color: INK_MUTE, fontSize: 10, fontWeight: 850, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t(`leaders.index.groups.${group}`)}</h2>{grouped.map((category, index) => { const leader = category.rows[0]; return <button key={category.key} type="button" onClick={() => setOpenKey(category.key)} style={{ width: '100%', minHeight: 76, padding: '13px 24px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 16, alignItems: 'center', border: 0, borderBottom: index === grouped.length - 1 ? 'none' : `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}><span style={{ minWidth: 0 }}><span style={{ display: 'block', color: INK, fontSize: 14, fontWeight: 800 }}>{t(category.labelKey)}</span><span style={{ display: 'block', marginTop: 5, color: INK_MUTE, fontSize: 11, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{leader?.name ?? ''}</span></span><span style={{ color: A.INK, fontSize: 17, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{leader?.valueFormatted ?? ''}</span></button>; })}</section>; })}
    </main>
    <FullListSheet open={Boolean(active)} onClose={() => setOpenKey(null)} category={active} liveMap={{}} tourLabel={tour.toUpperCase()} year={data?.year ?? new Date().getFullYear()} />
    <TourPickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} />
  </TourPageShell>;
}

export default SeasonStatsIndex;