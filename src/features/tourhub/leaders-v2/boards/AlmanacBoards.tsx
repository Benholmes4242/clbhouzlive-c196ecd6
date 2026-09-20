import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { getDirectImageUrl } from '@/utils/r2ImageUtils';
import { OVERVIEW_HERO_HEIGHT } from '../../components/overview-v3/OverviewHero';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { surnameOf } from '../../_shared/playerName';
import { AMBER, INK_FAINT, INK_MUTE, SLATE_600, STATUS_LIVE, TREND_DOWN, TREND_UP, WHITE_ALPHA_06, WHITE_ALPHA_08, WHITE_ALPHA_30 } from '../../_shared/tokens';
import type { LeaderCategoryDef, LeaderRow } from '../data/useLeaderCategories';
import type { SeasonSubject } from '../seasonMagazine';

const sectionKicker: CSSProperties = { margin: 0, color: INK_FAINT, fontSize: 11, fontWeight: 800, letterSpacing: '0.17em', textTransform: 'uppercase' };
const sectionTitle: CSSProperties = { margin: '6px 0 0', color: A.INK, fontSize: 17, lineHeight: 1.25, fontWeight: 700, letterSpacing: '-0.015em' };
const copy: CSSProperties = { margin: 0, color: INK_MUTE, fontSize: 12.5, lineHeight: 1.4, letterSpacing: 0 };
const figure: CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };

function PlayerPortrait({ row, variant }: { row: LeaderRow; variant: 'lead' | 'number' | 'duel' }) {
  const candidates = useMemo(() => resolvePlayerAvatarCandidates({ name: row.name, photoUrl: row.photoUrl, tourSlug: row.tourCode }), [row.name, row.photoUrl, row.tourCode]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(candidates.length === 0);
  useEffect(() => { setCandidateIndex(0); setFailed(candidates.length === 0); }, [candidates]);
  const src = candidates[candidateIndex] ? getDirectImageUrl(candidates[candidateIndex]) : null;
  const frame: CSSProperties = variant === 'lead'
    ? { position: 'absolute', zIndex: 1, right: -14, bottom: 0, width: 235, height: 306, overflow: 'hidden' }
    : variant === 'number'
      ? { position: 'absolute', zIndex: 1, right: 16, top: '50%', width: 104, height: 104, borderRadius: 26, transform: 'translateY(-50%)', overflow: 'hidden' }
      : { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', flex: '0 0 auto' };
  return <div data-portrait={variant} style={{ ...frame, background: SLATE_600 }}>
    {!failed && src ? <img src={src} alt="" aria-hidden="true" loading={variant === 'lead' ? 'eager' : 'lazy'} onError={() => {
      if (candidateIndex + 1 < candidates.length) setCandidateIndex((current) => current + 1);
      else setFailed(true);
    }} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: variant === 'lead' ? 'right bottom' : 'center 20%' }} /> : null}
  </div>;
}

function categoryRow(categories: LeaderCategoryDef[], key: string, playerId: string): LeaderRow | null {
  return categories.find((category) => category.key === key)?.rows.find((row) => row.playerId === playerId) ?? null;
}

function Movement({ value }: { value: number | null }) {
  const { t } = useTranslation('tourhub');
  if (value == null) return null;
  if (value === 0) return <span style={{ color: INK_MUTE }}>{t('leaders.season.steady')}</span>;
  return <span style={{ color: value > 0 ? TREND_UP : TREND_DOWN }}>{value > 0 ? '↑' : '↓'} {Math.abs(value)}</span>;
}

function SectionHead({ category, titleKey = 'leaders.season.sectionTitle.generic' }: { category: LeaderCategoryDef; titleKey?: string }) {
  const { t } = useTranslation('tourhub');
  return <header style={{ padding: '22px 24px 10px' }}>
    <p style={sectionKicker}>{t(category.labelKey)}</p>
    <h2 style={sectionTitle}>{t(titleKey, { category: t(category.labelKey) })}</h2>
  </header>;
}

function CompactRow({ row, last, onPlayerClick }: { row: LeaderRow; last: boolean; onPlayerClick: (row: LeaderRow) => void }) {
  return <button type="button" onClick={() => onPlayerClick(row)} style={{ width: '100%', minHeight: 68, padding: '12px 0', border: 0, borderBottom: last ? 'none' : `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', alignItems: 'center', columnGap: 10, textAlign: 'left', cursor: 'pointer' }}>
    <span style={{ color: INK_MUTE, fontSize: 11, fontWeight: 800, ...figure }}>{row.rankLabel}</span>
    <span style={{ minWidth: 0 }}><span style={{ display: 'block', color: A.INK, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span><span style={{ display: 'block', marginTop: 4, fontSize: 10, fontWeight: 700 }}><Movement value={row.movement} /></span></span>
    <span style={{ textAlign: 'right' }}><span style={{ display: 'block', color: A.INK, fontSize: 17, fontWeight: 800, ...figure }}>{row.valueFormatted}</span>{row.behindFormatted ? <span style={{ display: 'block', marginTop: 2, color: INK_MUTE, fontSize: 9, fontWeight: 700 }}>+{row.behindFormatted}</span> : null}</span>
  </button>;
}

export function LeadModule({ category, subject, categories }: { category: LeaderCategoryDef; subject: SeasonSubject; categories: LeaderCategoryDef[] }) {
  const { t } = useTranslation('tourhub');
  const leader = category.rows[0];
  if (!leader) return null;
  const isPlayer = subject.kind === 'player';
  const wins = categoryRow(categories, 'wins', leader.playerId);
  const topTens = categoryRow(categories, 'top_10', leader.playerId);
  const scoring = categoryRow(categories, 'scoring_avg', leader.playerId);
  const changed = isPlayer && (leader.movement ?? 0) > 0;
  const headlineKey = isPlayer ? changed ? 'leaders.season.headline.changed' : 'leaders.season.headline.runaway' : 'leaders.season.headline.contested';
  const headline = t(headlineKey, { name: isPlayer ? surnameOf(leader.name) : leader.name });
  const standfirst = isPlayer
    ? t('leaders.season.evidence.player', { wins: wins?.valueFormatted ?? '−', topTens: topTens?.valueFormatted ?? '−', scoring: scoring?.valueFormatted ?? '−' })
    : t('leaders.season.evidence.race', { leader: leader.name, points: leader.valueFormatted });
  const proofs = isPlayer
    ? [{ value: leader.valueFormatted, label: t(category.unitKey) }, { value: wins?.valueFormatted ?? '−', label: t('leaders.stat.wins.short') }, { value: scoring?.valueFormatted ?? '−', label: t('leaders.stat.scoring_avg.short') }]
    : [{ value: category.rows[3]?.behindFormatted ?? '−', label: t('leaders.season.proof.topFour') }, { value: String(categories.find((item) => item.key === 'wins')?.rows.filter((row) => row.value > 0).length ?? 0), label: t('leaders.season.proof.winners') }, { value: '−', label: t('leaders.season.proof.remaining') }];
  return <section data-season-module="lead" style={{ height: OVERVIEW_HERO_HEIGHT, position: 'relative', overflow: 'hidden', background: SLATE_600, borderBottom: `1px solid ${WHITE_ALPHA_06}` }}>
    <PlayerPortrait row={leader} variant="lead" />
    <div aria-hidden="true" style={{ position: 'absolute', zIndex: 2, inset: 0, background: 'radial-gradient(120% 70% at 68% 12%, rgba(255,255,255,0.30), transparent 62%)' }} />
    <div aria-hidden="true" style={{ position: 'absolute', zIndex: 3, inset: 0, background: 'linear-gradient(to top, rgba(8,12,16,0.97) 6%, rgba(8,12,16,0.72) 38%, rgba(8,12,16,0.12) 72%, transparent 100%)' }} />
    <div style={{ position: 'absolute', zIndex: 4, right: 0, bottom: 0, left: 0, padding: '0 24px 20px' }}>
      <p style={{ margin: 0, color: STATUS_LIVE, fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{t('leaders.season.kicker')}</p>
      <h1 style={{ margin: '8px 0 0', maxWidth: 350, color: A.INK, fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.04 }}>{headline}</h1>
      <p style={{ margin: '10px 0 0', maxWidth: 300, color: 'rgba(248,250,252,0.78)', fontSize: 13.5, lineHeight: 1.45 }}>{standfirst}</p>
      <div data-proof-row style={{ marginTop: 18, display: 'flex', flexWrap: 'nowrap', gap: 26, minWidth: 0 }}>{proofs.map((proof) => <div key={proof.label} style={{ minWidth: 0 }}><div style={{ color: A.INK, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, ...figure }}>{proof.value}</div><div style={{ marginTop: 3, color: INK_FAINT, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.13em', lineHeight: 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{proof.label}</div></div>)}</div>
    </div>
  </section>;
}

export function MovementModule({ category, onPlayerClick }: { category: LeaderCategoryDef; onPlayerClick: (row: LeaderRow) => void }) {
  const { t } = useTranslation('tourhub');
  if (category.movementSource !== 'per_event_points') return null;
  const movers = category.rows.filter((row) => row.movement != null).sort((a, b) => Math.abs(b.movement ?? 0) - Math.abs(a.movement ?? 0)).slice(0, 4);
  if (movers.length < 4) return null;
  return <section style={{ borderBottom: `1px solid ${WHITE_ALPHA_06}` }}><SectionHead category={category} titleKey="leaders.season.movementTitle" /><div style={{ padding: '8px 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>{movers.map((row) => <button type="button" key={row.playerId || row.name} onClick={() => onPlayerClick(row)} style={{ minWidth: 0, minHeight: 112, padding: 14, border: `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}><span style={{ display: 'block', fontSize: 20, fontWeight: 800 }}><Movement value={row.movement} /></span><span style={{ display: 'block', marginTop: 16, color: A.INK, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span><span style={{ display: 'block', marginTop: 4, color: INK_MUTE, fontSize: 10, fontWeight: 700 }}>{row.valueFormatted}</span></button>)}</div></section>;
}

export function RaceStandingsModule({ category, onPlayerClick }: { category: LeaderCategoryDef; onPlayerClick: (row: LeaderRow) => void }) {
  const { t } = useTranslation('tourhub');
  const rows = category.rows.slice(0, 5);
  if (rows.length < 2) return null;
  return <section style={{ borderBottom: `1px solid ${WHITE_ALPHA_06}` }}><SectionHead category={category} titleKey="leaders.season.raceTableTitle" /><p style={{ ...copy, padding: '0 24px' }}>{t('leaders.season.raceTableStandfirst')}</p><div style={{ margin: '18px 24px 30px' }}>{rows.map((row, index) => <button type="button" key={row.playerId || row.name} onClick={() => onPlayerClick(row)} style={{ width: '100%', minHeight: 72, padding: '12px 0', border: 0, borderBottom: index === rows.length - 1 ? 'none' : `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', alignItems: 'center', columnGap: 12, textAlign: 'left', cursor: 'pointer' }}><span style={{ color: index === 0 ? STATUS_LIVE : INK_MUTE, fontSize: 12, fontWeight: 800, ...figure }}>{row.rankLabel}</span><span style={{ minWidth: 0, color: A.INK, fontSize: 15, fontWeight: index === 0 ? 800 : 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span><span style={{ textAlign: 'right' }}><span style={{ display: 'block', color: index === 0 ? STATUS_LIVE : A.INK, fontSize: 18, fontWeight: 800, ...figure }}>{row.valueFormatted}</span>{category.meaningfulBehind && row.behindFormatted ? <span style={{ display: 'block', marginTop: 3, color: INK_MUTE, fontSize: 9, fontWeight: 700 }}>+{row.behindFormatted}</span> : null}</span></button>)}</div></section>;
}

export function NumberModule({ category, onPlayerClick }: { category: LeaderCategoryDef; onPlayerClick: (row: LeaderRow) => void }) {
  const { t } = useTranslation('tourhub');
  const leader = category.rows[0];
  if (!leader) return null;
  return <section data-season-module="number" style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}><SectionHead category={category} titleKey={category.key === 'strokes_gained_putting' ? 'leaders.season.sectionTitle.putting' : undefined} /><div style={{ position: 'relative', minHeight: 188, padding: '6px 24px 24px', overflow: 'hidden' }}><div style={{ position: 'relative', zIndex: 2, maxWidth: 'calc(100% - 120px)' }}><div style={{ display: 'flex', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap' }}><span style={{ color: AMBER, fontSize: 62, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.9, ...figure }}>{leader.valueFormatted}</span><span style={{ color: INK_FAINT, fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{t(category.unitKey)}</span></div><button type="button" onClick={() => onPlayerClick(leader)} style={{ display: 'block', border: 0, padding: 0, marginTop: 12, color: A.INK, background: 'transparent', fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em', cursor: 'pointer', textAlign: 'left' }}>{leader.name}</button><p style={{ ...copy, marginTop: 7, maxWidth: 200 }}>{t(category.descriptionKey)}</p></div><PlayerPortrait row={leader} variant="number" /></div></section>;
}

function duelSentenceKey(category: LeaderCategoryDef): string {
  if (category.key === 'drive_avg') return 'leaders.season.duelEvidence.distance';
  if (category.key === 'scoring_avg') return 'leaders.season.duelEvidence.scoring';
  return 'leaders.season.duelEvidence.default';
}

export function DuelModule({ category, onPlayerClick }: { category: LeaderCategoryDef; onPlayerClick: (row: LeaderRow) => void }) {
  const { t } = useTranslation('tourhub');
  const [first, second] = category.rows;
  if (!first || !second) return null;
  const total = Math.abs(first.value) + Math.abs(second.value);
  const firstShare = total > 0 ? Math.max(0, Math.min(100, Math.abs(first.value) / total * 100)) : 50;
  const gap = Math.abs(first.value - second.value);
  const roundsPerStroke = gap > 0 ? Math.max(1, Math.round(1 / gap)) : 0;
  return <section data-season-module="duel" style={{ borderBottom: `1px solid ${WHITE_ALPHA_06}` }}><SectionHead category={category} titleKey={category.key === 'drive_avg' ? 'leaders.season.sectionTitle.driving' : undefined} /><div style={{ padding: '8px 24px 24px' }}><div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', gap: 12 }}><button type="button" onClick={() => onPlayerClick(first)} style={{ minWidth: 0, padding: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}><PlayerPortrait row={first} variant="duel" /><span style={{ display: 'block', marginTop: 8, color: A.INK, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{first.name}</span><span style={{ display: 'block', marginTop: 4, color: A.INK, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', ...figure }}>{first.valueFormatted}</span></button><span style={{ color: INK_FAINT, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em' }}>{t('leaders.season.vs')}</span><button type="button" onClick={() => onPlayerClick(second)} style={{ minWidth: 0, padding: 0, border: 0, background: 'transparent', textAlign: 'right', cursor: 'pointer' }}><span style={{ display: 'flex', justifyContent: 'flex-end' }}><PlayerPortrait row={second} variant="duel" /></span><span style={{ display: 'block', marginTop: 8, color: A.INK, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{second.name}</span><span style={{ display: 'block', marginTop: 4, color: A.INK, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', ...figure }}>{second.valueFormatted}</span></button></div><div aria-label={`${first.name} ${firstShare.toFixed(1)}%`} style={{ height: 5, marginTop: 16, display: 'flex', overflow: 'hidden', borderRadius: 3, background: WHITE_ALPHA_08 }}><span style={{ width: `${firstShare}%`, background: STATUS_LIVE }} /><span style={{ flex: 1, background: WHITE_ALPHA_30 }} /></div><p style={{ ...copy, marginTop: 12, fontSize: 12 }}>{t(duelSentenceKey(category), { gap: gap.toFixed(category.key === 'scoring_avg' ? 3 : 1), rounds: roundsPerStroke, unit: t(category.unitKey) })}</p></div></section>;
}

export function TiedListModule({ category, onPlayerClick }: { category: LeaderCategoryDef; onPlayerClick: (row: LeaderRow) => void }) {
  const leaders = category.rows.filter((row) => row.rank === 1).slice(0, 3);
  return <section style={{ borderBottom: `1px solid ${WHITE_ALPHA_06}` }}><SectionHead category={category} titleKey="leaders.season.sectionTitle.tied" /><div style={{ padding: '4px 24px 24px' }}>{leaders.map((row, index) => <CompactRow key={row.playerId || row.name} row={row} last={index === leaders.length - 1} onPlayerClick={onPlayerClick} />)}</div></section>;
}

export function SeasonIndexLink({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation('tourhub');
  return <button type="button" onClick={onClick} style={{ width: '100%', minHeight: 76, padding: '13px 24px', border: 0, background: 'transparent', color: A.INK, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}><span style={{ fontSize: 14, fontWeight: 800 }}>{t('leaders.index.title')}</span><ChevronRight size={18} color={A.INK} /></button>;
}

export const StatBoardRows = TiedListModule;
export const WinnersCircle = TiedListModule;
export const ANATOMY_BY_KEY: Record<string, 'stat' | 'winners'> = {};