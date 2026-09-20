import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RankedPlayerHeader, RankedPlayerRow } from '@/features/tourhub/players-v2/RankedPlayerRow';

afterEach(cleanup);

const player = {
  playerId: 'player-1',
  name: 'A Player Name Long Enough To Require Truncation',
  country: null,
  countryCode: null,
  photoUrl: null,
  tourCode: 'pga',
};

describe('RankedPlayerRow overview grammar', () => {
  it('uses the exact overview geometry and omits only the final hairline', () => {
    const first = render(
      <RankedPlayerRow rank={1} player={player} stat={1250} kicker="FedEx 1" sub="World 2 · 3 wins · 8 top-10" unit="Pts" />,
    );
    const row = screen.getByRole('button');
    expect(row.style.minHeight).toBe('76px');
    expect(row.style.padding).toBe('13px 24px');
    expect(row.style.gridTemplateColumns).toBe('minmax(0,1fr) auto');
    expect(row.style.borderBottom).toContain('1px solid');
    first.unmount();

    render(<RankedPlayerRow rank={2} player={player} stat={950} kicker="FedEx 2" sub="World 7" unit="Pts" last />);
    expect(screen.getByRole('button').style.borderBottom).toBe('');
  });

  it('renders ellipsising text lanes without an avatar', () => {
    const { container } = render(
      <RankedPlayerRow
        rank={3}
        player={player}
        stat={812}
        kicker="Live · A Tournament Name Long Enough To Require Truncation"
        sub="World 14 · 2 wins · 11 top-10"
        unit="T4 · −9"
      />,
    );
    for (const selector of ['[data-player-kicker]', '[data-player-name]', '[data-player-subline]']) {
      const element = container.querySelector(selector) as HTMLElement;
      expect(element.style.overflow).toBe('hidden');
      expect(element.style.textOverflow).toBe('ellipsis');
      expect(element.style.whiteSpace).toBe('nowrap');
    }
    expect((container.querySelector('[data-player-subline]') as HTMLElement).style.display).toBe('block');
    expect(container.querySelector('img')).toBeNull();
  });

  it('aligns the compact Pts header to the same auto figure track', () => {
    const { container } = render(<RankedPlayerHeader rankLabel="#" playerLabel="Player" statLabel="Pts" />);
    const header = container.firstElementChild as HTMLElement;
    expect(header.style.gridTemplateColumns).toBe('minmax(0,1fr) auto');
    expect(header.style.padding).toBe('10px 24px 6px');
    expect(screen.getByText('Pts').style.whiteSpace).toBe('nowrap');
  });
});