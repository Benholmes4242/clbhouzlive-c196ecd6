import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { FieldChampions, type FieldChampionsProps } from '@/components/profile/handicap/whs/sections/course-legends/flat/FieldChampions';
import { CHAMPIONS_ORDER_ALL_TIME, CHAMPIONS_ORDER_90D } from '@/components/profile/handicap/whs/sections/course-legends/_shared/championsOrder';
import { cabinetHolderName, fieldRecordComparison } from '@/components/profile/handicap/whs/sections/course-legends/flat/championsField';
import type { LegendCategory } from '@/lib/gam/types';
import type { FlatRow } from '@/components/profile/handicap/whs/sections/course-legends/flat/championsFlatBits';
import { SURFACE } from '@/lib/tokens/surface';

afterEach(cleanup);

function props(order = CHAMPIONS_ORDER_ALL_TIME): FieldChampionsProps {
  const row: FlatRow = { rank: 1, name: 'Lennon Hill', photoUrl: null, value: 65, valueDisplay: '65', attained_at: '2026-06-01', isSelf: true, userId: 'viewer' };
  const grouped = new Map<LegendCategory, { rows: FlatRow[]; total: number }>();
  for (const key of order.filter(key => !key.includes('aces') && !key.includes('albatrosses'))) grouped.set(key, { rows: [row], total: 1 });
  grouped.set(order[0], { rows: [row, { ...row, name: 'Danny Holmes', userId: 'other', isSelf: false }], total: 2 });
  return { categories: order.map(key => ({ key, label: key, short: key })), grouped, courseName: 'Sundridge Park East', activeKey: order[0], onSelect: vi.fn(), legendWindow: order === CHAMPIONS_ORDER_90D ? '90d' : 'all_time', onWindowChange: vi.fn(), onConnect: vi.fn(), onOpenFull: vi.fn(), par: 71, fieldOverPar: 11.4, rounds: 900 };
}

describe('CHAMPIONS_STATE_2', () => {
  it('EG1: taken plus untouched equals the canonical tile total in both windows', () => {
    const { rerender } = render(<FieldChampions {...props()} />);
    expect(screen.getAllByRole('listitem').filter(item => item.hasAttribute('data-state'))).toHaveLength(9);
    expect(screen.getByRole('heading', { name: 'Seven taken, two never touched' })).toBeTruthy();
    rerender(<FieldChampions {...props(CHAMPIONS_ORDER_90D)} />);
    expect(screen.getAllByRole('listitem').filter(item => item.hasAttribute('data-state'))).toHaveLength(8);
    expect(screen.getByRole('heading', { name: 'Six taken, two never touched' })).toBeTruthy();
  });

  it('EG2: a viewer holder remains a neutral held tile and both legend entries stay neutral', () => {
    render(<FieldChampions {...props()} />);
    const neutral = document.createElement('span');
    neutral.style.color = SURFACE.dark.ink;
    for (const tile of screen.getAllByRole('listitem').filter(item => item.getAttribute('data-state') === 'held')) {
      expect((tile.querySelector('button') as HTMLElement).style.color).toBe(neutral.style.color);
    }
    neutral.style.color = SURFACE.dark.dim;
    expect((screen.getByLabelText('Board states') as HTMLElement).style.color).toBe(neutral.style.color);
    expect(screen.getByLabelText('Board states').children).toHaveLength(2);
  });

  it('EG3: exactly two window controls exist and use only all-time and 90-day values', () => {
    const input = props();
    render(<FieldChampions {...input} />);
    const all = screen.getByRole('button', { name: 'All time' });
    const recent = screen.getByRole('button', { name: '90 days' });
    expect(all.parentElement?.querySelectorAll('button')).toHaveLength(2);
    fireEvent.click(recent);
    expect(input.onWindowChange).toHaveBeenCalledWith('90d');
  });

  it('EG4: two-holder ties use both surnames; handles are unchanged and multi-holder ties are counted', () => {
    expect(cabinetHolderName(['Lennon Hill', 'Danny Holmes'])).toBe('Hill & Holmes');
    expect(cabinetHolderName(['Benjamin Extremelylongsurname'])).toBe('B. Extremelylongsurname');
    expect(cabinetHolderName(['long_single_token_handle'])).toBe('long_single_token_handle');
    expect(cabinetHolderName(['Lennon Hill', 'Danny Holmes', 'Joe Smith'])).toBe('Hill +2');
    render(<FieldChampions {...props()} />);
    expect(screen.getByText('Hill & Holmes')).toBeTruthy();
  });

  it('EG5: no viewer row is pinned or relabelled, including when the viewer holds the record', () => {
    const { container } = render(<FieldChampions {...props()} />);
    expect(container.querySelector('[data-self="1"]')).toBeNull();
    expect(screen.getByText('Lennon Hill')).toBeTruthy();
    expect(screen.queryByText('You')).toBeNull();
  });

  it('EE3: record versus field uses the existing par, average and round figures', () => {
    const result = fieldRecordComparison(65, 71, 11.4, 900);
    expect(result?.fieldGross).toBeCloseTo(82.4);
    expect(result?.gap).toBeCloseTo(17.4);
    expect(result?.rounds).toBe(900);
    expect(fieldRecordComparison(65, null, 11.4, 900)).toBeNull();
  });

  it('ED4: a tile selection chooses its own board, never an unrelated route or window', () => {
    const input = props();
    render(<FieldChampions {...input} />);
    const tile = screen.getAllByRole('listitem').find(item => item.getAttribute('data-category') === 'lowest_net_all_time');
    const button = tile?.querySelector('button');
    if (!button) throw new Error('Net tile missing');
    fireEvent.click(button);
    expect(input.onSelect).toHaveBeenCalledWith('lowest_net_all_time');
    expect(input.onWindowChange).not.toHaveBeenCalled();
  });
});