/** One page-level frost behind island-docked rows, never inside a sticky row.
 * Row owners report visibility/height; the shared chrome retains its layer. */
import { CHROME_CLEARANCE } from '@/lib/chromeClearance';

export function DockBlur({ visible, rowHeight }: { visible: boolean; rowHeight: number | string }) {
  const height = typeof rowHeight === 'number' ? `${rowHeight}px` : rowHeight;
  return <div aria-hidden data-dock-blur style={{
    position: 'fixed', top: 0, left: 0, right: 0,
    height: `calc(${CHROME_CLEARANCE} + ${height})`,
    background: 'var(--tour-dock-blur-ground)',
    WebkitBackdropFilter: 'var(--tour-dock-blur-filter)',
    backdropFilter: 'var(--tour-dock-blur-filter)',
    zIndex: 1, pointerEvents: 'none', opacity: visible ? 1 : 0,
    transition: 'opacity 150ms ease',
  }} />;
}