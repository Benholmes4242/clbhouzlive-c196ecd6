/**
 * CHAMPIONS_STATE_2: unconnected, populated course only. Cabinet owns selection
 * and counts from one window order; existing BoardSection owns leader rows.
 * Field figures are passed from GolfClubView's already-mounted stats read.
 * Record history is not returned by these reads, so no movement story is claimed.
 */
import React from 'react';
import { VERDICT_KICKER, TAB_TITLE } from '@/components/courses/course-detail/about/AboutSection';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';
import { numberWord } from '@/lib/text/numbers';
import { SURFACE } from '@/lib/tokens/surface';
import { INK_ON_LIGHT, MEMBER_PANEL, inkWithAlpha } from '@/lib/tokens/surfaces';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { Button } from '@/components/ui/button';
import { ChampionsCabinet } from './NobodyHasPlayed';
import { BoardSection, type BoardCategoryDescriptor } from './BoardSection';
import type { FlatRow } from './championsFlatBits';
import { fieldRecordComparison } from './championsField';

export interface FieldChampionsProps {
  categories: BoardCategoryDescriptor[];
  grouped: Map<LegendCategory, { rows: FlatRow[]; total: number }>;
  courseName: string;
  activeKey: LegendCategory;
  onSelect: (category: LegendCategory) => void;
  legendWindow: LegendWindow;
  onWindowChange: (window: LegendWindow) => void;
  onConnect: () => void;
  onOpenFull: (category: LegendCategory) => void;
  onRowPress?: (row: FlatRow) => void;
  par: number | null;
  fieldOverPar: number | null;
  rounds: number | null;
}

export function FieldChampions(props: FieldChampionsProps) {
  const { categories, grouped, courseName, activeKey, onSelect, legendWindow, onWindowChange, onConnect, onOpenFull, onRowPress, par, fieldOverPar, rounds } = props;
  const holders = new Map<LegendCategory, { names: string[]; value: string }>();
  for (const category of categories) {
    const champions = grouped.get(category.key)?.rows.filter(row => row.rank === 1) ?? [];
    if (champions.length) holders.set(category.key, { names: champions.map(row => row.name), value: champions[0].valueDisplay });
  }
  const total = categories.length;
  const taken = holders.size;
  const untouched = total - taken;
  const spelled = numberWord(total, false);
  const grossKey: LegendCategory = legendWindow === '90d' ? 'lowest_gross_90d' : 'lowest_gross_all_time';
  const record = grouped.get(grossKey)?.rows.find(row => row.rank === 1)?.value ?? null;
  const comparison = fieldRecordComparison(record, par, fieldOverPar, rounds);
  const emptyFeats = categories.filter(category => !holders.has(category.key) && /most_(aces|albatrosses)_/.test(category.key));
  return <div className="champions-empty" style={{ color: SURFACE.dark.ink }}>
    <section className="champions-empty-section champions-empty-section--first">
      <div className="champions-empty-kicker" style={VERDICT_KICKER}>The cabinet</div>
      <h2 style={TAB_TITLE}>{numberWord(taken)} taken, {numberWord(untouched, false)} never touched</h2>
      <div className="champions-empty-lede" style={{ color: SURFACE.dark.mute }}>Every course carries the same {spelled} boards. These are the standing figures at {courseName}.</div>
      <ChampionsCabinet categories={categories.map(category => category.key)} holders={holders} activeKey={activeKey} onSelect={onSelect} />
      <div className="champions-cabinet-legend" aria-label="Board states" style={{ color: SURFACE.dark.dim }}>
        <div className="champions-cabinet-legend-entry"><span className="champions-cabinet-swatch" style={{ background: inkWithAlpha(SURFACE.dark.ink, 0.3), border: 0 }} />Held</div>
        <div className="champions-cabinet-legend-entry"><span className="champions-cabinet-swatch" />Never claimed</div>
      </div>
      {emptyFeats.length === 2 && rounds != null && rounds > 0 && <div className="champions-empty-said" style={{ color: SURFACE.dark.body }}>
        No visible holder has claimed an ace or an albatross here in <strong>{rounds.toLocaleString('en-GB')} recorded rounds</strong>. The first player to do it can claim those boards.
      </div>}
    </section>
    <section className="champions-empty-section">
      <div className="champions-empty-connect">
        <h3>Connect once and you appear on all {spelled}.</h3>
        <p style={{ color: SURFACE.dark.mute }}>The rounds you have already played here come with it, not just the ones from today onwards. If you have played {courseName} before, you may already be on one of these boards without knowing it.</p>
        <ul className="champions-field-bullets" style={{ color: SURFACE.dark.body }}>
          <li><span>Your <strong>rank on every board</strong>, not just the top of them</span></li>
          <li><span>What each one would take <strong>in your shots</strong>, off your course handicap here</span></li>
          <li><span>The boards at <strong>other courses</strong> your scoring already puts in range</span></li>
        </ul>
        <Button variant="secondary" className="champions-empty-button" style={{ background: SURFACE.dark.ink, color: INK_ON_LIGHT }} onClick={onConnect}>Connect handicap</Button>
      </div>
    </section>
    <BoardSection categories={categories} grouped={grouped} activeKey={activeKey} onSelectCategory={onSelect} legendWindow={legendWindow} canSwitchWindow onWindowChange={onWindowChange} coursePar={par} onOpenFull={onOpenFull} onRowPress={onRowPress} fieldOnly />
    {comparison && <section className="champions-empty-section">
      <div className="champions-empty-kicker" style={VERDICT_KICKER}>What it takes</div>
      <h2 style={TAB_TITLE}>{numberWord(Math.round(Math.abs(comparison.recordToPar)))} {comparison.recordToPar < 0 ? 'under' : 'over'} par, on a course that plays {numberWord(Math.round(Math.abs(comparison.fieldOverPar)), false)} {comparison.fieldOverPar < 0 ? 'under' : 'over'}</h2>
      <div className="champions-field-panel" style={{ background: MEMBER_PANEL }}>
        <div className="champions-field-record"><strong>{comparison.record}</strong><span style={{ color: SURFACE.dark.mute }}>The record</span></div>
        <FieldRecordScale record={comparison.record} par={comparison.par} average={comparison.fieldGross} />
        <div className="champions-field-stats">
          {[[comparison.record, 'The record'], [`${comparison.fieldOverPar > 0 ? '+' : ''}${comparison.fieldOverPar.toFixed(1)}`, 'Field over par'], [comparison.gap.toFixed(1), 'Record to field'], [comparison.rounds.toLocaleString('en-GB'), 'Rounds here']].map(([value,label]) => <div key={label}><strong>{value}</strong><span style={{ color: SURFACE.dark.dim }}>{label}</span></div>)}
        </div>
      </div>
      <div className="champions-empty-said" style={{ color: SURFACE.dark.body }}>An ordinary round here is <strong>{comparison.gap.toFixed(1)} shots</strong> {comparison.gap < 0 ? 'better' : 'worse'} than the record.</div>
    </section>}
  </div>;
}

function FieldRecordScale({ record, par, average }: { record: number; par: number; average: number }) {
  const min = Math.min(record, par, average) - 3;
  const max = Math.max(record, par, average) + 3;
  const x = (value: number) => 24 + (value - min) / (max - min) * 280;
  return <svg className="champions-field-scale" viewBox="0 0 328 64" role="img" aria-label="Record, par and field average">
    <line x1="0" x2="328" y1="30" y2="30" stroke={SURFACE.dark.hairline} />
    {[{ value: record, tone: MEDAL_GOLD, label: String(record) }, { value: par, tone: inkWithAlpha(SURFACE.dark.ink, 0.55), label: `Par ${par}` }, { value: average, tone: SURFACE.dark.ink, label: average.toFixed(1) }].map(mark => <g key={mark.label}>
      <rect x={x(mark.value)-3} y="22" width="6" height="16" rx="2" fill={mark.tone} />
      <text x={x(mark.value)} y="55" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={mark.tone}>{mark.label}</text>
    </g>)}
    <text x={Math.max(54,Math.min(274,x(average)))} y="12" textAnchor="middle" fontSize="8" fontWeight="700" fill={SURFACE.dark.dim}>FIELD AVERAGE</text>
  </svg>;
}