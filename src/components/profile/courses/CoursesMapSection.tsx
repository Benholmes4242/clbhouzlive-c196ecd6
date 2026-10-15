/**
 * CoursesMapSection - where the member has played (profile Courses tab).
 *
 * Plot: react-simple-maps over the repo's own TopoJSON, Mercator fitted to the
 * member's plotted courses. No GL canvas (it fights the tab's scroll) and no
 * geocoding: a course without lat/lng is simply not plotted but still counts in
 * every figure and in the country tallies. Under 3 plotted courses there is no
 * plot and the country column takes the full width.
 *
 * Tallies come from useUserCourseSummary (sub_country) - never fetched again.
 */
import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import type { CountryTally, CoursePoint } from '@/hooks/useUserCourseSummary';

const GEO_URL = '/data/world-countries.json';
const MAX_ROWS = 5;
const MIN_POINTS = 3;
const PLOT_W = 174;
const PLOT_H = 150;
const OTHER_DOT = 'rgba(248,250,252,0.6)';

export interface MapPoint extends CoursePoint { isTop100: boolean }

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const invMercY = (y: number) => (Math.atan(Math.exp(y)) * 360) / Math.PI - 90;

/** Bounding box of the member's own courses plus a small margin. */
export function fitProjection(points: CoursePoint[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  let minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const padLng = Math.max((maxLng - minLng) * 0.12, 1.5);
  const padLat = Math.max((maxLat - minLat) * 0.12, 1.5);
  minLng -= padLng; maxLng += padLng;
  minLat = Math.max(-80, minLat - padLat); maxLat = Math.min(80, maxLat + padLat);
  const dx = ((maxLng - minLng) * Math.PI) / 180;
  const y0 = mercY(minLat), y1 = mercY(maxLat);
  const scale = Math.min(PLOT_W / dx, PLOT_H / (y1 - y0));
  return { center: [(minLng + maxLng) / 2, invMercY((y0 + y1) / 2)] as [number, number], scale };
}

interface Props {
  tallies: CountryTally[];
  points: MapPoint[];
  /** Courses that cannot be plotted even after the club fallback. */
  unmapped?: number;
}

export const CoursesMapSection: React.FC<Props> = ({ tallies, points, unmapped = 0 }) => {
  const showPlot = points.length >= MIN_POINTS;
  const fit = useMemo(() => (showPlot ? fitProjection(points) : null), [showPlot, points]);
  if (tallies.length === 0 && !showPlot) return null;

  const rows = tallies.slice(0, MAX_ROWS);
  const further = tallies.length - rows.length;
  const max = rows[0]?.courses || 1;

  return (
    <div className="px-4" style={{ fontFamily: SANS }}>
      <SectionHeader kicker="WHERE YOU'VE PLAYED" title="Your golf, plotted" />
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        {showPlot && fit && (
          <div data-testid="courses-map-plot" style={{ flex: 'none', width: 186, background: A.PANEL, borderRadius: 12, padding: 6 }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: fit.center, scale: fit.scale }}
              width={PLOT_W}
              height={PLOT_H}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="rgba(255,255,255,0.075)"
                      stroke="rgba(255,255,255,0.20)"
                      strokeWidth={0.9}
                      strokeLinejoin="round"
                      style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                    />
                  ))
                }
              </Geographies>
              {points.filter((p) => !p.isTop100).map((p) => (
                <Marker key={p.id} coordinates={[p.lng, p.lat]}>
                  <circle r={2.0} fill={OTHER_DOT} />
                </Marker>
              ))}
              {points.filter((p) => p.isTop100).map((p) => (
                <Marker key={p.id} coordinates={[p.lng, p.lat]}>
                  <circle r={5.6} fill={A.AMBER} fillOpacity={0.16} />
                  <circle r={2.7} fill={A.AMBER} />
                </Marker>
              ))}
            </ComposableMap>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
          {rows.map((r) => (
            <div key={r.country} data-testid="country-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 74, flex: 'none', fontSize: 10.5, fontWeight: 600, color: A.BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.country}
              </span>
              <span style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${(r.courses / max) * 100}%`, background: A.AMBER, opacity: 0.75, borderRadius: 3 }} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: A.BODY, fontVariantNumeric: 'tabular-nums', textAlign: 'right', minWidth: 14 }}>
                {r.courses}
              </span>
            </div>
          ))}
          {further > 0 && (
            <div data-testid="country-further" style={{ fontSize: 10, color: A.FAINT }}>+{further} further afield</div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 10.5, color: A.DIM }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: A.AMBER }} />Top 100 course
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: OTHER_DOT }} />Everything else
        </span>
        {unmapped > 0 && (
          <span data-testid="map-unmapped" style={{ fontSize: 10.5, color: A.FAINT }}>{unmapped} not yet mapped</span>
        )}
      </div>
    </div>
  );
};
