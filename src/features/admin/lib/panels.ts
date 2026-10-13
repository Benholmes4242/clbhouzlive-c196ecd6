import type React from 'react';
import { adminTheme as t } from '../theme';

/**
 * Panel shells shared by the Command centre and the Inbox, so both pages
 * import one definition. Values with no theme token live here and nowhere else.
 */
export const RAISED = 'rgba(255,255,255,0.03)';
export const TRACK = 'rgba(255,255,255,0.08)';
export const DORMANT_FILL = 'rgba(255,123,114,0.55)';
export const RADAR_CHART_FILL = 'rgba(255,255,255,0.06)';
export const RADAR_EVENT_DOT = 'rgba(233,237,243,0.4)';
export const RADAR_NEVER_EDGE = 'rgba(255,123,114,0.35)';
/** Members list (Main.html): Last seen bar segments and week dashes. */
export const INK_55 = 'rgba(233,237,243,0.55)';
export const INK_30 = 'rgba(233,237,243,0.3)';
export const WEEK_OFF = TRACK;
export const WEEK_PREJOIN = 'rgba(255,255,255,0.04)';
/** Echo's suggestion chip in the Inbox: a tint of the brand, never a fill. */
export const ECHO_GROUND = 'rgba(255,168,58,0.10)';
export const ECHO_EDGE = 'rgba(255,168,58,0.35)';

export const PANEL: React.CSSProperties = { background: t.surface, borderRadius: 16, padding: '14px 16px' };
export const LIST_PANEL: React.CSSProperties = { background: t.surface, borderRadius: 16, padding: '14px 0 4px' };
