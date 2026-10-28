import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ScorecardGlassOverlay } from '@/features/courses/_shared/scorecard/ScorecardGlassOverlay';

afterEach(cleanup);
function surface(open: boolean, presentation: 'overlay' | 'page' = 'overlay', contentReady = true) {
  return <><button>Hole 7</button><ScorecardGlassOverlay open={open} presentation={presentation} contentReady={contentReady} onClose={vi.fn()}><button>Hole 7</button></ScorecardGlassOverlay></>;
}
describe('glass modal accessibility', () => {
  it('mounted open overlay hides background controls and exposes only the card control', () => {
    const view = render(surface(true));
    expect(screen.getAllByRole('button', { name: 'Hole 7' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Hole 7' }).closest('[data-scorecard-glass-card]')).not.toBeNull();
    expect(view.container).toHaveAttribute('aria-hidden', 'true');
  });
  it('close restores the background during the exit animation', async () => {
    const view = render(surface(true));
    view.rerender(surface(false));
    expect(view.container).not.toHaveAttribute('aria-hidden');
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Hole 7' })).toHaveLength(1));
    expect(screen.getByRole('button', { name: 'Hole 7' }).closest('[data-scorecard-glass-card]')).toBeNull();
  });
  it('unmount restores other content without removing existing aria-hidden values', () => {
    const background = render(<><button>Background</button><div aria-hidden="true">Already hidden</div></>);
    const overlay = render(<ScorecardGlassOverlay open onClose={vi.fn()}><button>Card</button></ScorecardGlassOverlay>);
    expect(screen.queryByRole('button', { name: 'Background' })).toBeNull();
    overlay.unmount();
    expect(screen.getByRole('button', { name: 'Background' })).toBeInTheDocument();
    expect(background.container.querySelector('[aria-hidden=true]')).toHaveTextContent('Already hidden');
  });
  it('page presentation and unmounted not-ready overlays leave background accessible', () => {
    const view = render(surface(true, 'overlay', false));
    expect(view.container).not.toHaveAttribute('aria-hidden');
    expect(screen.getAllByRole('button', { name: 'Hole 7' })).toHaveLength(1);
    view.rerender(surface(true, 'page'));
    expect(view.container).not.toHaveAttribute('aria-hidden');
    expect(screen.getAllByRole('button', { name: 'Hole 7' })).toHaveLength(2);
  });
});