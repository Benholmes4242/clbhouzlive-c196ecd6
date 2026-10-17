/**
 * CHAMPIONS_STATE_1_R: zero-row presentation only; populated boards stay separate.
 * Cabinet, headline and connect copy share the canonical active-window order.
 * Other cabinet states are reserved for later briefs, not rendered speculatively.
 */
import React from 'react';
import type { LegendCategory } from '@/lib/gam/types';
import { numberWord } from '@/lib/text/numbers';
import { SURFACE } from '@/lib/tokens/surface';
import { INK_ON_LIGHT, MEMBER_PANEL, inkWithAlpha } from '@/lib/tokens/surfaces';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { Button } from '@/components/ui/button';
import { CHAMPIONS_CATALOGUE_TOTAL, championsCatalogueWithoutRounds } from '@/lib/gam/championsCatalogueSnapshot';
import './championsEmpty.css';
import { cabinetHolderName } from './championsField';

export type CabinetState = 'never-claimed' | 'held' | 'in-reach' | 'not-started' | 'yours';

function boardName(category: LegendCategory): string {
  const base = category.replace(/_(all_time|90d)$/, '');
  const labels: Record<string, string> = {
    lowest_gross: 'Gross', lowest_net: 'Net', lowest_gross_women: "Women's gross",
    best_stableford: 'Stableford', most_aces: 'Aces', most_albatrosses: 'Albatross',
    most_eagles: 'Eagles', most_birdies: 'Birdies', most_rounds: 'Rounds', best_score_diff: 'Differential',
  };
  return labels[base] ?? category;
}

export function ChampionsCabinetTile({ category, state, value, holders = [], selected = false, onSelect, gap }: {
  category: LegendCategory; state: CabinetState; value?: string; holders?: readonly string[]; selected?: boolean; onSelect?: () => void; gap?: number;
}) {
  if (state === 'yours') return null;
  const held = state !== 'never-claimed';
  const projected = state === 'in-reach' || state === 'not-started';
  const contents = <>
    <div className="champions-cabinet-name" style={{ color: SURFACE.dark.dim }}>{boardName(category)}</div>
    <div>
      <div className="champions-cabinet-value" style={{ color: held ? SURFACE.dark.ink : A.FAINT }}>{held ? value : '—'}</div>
      <div className="champions-cabinet-state" style={{ color: state === 'in-reach' ? A.AMBER : state === 'not-started' ? inkWithAlpha(SURFACE.dark.ink, 0.3) : SURFACE.dark.dim }}>{state === 'in-reach' ? 'In reach' : state === 'not-started' ? 'Not started' : gap != null ? `${gap} off` : held ? cabinetHolderName(holders) : 'Open'}</div>
    </div>
  </>;
  const tileStyle = held ? { background: MEMBER_PANEL, color: SURFACE.dark.ink, borderColor: state === 'in-reach' ? `color-mix(in srgb, ${A.AMBER} 42%, transparent)` : undefined, boxShadow: selected ? `inset 0 0 0 1.5px ${SURFACE.dark.ink}` : undefined } : undefined;
  if (onSelect) return <div role="listitem" data-category={category} data-state={state}>
    <Button variant="secondary" className={`champions-cabinet-tile champions-cabinet-select${projected ? ' champions-cabinet-projected' : ''}`} data-state={state} aria-pressed={selected} onClick={onSelect} style={tileStyle}>{contents}</Button>
  </div>;
  return (
    <div className="champions-cabinet-tile" data-category={category} data-state={state} role="listitem" style={tileStyle}>{contents}</div>
  );
}

export function ChampionsCabinet({ categories, holders, activeKey, onSelect, states }: {
  categories: readonly LegendCategory[];
  holders?: Map<LegendCategory, { names: string[]; value: string }>;
  activeKey?: LegendCategory;
  onSelect?: (category: LegendCategory) => void;
  states?: Map<LegendCategory, { state: CabinetState; gap?: number }>;
}) {
  return <div className="champions-cabinet" role="list" aria-label="Open boards">
    {categories.map(category => {
      const holder = holders?.get(category);
      const presentation = states?.get(category);
      return <ChampionsCabinetTile key={category} category={category} state={presentation?.state ?? (holder ? 'held' : 'never-claimed')} gap={presentation?.gap} value={holder?.value} holders={holder?.names} selected={activeKey === category} onSelect={onSelect ? () => onSelect(category) : undefined} />;
    })}
  </div>;
}

export function NobodyHasPlayed({ categories, courseName, showConnect, onConnect }: {
  categories: readonly LegendCategory[];
  courseName: string;
  showConnect: boolean;
  onConnect: () => void;
}) {
  const spelled = numberWord(categories.length, false);
  return (
    <div className="champions-empty" style={{ color: SURFACE.dark.ink }}>
      <section className="champions-empty-section">
        <div className="champions-empty-kicker" style={{ color: SURFACE.dark.dim }}>Nothing has been taken here</div>
        <h2>All {spelled} boards are open</h2>
        <div className="champions-empty-lede" style={{ color: SURFACE.dark.mute }}>
          No member has posted a round at {courseName}. The first card takes every board at once.
        </div>
        <ChampionsCabinet categories={categories} />
        <div className="champions-cabinet-legend" aria-label="Board states">
          <div className="champions-cabinet-legend-entry" style={{ color: SURFACE.dark.dim }}>
            <span className="champions-cabinet-swatch" aria-hidden="true" />Never claimed
          </div>
        </div>
        <div className="champions-empty-said" style={{ color: SURFACE.dark.body }}>
          <strong style={{ color: SURFACE.dark.ink }}>{championsCatalogueWithoutRounds().toLocaleString('en-GB')} of the {CHAMPIONS_CATALOGUE_TOTAL.toLocaleString('en-GB')} courses</strong> we track are in exactly this state. {courseName} is one of them.
        </div>
      </section>
      {showConnect && (
        <section className="champions-empty-section">
          <div className="champions-empty-connect">
            <h3>Connect once and the first card is yours.</h3>
            <p style={{ color: SURFACE.dark.mute }}>The rounds you have already played come with it, not just the ones from today onwards. If you have played {courseName} before, you take all {spelled} the moment you connect.</p>
            <Button variant="secondary" className="champions-empty-button" style={{ background: SURFACE.dark.ink, color: INK_ON_LIGHT }} onClick={onConnect}>Connect handicap</Button>
            <div className="champions-empty-said" style={{ color: SURFACE.dark.mute }}>Boards rank official WHS scores only. A round has to be on your handicap record to count.</div>
          </div>
        </section>
      )}
    </div>
  );
}