import type React from 'react';
import { adminTheme as t } from '../theme';

/**
 * Panel shells shared by the Command centre and the Inbox, so both pages
 * import one definition. Values with no theme token live here and nowhere else.
 */
export const RAISED = 'rgba(255,255,255,0.03)';
/** Echo's suggestion chip in the Inbox: a tint of the brand, never a fill. */
export const ECHO_GROUND = 'rgba(255,168,58,0.10)';
export const ECHO_EDGE = 'rgba(255,168,58,0.35)';

export const PANEL: React.CSSProperties = { background: t.surface, borderRadius: 16, padding: '14px 16px' };
export const LIST_PANEL: React.CSSProperties = { background: t.surface, borderRadius: 16, padding: '14px 0 4px' };
