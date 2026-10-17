/**
 * CHAMPIONS_STATE_1_R: zero-row presentation only; populated boards stay separate.
 * Cabinet, headline and connect copy share the canonical active-window order.
 * Other cabinet states are reserved for later briefs, not rendered speculatively.
 */
import React from 'react';
import type { LegendCategory } from '@/lib/gam/types';
import { numberWord } from '@/lib/text/numbers';
import { SURFACE } from '@/lib/tokens/surface';
import { INK_ON_LIGHT } from '@/lib/tokens/surfaces';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { Button } from '@/components/ui/button';
import { CHAMPIONS_CATALOGUE_TOTAL, championsCatalogueWithoutRounds } from '@/lib/gam/championsCatalogueSnapshot';
import './championsEmpty.css';

export type CabinetState = 'never-claimed' | 'held' | 'in-reach' | 'yours';

function boardName(category: LegendCategory): string {
  const base = category.replace(/_(all_time|90d)$/, '');
  const labels: Record<string, string> = {
    lowest_gross: 'Gross', lowest_net: 'Net', lowest_gross_women: "Women's gross",
    best_stableford: 'Stableford', most_aces: 'Aces', most_albatrosses: 'Albatross',
    most_eagles: 'Eagles', most_birdies: 'Birdies', most_rounds: 'Rounds', best_score_diff: 'Differential',
  };
  return labels[base] ?? category;
}

export function ChampionsCabinetTile({ category, state }: { category: LegendCategory; state: CabinetState }) {
  if (state !== 'never-claimed') return null;
  return (
    <div className="champions-cabinet-tile" data-category={category} data-state={state} role="listitem">
      <div className="champions-cabinet-name" style={{ color: SURFACE.dark.dim }}>{boardName(category)}</div>
      <div>
        <div className="champions-cabinet-value" style={{ color: A.FAINT }}>—</div>
        <div className="champions-cabinet-state" style={{ color: SURFACE.dark.dim }}>Open</div>
      </div>
    </div>
  );
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
        <div className="champions-cabinet" role="list" aria-label="Open boards">
          {categories.map(category => <ChampionsCabinetTile key={category} category={category} state="never-claimed" />)}
        </div>
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