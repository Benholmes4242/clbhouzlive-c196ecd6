/**
 * tourIslandIcons — the signed-off icon paths from tour-island-signed-off.html
 * (the mock's P table), shared by the Tour island and TourGlance. These are
 * NOT lucide: the paths are part of the signed-off spec, so they live here
 * verbatim. strokeLinecap/join round, fill none.
 */
import React from 'react';

type PathSpec = ['circle', { cx: number; cy: number; r: number }] | ['rect', { x: number; y: number; width: number; height: number; rx: number }] | ['path', string];

export const TOUR_ICON_PATHS: Record<string, PathSpec[]> = {
  globe: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', 'M3 12h18'], ['path', 'M12 3a14 14 0 0 1 0 18'], ['path', 'M12 3a14 14 0 0 0 0 18']],
  down: [['path', 'm6 9 6 6 6-6']],
  check: [['path', 'M20 6 9 17l-5-5']],
  compass: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', 'm15.5 8.5-2 5-5 2 2-5z']],
  news: [['rect', { x: 4, y: 4, width: 16, height: 16, rx: 2.5 }], ['path', 'M8 9h8'], ['path', 'M8 13h8'], ['path', 'M8 17h5']],
  trophy: [['path', 'M7 4h10v5a5 5 0 0 1-10 0z'], ['path', 'M7 6H4a3 3 0 0 0 3 4'], ['path', 'M17 6h3a3 3 0 0 1-3 4'], ['path', 'M12 14v4'], ['path', 'M8 20h8']],
  cal: [['rect', { x: 4, y: 5, width: 16, height: 15, rx: 2.5 }], ['path', 'M4 10h16'], ['path', 'M9 3v4'], ['path', 'M15 3v4']],
  users: [['circle', { cx: 9, cy: 8, r: 3.5 }], ['path', 'M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6'], ['path', 'M16 4.5a3.5 3.5 0 0 1 0 7'], ['path', 'M18 14c2 .7 3 2.6 3 6']],
  board: [['path', 'M4 20V10'], ['path', 'M10 20V4'], ['path', 'M16 20v-7'], ['path', 'M3 20h18']],
};

export type TourIconName = keyof typeof TOUR_ICON_PATHS;

export function TourIcon({ n, s = 20, c = '#F8FAFC', w = 1.9 }: { n: TourIconName; s?: number; c?: string; w?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }} aria-hidden="true">
      {TOUR_ICON_PATHS[n].map((spec, i) => {
        const [tag, a] = spec;
        return tag === 'path'
          ? <path key={i} d={a as string} />
          : tag === 'circle'
            ? <circle key={i} {...(a as { cx: number; cy: number; r: number })} />
            : <rect key={i} {...(a as { x: number; y: number; width: number; height: number; rx: number })} />;
      })}
    </svg>
  );
}

/** The green live dot with its halo (island caption, tile rows, Leaderboards tile). */
export function TourLiveDot({ s = 5 }: { s?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: s, height: s, borderRadius: s, background: '#34D77F',
        boxShadow: '0 0 0 3px rgba(52,215,127,0.22)', display: 'inline-block', flexShrink: 0,
      }}
    />
  );
}
