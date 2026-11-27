/** Brief 44A — race chart plot edge sized to the widest end label. */
import { describe, expect, it } from 'vitest';
import { measureRaceLabel, raceEdge, RACE_LABEL_GAP } from '@/features/tourhub/tournament-v2/data/raceChartEdge';

describe('race chart end labels fit', () => {
  it('long label: every label ends inside 350 and the edge moves left of 262', () => {
    const labels = [['Von Dellingshausen −13', true], ['Smith −9', false]] as const;
    const edge = raceEdge(Math.max(...labels.map(([t, b]) => measureRaceLabel(t, b))));
    expect(edge).toBeLessThan(262);
    for (const [t, b] of labels) expect(edge + RACE_LABEL_GAP + measureRaceLabel(t, b)).toBeLessThanOrEqual(350);
  });
  it('short labels keep the original 262 edge', () => {
    expect(raceEdge(measureRaceLabel('Smith −9', true))).toBe(262);
  });
  it('edge never goes below 190', () => {
    expect(raceEdge(measureRaceLabel('A'.repeat(200), true))).toBe(190);
  });
});
