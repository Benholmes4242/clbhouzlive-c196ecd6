import React from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface GamSheetProps {
  open: boolean;
  onClose: () => void;
  /**
   * The ONE surface colour for the whole sheet: grabber strip, body, and the
   * area behind the home indicator. Content inside must NOT paint its own
   * full-bleed background — pass it here instead so there is one owner.
   * Defaults to the historical gam shell dark.
   */
  surface?: string;
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
export const GamSheet: React.FC<GamSheetProps> = ({
  open,
  onClose,
  surface = '#15171F',
  children,
}) => (
  <BottomSheet
    open={open}
    onClose={onClose}
    className="hcp-dark [&>div:first-child]:absolute [&>div:first-child]:top-0 [&>div:first-child]:left-0 [&>div:first-child]:right-0 [&>div:first-child]:z-20 [&>div:first-child>div]:!bg-slate-900/20"
    style={{
      display: 'flex',
      flexDirection: 'column',
      background: surface,

      height: 'auto',
      maxHeight: '95dvh',
      minHeight: 0,
      overflow: 'hidden',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    }}
  >
    {children}
  </BottomSheet>
);

export default GamSheet;
