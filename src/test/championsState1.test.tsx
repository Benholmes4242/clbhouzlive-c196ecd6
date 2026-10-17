import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, cleanup, fireEvent } from '@testing-library/react';
import { afterEach } from 'vitest';
import { NobodyHasPlayed } from '@/components/profile/handicap/whs/sections/course-legends/flat/NobodyHasPlayed';
import { CHAMPIONS_ORDER_ALL_TIME, CHAMPIONS_ORDER_90D, orderWithWomensRecord } from '@/components/profile/handicap/whs/sections/course-legends/_shared/championsOrder';
import { CHAMPIONS_CATALOGUE_TOTAL, CHAMPIONS_CATALOGUE_WITH_TRACKED_ROUNDS, championsCatalogueWithoutRounds } from '@/lib/gam/championsCatalogueSnapshot';
import { SURFACE } from '@/lib/tokens/surface';
import { A } from '@/features/courses/components/holes/analytical/tokens';

afterEach(cleanup);

describe('CHAMPIONS_STATE_1_R', () => {
  it('CE1: all time has nine tiles and 90 days has eight from their canonical orders', () => {
    const { rerender } = render(<NobodyHasPlayed categories={CHAMPIONS_ORDER_ALL_TIME} courseName="Kingsbarns" showConnect={false} onConnect={vi.fn()} />);
    expect(within(screen.getByRole('list', { name: 'Open boards' })).getAllByRole('listitem')).toHaveLength(9);
    rerender(<NobodyHasPlayed categories={CHAMPIONS_ORDER_90D} courseName="Kingsbarns" showConnect={false} onConnect={vi.fn()} />);
    expect(within(screen.getByRole('list', { name: 'Open boards' })).getAllByRole('listitem')).toHaveLength(8);
  });

  it('CE2: headline and cabinet share their supplied order, including the women splice', () => {
    const categories = orderWithWomensRecord(CHAMPIONS_ORDER_ALL_TIME, ['lowest_gross_women_all_time']);
    render(<NobodyHasPlayed categories={categories} courseName="Kingsbarns" showConnect={false} onConnect={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('All ten boards are open');
    const tiles = screen.getAllByRole('listitem');
    expect(tiles).toHaveLength(10);
    expect(tiles[1].getAttribute('data-category')).toBe('lowest_gross_women_all_time');
  });

  it('CE3: all tile ink is neutral and only never-claimed appears in the legend', () => {
    render(<NobodyHasPlayed categories={CHAMPIONS_ORDER_ALL_TIME} courseName="Kingsbarns" showConnect={false} onConnect={vi.fn()} />);
    const neutral = document.createElement('span');
    for (const tile of screen.getAllByRole('listitem')) {
      expect(tile.getAttribute('data-state')).toBe('never-claimed');
      const name = tile.querySelector('.champions-cabinet-name');
      const value = tile.querySelector('.champions-cabinet-value');
      const state = tile.querySelector('.champions-cabinet-state');
      neutral.style.color = SURFACE.dark.dim;
      expect((name as HTMLElement).style.color).toBe(neutral.style.color);
      expect((state as HTMLElement).style.color).toBe(neutral.style.color);
      neutral.style.color = A.FAINT;
      expect((value as HTMLElement).style.color).toBe(neutral.style.color);
    }
    expect(screen.getByLabelText('Board states').children).toHaveLength(1);
  });

  it('CE4: connected viewers have no connect block; unconnected viewers can open the existing connect action', () => {
    const onConnect = vi.fn();
    const { rerender } = render(<NobodyHasPlayed categories={CHAMPIONS_ORDER_ALL_TIME} courseName="Kingsbarns" showConnect={false} onConnect={onConnect} />);
    expect(screen.queryByRole('button', { name: 'Connect handicap' })).toBeNull();
    rerender(<NobodyHasPlayed categories={CHAMPIONS_ORDER_ALL_TIME} courseName="Kingsbarns" showConnect onConnect={onConnect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Connect handicap' }));
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('DA2–DA4: the last verified pair derives the without-rounds count rather than storing a third figure', () => {
    expect(CHAMPIONS_CATALOGUE_TOTAL).toBe(Number('23292'));
    expect(CHAMPIONS_CATALOGUE_WITH_TRACKED_ROUNDS).toBe(Number('296'));
    expect(championsCatalogueWithoutRounds()).toBe(CHAMPIONS_CATALOGUE_TOTAL - CHAMPIONS_CATALOGUE_WITH_TRACKED_ROUNDS);
  });
});