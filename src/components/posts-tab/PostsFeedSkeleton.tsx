/**
 * PostsFeedSkeleton — the shell for the profile Posts tab.
 *
 * The settled state is the Clubhouse `FeedCard` rendered by `LightCardFeed`:
 * header row (34px squircle avatar + name/meta), media frame, caption, then the
 * unified course band with the action row. The previous shell modelled a
 * magazine layout (hero review + longform + 2-up grid) that this tab has not
 * rendered for months, and it modelled it in LIGHT.
 *
 * Standing rule: a shell may never be larger than the settled state it resolves
 * into. So: ONE full card, and ONE clipped beneath it to say "more follows".
 */
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const Bar: React.FC<{ w: number | string; h: number; style?: React.CSSProperties }> = ({ w, h, style }) => (
  <Skeleton variant="dark" className="rounded-[4px]" style={{ width: w, height: h, ...style }} />
);

const CardShell: React.FC<{ clipped?: boolean }> = ({ clipped = false }) => (
  <div
    style={{
      background: A.PANEL,
      borderTop: `0.5px solid ${A.BORDER}`,
      borderBottom: clipped ? undefined : `0.5px solid ${A.BORDER}`,
      overflow: 'hidden',
      maxHeight: clipped ? 132 : undefined,
    }}
  >
    {/* Header — 34px squircle avatar, name, meta */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
      <Skeleton variant="dark" style={{ width: 34, height: 34, borderRadius: 12, flex: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, flex: 1 }}>
        <Bar w={132} h={12} />
        <Bar w={92} h={10} />
      </div>
    </div>

    {/* Caption — two clamped lines */}
    <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Bar w="88%" h={11} />
      <Bar w="54%" h={11} />
    </div>

    {/* Media frame — the card's 4:5 default */}
    <Skeleton variant="dark" className="rounded-none w-full" style={{ aspectRatio: '4 / 5' }} />

    {/* Course band + action row */}
    <div style={{ padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Bar w="62%" h={12} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Bar w={44} h={12} />
        <Bar w={44} h={12} />
        <Bar w={30} h={12} />
      </div>
    </div>
  </div>
);

export const PostsFeedSkeleton: React.FC = () => (
  <div className="flex flex-col gap-px pt-2" style={{ background: A.CANVAS }}>
    <CardShell />
    <CardShell clipped />
  </div>
);
