/** CHAMPIONS_STATE_3_R: never-played connected members only. Null projection
 * delegates verbatim to FieldChampions; cabinet and leaderboard remain shared.
 * All score conversion comes from coursePlay; record grammar from the shared
 * selector, with the existing youTab namespace deliberately retained.
 */
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { CourseProjection, CoursePlayInputs } from '@/lib/whs/coursePlay';
import { recordProjectionForm } from '@/lib/whs/recordProjectionForm';
import { SURFACE } from '@/lib/tokens/surface';
import { MEMBER_PANEL, inkWithAlpha } from '@/lib/tokens/surfaces';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { numberWord } from '@/lib/text/numbers';
import { COURSE_FIELD_MIN_ROUNDS } from '@/lib/courseYou/youDerivations';
import { ChampionsCabinet } from './NobodyHasPlayed';
import { FieldChampions, type FieldChampionsProps } from './FieldChampions';
import { BoardSection } from './BoardSection';
import { projectedBoardRange, projectedTile } from './championsProjection';
import { CHAMPIONS_BOARD_DATA } from '../_shared/championsOrder';

export interface ProjectedChampionsProps extends FieldChampionsProps {
  projection: CourseProjection | null;
  inputs: CoursePlayInputs | null;
  initials?: string;
}
export { recordProjectionForm as championsRecordForm } from '@/lib/whs/recordProjectionForm';

export function ProjectedChampions(props: ProjectedChampionsProps) {
  const { t } = useTranslation('courses');
  const { projection: p, inputs, categories, grouped, activeKey, legendWindow, rounds } = props;
  if (!p || !inputs) return <FieldChampions {...props} />;
  const holders = new Map(categories.flatMap(category => {
    const rows = grouped.get(category.key)?.rows.filter(row => row.rank === 1) ?? [];
    return rows.length ? [[category.key, { names: rows.map(row => row.name), value: rows[0].valueDisplay }] as const] : [];
  }));
  const states = new Map(categories.map(category => [category.key, projectedTile(category.key, grouped.get(category.key)?.rows.find(row => row.rank === 1)?.value ?? null, p, inputs)]));
  const reached = categories.filter(category => states.get(category.key)?.state === 'in-reach');
  const names = reached.map(category => CHAMPIONS_BOARD_DATA[category.key].name);
  const named = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' }).format(names);
  const range = projectedBoardRange(activeKey, p, inputs);
  const record = grouped.get(legendWindow === '90d' ? 'lowest_gross_90d' : 'lowest_gross_all_time')?.rows.find(row => row.rank === 1)?.value ?? null;
  const thin = rounds != null && rounds < COURSE_FIELD_MIN_ROUNDS;
  const form = recordProjectionForm(record, p, thin);
  const heading = form === 'rangeRecordAbove' ? 'On your ordinary golf you would hold it' : form === 'rangeRecordInside' ? 'It is yours on a good day' : form === 'rangeRecordBelow' ? 'It would take better than your best here' : 'Your scoring carried onto this course';
  return <div className="champions-empty champions-projected" style={{ color: SURFACE.dark.ink }}>
    <section className="champions-empty-section">
      <div className="champions-empty-kicker" style={{ color: A.AMBER }}>You have never played here</div>
      <h2 data-reached-count={reached.length}>Your golf reaches {numberWord(reached.length, false)} of these</h2>
      <div className="champions-empty-lede" style={{ color: SURFACE.dark.mute }}>Off a course handicap of {p.courseHcp} you project {p.typicalGross}. {names.length ? `That is enough for the ${named} ${names.length === 1 ? 'board' : 'boards'} here.` : 'No standing projectable board is within your range here yet.'}</div>
      <ChampionsCabinet categories={categories.map(category => category.key)} holders={holders} states={states} activeKey={activeKey} onSelect={props.onSelect} />
      <div className="champions-cabinet-legend" aria-label="Board states" style={{ color: SURFACE.dark.dim }}>
        {['In reach', 'Held', 'Not started', 'Never claimed'].map((label, index) => <div className="champions-cabinet-legend-entry" key={label}><span className="champions-cabinet-swatch" style={index === 3 ? undefined : { background: index === 0 ? A.AMBER : inkWithAlpha(SURFACE.dark.ink, index === 1 ? 0.42 : 0.3), border: 0 }} />{label}</div>)}
      </div>
      {rounds != null && rounds > 0 && rounds < MIN_THIN_PITCH_ROUNDS && reached.length > 0 && <div className="champions-empty-said" style={{ borderColor: A.AMBER, color: SURFACE.dark.body }}>Only <b>{numberWord(rounds, false)} {rounds === 1 ? 'round has' : 'rounds have'}</b> ever been logged here, which is why so much of it is within you. <b>Thinly played courses are where the boards are</b>, not the famous ones everybody has beaten up.</div>}
      <div className="champions-empty-said" style={{ color: SURFACE.dark.mute }}>Birdies, eagles, aces, albatrosses and rounds <b>accumulate</b>, and you have none here yet — not out of reach, not begun. <b>Stableford depends on where the shots fall</b>, not on the total, so two rounds of {p.typicalGross} score differently and no honest projection exists.</div>
    </section>
    <BoardSection categories={categories} grouped={grouped} activeKey={activeKey} onSelectCategory={props.onSelect} legendWindow={legendWindow} canSwitchWindow onWindowChange={props.onWindowChange} coursePar={props.par} onOpenFull={props.onOpenFull} onRowPress={props.onRowPress} fieldOnly ghost={range ? { value: range.typical, initials: props.initials ?? 'You' } : undefined} />
    <section className="champions-empty-section">
      <div className="champions-empty-kicker" style={{ color: A.AMBER }}>What it takes</div>
      <h2>{heading}</h2>
      <div className="champions-field-panel" style={{ background: MEMBER_PANEL }}>
        {record != null && <div className="champions-field-record"><strong style={{ color: MEDAL_GOLD }}>{record}</strong><span style={{ color: SURFACE.dark.mute }}>The record</span></div>}
        <ProjectionScale p={p} record={record} field={props.fieldOverPar != null ? inputs.par + props.fieldOverPar : null} />
        <div className="champions-field-stats">{[[record ?? '—', 'The record'], [p.typicalGross, 'You project'], [`${p.lowGross}–${p.highGross}`, 'Your range'], [p.courseHcp, 'Course handicap']].map(([value, label]) => <div key={label}><strong>{value}</strong><span style={{ color: SURFACE.dark.dim }}>{label}</span></div>)}</div>
      </div>
      <div className="champions-empty-said" style={{ borderColor: A.AMBER, color: SURFACE.dark.body }} data-record-form={form}>{form === 'range' || form === 'rangeWithRecordThin' ? t(`courseDetail.youTab.projection.${form}`, { low: p.lowGross, high: p.highGross, record, count: rounds ?? 0 }) : <Trans t={t} i18nKey={`courseDetail.youTab.projection.${form}`} values={{ low: p.lowGross, high: p.highGross, record }} components={{ b: <b style={{ color: SURFACE.dark.ink, fontWeight: 700 }} /> }} />}</div>
      <div className="champions-empty-said" style={{ color: SURFACE.dark.mute }}>A projection is your scoring carried onto this course's rating and slope. It is not a forecast of the day you will actually have.</div>
    </section>
  </div>;
}
// This pitch is shown only for genuinely sparse courses, not every populated course.
const MIN_THIN_PITCH_ROUNDS = COURSE_FIELD_MIN_ROUNDS;

function ProjectionScale({ p, record, field }: { p: CourseProjection; record: number | null; field: number | null }) {
  const lo = Math.min(p.lowGross, record ?? p.lowGross) - 3;
  const hi = Math.max(p.highGross, record ?? p.highGross) + 3;
  const x = (value: number) => 24 + (value - lo) / (hi - lo) * 280;
  return <svg className="champions-field-scale" viewBox="0 0 328 64" role="img" aria-label="Your projected range and the record">
    <rect x={x(p.lowGross)} width={x(p.highGross) - x(p.lowGross)} y="22" height="10" rx="4" fill={`color-mix(in srgb, ${A.AMBER} 22%, transparent)`} />
    <line x1="0" x2="328" y1="27" y2="27" stroke={SURFACE.dark.hairline} />
    <text x={x(p.typicalGross)} y="14" textAnchor="middle" fontSize="8" fill={A.AMBER}>YOUR RANGE</text>
    {[{ value: p.typicalGross, tone: A.AMBER }, ...(record != null ? [{ value: record, tone: MEDAL_GOLD }] : [])].map(mark => <g key={mark.tone}><rect x={x(mark.value) - 3} y="19" width="6" height="16" rx="2" fill={mark.tone} /><text x={x(mark.value)} y="49" textAnchor="middle" fontSize="9.5" fill={mark.tone}>{mark.value}</text></g>)}
    {field != null && <text x="320" y="62" textAnchor="end" fontSize="9" fill={SURFACE.dark.dim}>Field {field.toFixed(1)}</text>}
  </svg>;
}