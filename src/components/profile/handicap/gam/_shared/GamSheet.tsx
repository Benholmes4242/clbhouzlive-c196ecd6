import React from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface GamSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Canonical wrapper for every gam_* bottom sheet.
 *
 * Why this exists:
 * - `BottomSheet` portals to `document.body`, which lives OUTSIDE the
 *   `PageRoot` `.hcp-dark` scope. Without re-applying `hcp-dark` inside the
 *   portal, all `var(--hcp-*)` tokens resolve to nothing and the sheet renders
 *   broken/invisible.
 * - The spec for gam_* sheets is "sticky header + scrollable body", which needs
 *   the sheet root to be a flex column with a bounded max-height so the body
 *   div can `flex: 1; min-height: 0; overflow-y: auto` and scroll internally.
 *
 * Use this for ALL gam_* sheets. Do not call `BottomSheet` directly.
 */
export const GamSheet: React.FC<GamSheetProps> = ({ open, onClose, children }) => (
  <BottomSheet
    open={open}
    onClose={onClose}
    className="hcp-dark"
    style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--hcp-bg-0)',
      height: '80dvh',
      maxHeight: '80dvh',
      minHeight: 0,
    }}
  >
    {children}
  </BottomSheet>
);

export default GamSheet;
