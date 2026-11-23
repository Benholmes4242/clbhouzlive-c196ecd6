/**
 * Brief 16: the hero band's canonical section head (every section under the
 * hero photo). Renders through CanonSectionHead, shared with brief 15's
 * OverviewSectionHead. The wrapper carries the band's top gap
 * (--hero-head-gap, 28) and, with `inset`, the band's side padding
 * (--hero-head-side: 20, 16 under 340); sections that already pad their
 * sides pass inset={false}. Eyebrows stay on one line (ellipsis is only a
 * safety net); titles wrap and never ellipsize.
 */
import { CanonSectionHead } from '../../_shared/CanonSectionHead';
import './heroSectionHead.css';

export interface HeroSectionHeadProps {
  eyebrow: string;
  title: string;
  live?: boolean;
  action?: string;
  onAction?: () => void;
  /** Apply the band's side padding (default). Off inside already-padded sections. */
  inset?: boolean;
}

export function HeroSectionHead({ eyebrow, title, live, action, onAction, inset = true }: HeroSectionHeadProps) {
  return (
    <CanonSectionHead
      eyebrow={eyebrow} title={title} live={live} action={action} onAction={onAction}
      liveDot={<span data-hero-head-live aria-hidden style={{ width: 7, height: 7, flex: 'none', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 3px rgba(34,197,94,.18)' }} />}
      wrapperStyle={{ paddingTop: 'var(--hero-head-gap)', ...(inset ? { paddingLeft: 'var(--hero-head-side)', paddingRight: 'var(--hero-head-side)' } : {}) }}
      eyebrowTextStyle={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      attrs={{ head: { 'data-hero-head': true }, eyebrow: { 'data-hero-head-eyebrow': true }, title: { 'data-hero-head-title': true }, action: { 'data-hero-head-action': true } }}
    />
  );
}
