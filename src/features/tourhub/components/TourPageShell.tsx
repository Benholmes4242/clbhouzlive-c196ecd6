/**
 * TourPageShell — the Tour surfaces' call of the SHARED app header.
 *
 * BRIEF_TOUR_HEADER_CORRECTION, Correction 1. There is no bespoke Tour bar any
 * more. This shell mounts `src/components/chrome/AppHeader.tsx` — the same
 * component Discover mounts — and differs from Discover in exactly one way:
 * the LEFT SLOT. Tour passes a glass burger (or, on a pushed sub-page, the back
 * control); Discover passes nothing and gets the clbhouz mark. The right
 * cluster (search / handicap pill / avatar), the 42px control row, the optional
 * tab strip and the 1px A.BORDER all come from the shared component.
 *
 * WHY THE OLD `right` PROP IS IGNORED. The right side of the control row is
 * Discover's cluster, identically. The hub's tour-menu button moved to the left
 * slot as the burger; nothing else ever passed `right`.
 *
 * WHO PAYS THE SAFE AREA. Nobody here. Tour routes are out of
 * IMMERSIVE_ROUTE_PREFIXES, so `.app-shell` pays var(--sat) once and the header
 * sticks directly beneath it (`inset="shell"`). A page that also paid it would
 * open the gap the brief calls out above the hero.
 *
 * Sticky rows inside `children` lock to `var(--tour-header-h)`, published by
 * the shared header.
 */
import { ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { AppHeader, type AppHeaderTab } from '@/components/chrome/AppHeader';
import { useSetChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import { safeGoBack } from '@/utils/navigation';

const SF_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  title: string;
  /** Optional second line under the title (a11y labelling only — no visible title). */
  subtitle?: string;
  children: ReactNode;
  /** DEPRECATED: the right cluster is Discover's, identically. Ignored. */
  right?: ReactNode;
  /** Extra control placed in the LEFT slot, after the back / burger control. */
  leftAccessory?: ReactNode;
  /** Replaces the default left control entirely (the hub passes its burger). */
  leftSlot?: ReactNode;
  /** Rendered on the canvas immediately below the header (e.g. the chip rail). */
  belowTitle?: ReactNode;
  /** Foot tab strip — only when the surfaces really are tabbed siblings. */
  tabs?: ReadonlyArray<AppHeaderTab>;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  onBack?: () => void;
  backFallback?: string;
  showBack?: boolean;
  /** DEPRECATED: no Tour surface is immersive. Accepted and ignored. */
  immersive?: boolean;
  background?: string;
}

export function TourPageShell({
  title: _title,
  subtitle: _subtitle,
  children,
  right: _rightIgnored,
  leftAccessory,
  leftSlot,
  belowTitle,
  tabs,
  activeTab,
  onTabChange,
  onBack,
  backFallback = '/tourhub',
  showBack = true,
  immersive: _immersiveIgnored = false,
  background = A.CANVAS,
}: Props) {
  const navigate = useNavigate();

  // One chrome only: the global island stands down while this shell is mounted.
  useSetChromeSuppressed(true);

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else safeGoBack(navigate, backFallback);
  }, [onBack, navigate, backFallback]);

  const left = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {leftSlot ??
        (showBack ? (
          <button
            onClick={handleBack}
            aria-label="Back"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: A.PANEL,
              border: `1px solid ${A.BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={18} strokeWidth={2.5} style={{ color: A.INK }} />
          </button>
        ) : null)}
      {leftAccessory}
    </div>
  );

  return (
    <div style={{ background, minHeight: '100vh', fontFamily: SF_STACK, position: 'relative' }}>
      <AppHeader
        left={left}
        tabs={tabs}
        active={activeTab}
        onTabChange={onTabChange}
        tabsAriaLabel="Tour sections"
        inset="shell"
        heightVar="--tour-header-h"
      />
      {belowTitle}
      {children}
    </div>
  );
}

export default TourPageShell;
