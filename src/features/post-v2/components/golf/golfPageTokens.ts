/** The signed-off post page's values (post-page-signed-off.html). One owner so
 * the strip, sections, sheet and bar cannot drift. No negative letter-spacing. */
export const GP = {
  canvas: '#0A0A0C',
  panel: '#16161A',
  ink: '#F8FAFC',
  onInk: '#0A0A0C',
  mute: 'rgba(248,250,252,0.62)',
  dim: 'rgba(248,250,252,0.42)',
  line: 'rgba(255,255,255,0.10)',
  line2: 'rgba(255,255,255,0.16)',
  green: '#3DDC97',
  sheet: '#17171C',
} as const;

export const sectionLabel: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GP.dim,
  marginBottom: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
};
export const labelAction: React.CSSProperties = {
  background: 'none', border: 0, fontSize: 12, fontWeight: 700, letterSpacing: 0, textTransform: 'none', color: GP.mute, cursor: 'pointer', padding: 0,
};
export const chipStyle = (on: boolean): React.CSSProperties => ({
  flex: 'none', height: 36, borderRadius: 999, padding: '0 14px', fontSize: 13.5, fontWeight: 600,
  border: `1px solid ${on ? GP.ink : GP.line2}`, background: on ? GP.ink : 'transparent', color: on ? GP.onInk : GP.ink,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
});
