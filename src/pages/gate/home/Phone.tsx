/** WEB_HOMEPAGE_2 phone frame: every phone is a real published screenshot from /web-home/. */
export type Shot = 'feed' | 'scorecard' | 'course' | 'club' | 'explore';
export function Phone({ shot, eager = false, style, className = '' }: { shot: Shot; eager?: boolean; style?: React.CSSProperties; className?: string }) {
  return <div className={`phone ${className}`.trim()} style={style}><div className="screen shot"><img src={`/web-home/${shot}.webp`} alt="" width={750} height={1626} loading={eager ? 'eager' : 'lazy'} {...(eager ? { fetchpriority: 'high' } : {})} data-shot={shot}/></div></div>;
}
export const PAUSE_ICON = <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden><rect x="2" y="1" width="3" height="10" rx="1"/><rect x="7" y="1" width="3" height="10" rx="1"/></svg>;
export const PLAY_ICON = <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden><path d="M3 1.5l7 4.5-7 4.5z"/></svg>;
/** Trailing full stop in amber; amber appears nowhere else on the page except the logo. */
export function Dotted({ text }: { text: string }) { return text.endsWith('.') ? <>{text.slice(0, -1)}<span className="dot">.</span></> : <>{text}</>; }
