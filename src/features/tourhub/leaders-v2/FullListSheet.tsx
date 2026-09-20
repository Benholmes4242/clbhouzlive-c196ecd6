import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CatalogueSearchField } from '@/components/ui/CatalogueSearchField';
import CountryFlag from '@/components/ui/country-flag';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { AMBER, FONT, INK, INK_MUTE, SLATE_50, WHITE_ALPHA_06 } from '../_shared/tokens';
import type { LeaderCategoryDef } from './data/useLeaderCategories';
import type { LivePlayerMap } from '../players-v2/data/useLivePlayerIds';

export interface FullListSheetProps { open: boolean; onClose: () => void; category: LeaderCategoryDef | null; liveMap: LivePlayerMap; tourLabel: string; year: number; }

export function FullListSheet({ open, onClose, category, tourLabel, year }: FullListSheetProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 200);
  const rows = category?.rows ?? [];
  const fieldRows = rows.slice(1);
  useEffect(() => setQuery(''), [category?.key]);
  const filtered = useMemo(() => {
    const value = debounced.trim().toLowerCase();
    return value ? fieldRows.filter((row) => row.name.toLowerCase().includes(value)) : fieldRows;
  }, [debounced, fieldRows]);
  const selectPlayer = useCallback((playerId: string, rank: number, tied: boolean) => {
    if (!playerId || !category) return;
    analyticsEvents.track('tour_leaders_sheet_player_tapped', { category: category.key, player_id: playerId, rank, tied, tour: tourLabel });
    onClose();
    setTimeout(() => navigate(`/tourhub/player/${playerId}`), 60);
  }, [category, navigate, onClose, tourLabel]);
  if (!category) return null;
  const leader = rows[0];
  const unit = t(category.unitKey).toLowerCase();
  const gapUnit = unit === 'avg' || unit === 'sg' ? 'shots' : unit === 'yds' ? 'yards' : unit;
  return <BottomSheet open={open} onClose={onClose} ariaLabelledBy="tour-leaders-full-sheet-title" style={{ maxHeight: '85dvh', display: 'flex', flexDirection: 'column', background: SLATE_50, fontFamily: FONT }}>
    <header style={{ flexShrink: 0, padding: '12px 24px 16px', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}>
      <p style={{ margin: 0, color: INK_MUTE, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{tourLabel} · {year}</p>
      <h2 id="tour-leaders-full-sheet-title" style={{ margin: '6px 0 0', color: INK, fontSize: 25, lineHeight: 1.05, fontWeight: 850 }}>{t(category.labelKey)}</h2>
      <p style={{ margin: '8px 0 0', color: INK_MUTE, fontSize: 12, lineHeight: 1.45 }}>{t(category.descriptionKey, { defaultValue: t('leaders.season.categoryDescription') })}</p>
      {leader ? <div style={{ marginTop: 16, padding: '13px 16px', background: 'rgba(247,147,30,0.10)', borderLeft: `3px solid ${AMBER}`, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}><span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ minWidth: 0, color: A.INK, fontSize: 14, fontWeight: 800, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{leader.name}</span>{leader.countryCode || leader.country ? <CountryFlag country={leader.countryCode || leader.country} size="sm" /> : null}</span><span style={{ color: AMBER, fontSize: 18, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{leader.valueFormatted}</span></div> : null}
      {rows.length > 12 ? <div style={{ marginTop: 12 }}><CatalogueSearchField value={query} onChange={setQuery} placeholder={t('leaders.sheet.searchPlaceholder')} /></div> : null}
    </header>
    <div style={{ overflowY: 'auto', minHeight: 0 }}>
      {filtered.map((row, index) => <button key={row.playerId || `${row.name}-${row.rank}`} type="button" onClick={() => selectPlayer(row.playerId, row.rank, row.tied)} style={{ width: '100%', minHeight: 76, padding: '13px 24px', display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', alignItems: 'center', gap: 10, border: 0, borderBottom: index === filtered.length - 1 ? 'none' : `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}><span style={{ color: INK_MUTE, fontSize: 11, fontWeight: 800 }}>{row.rankLabel}</span><span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ minWidth: 0, color: INK, fontSize: 14, fontWeight: 750, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{row.name}</span>{row.countryCode || row.country ? <CountryFlag country={row.countryCode || row.country} size="sm" /> : null}</span><span style={{ textAlign: 'right' }}><span style={{ display: 'block', color: INK, fontSize: 17, fontWeight: 850 }}>{row.valueFormatted}</span>{category.meaningfulBehind && row.behindFormatted ? <span style={{ color: INK_MUTE, fontSize: 9, fontWeight: 750 }}>{row.behindFormatted} {gapUnit} back</span> : null}</span></button>)}
      {!filtered.length ? <p style={{ padding: 28, color: INK_MUTE, textAlign: 'center', fontSize: 12 }}>{t('leaders.sheet.noMatch', { shown: rows.length, pool: category.poolSize })}</p> : null}
    </div>
  </BottomSheet>;
}