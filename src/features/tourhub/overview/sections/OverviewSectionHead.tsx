/**
 * Brief 15: the canonical overview section head — eyebrow (section name, with
 * an optional live dot) over a 21px title stating what the section found. The
 * action sits on the title's last line and never shrinks; the title wraps.
 * Renders through CanonSectionHead, shared with the hero band's HeroSectionHead.
 */
import { LIVE_DOT } from '../../_shared/tokens';
import { CanonSectionHead } from '../../_shared/CanonSectionHead';

interface OverviewSectionHeadProps {
  eyebrow: string;
  title: string;
  live?: boolean;
  action?: string;
  onAction?: () => void;
}

export function OverviewSectionHead({ eyebrow, title, live, action, onAction }: OverviewSectionHeadProps) {
  return (
    <CanonSectionHead
      eyebrow={eyebrow} title={title} live={live} action={action} onAction={onAction}
      liveDot={<span data-overview-live-dot aria-hidden style={{ color: LIVE_DOT }}>●</span>}
      wrapperStyle={{ margin: '0 24px 10px' }}
      attrs={{ head: { 'data-overview-head': true }, eyebrow: { 'data-overview-eyebrow': true }, title: { 'data-overview-title': true }, action: { 'data-overview-action': true } }}
    />
  );
}
