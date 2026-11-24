/** Tournament heads share the canonical primitive; tv-section alone owns
 * the gutter and seam, while this wrapper owns the existing 12px title gap. */
import type { ReactNode } from 'react';
import { CanonSectionHead } from '../../_shared/CanonSectionHead';

export interface TournamentSectionHeadProps {
  eyebrow: string;
  title: string;
  live?: boolean;
  action?: string;
  onAction?: () => void;
  trailing?: ReactNode;
}

export function TournamentSectionHead(props: TournamentSectionHeadProps) {
  return <CanonSectionHead {...props}
    liveDot={<span className="tv-head-live" data-tv-head-live aria-hidden />}
    wrapperStyle={{ marginBottom: 12 }}
    attrs={{ head: { 'data-tv-head': true }, eyebrow: { 'data-tv-head-eyebrow': true }, title: { 'data-tv-head-title': true }, action: { 'data-tv-head-action': true } }}
  />;
}