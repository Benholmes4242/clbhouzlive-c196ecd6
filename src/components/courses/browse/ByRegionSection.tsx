import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHomeClubStatus } from '@/features/home-club/useHomeClubStatus';
import { openHomeClubPicker } from '@/features/home-club/homeClubPickerStore';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { GLASS_CHIP_CLASS } from '@/styles/glassChip';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useCourseBrowseTruth, type BrowseRegion } from '../useStatBrowse';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { fmtToPar, playsToPar, plural } from './format';
import { useSectionReady } from './PageLoadGate';
import { ByRegionShell } from './sectionShells';
import { pickRotating, readRotationIds, writeRotationIds } from './rotation';

/**
 * SECTION 02 — BY REGION (BRIEF_COURSES_PAGE_REBUILD §4, amended by
 * BRIEF_COURSES_PAGE_PHASE_1_CORRECTIONS §4). App-wide: never reads the
 * country/region params. A tile is the door to section 08 — it writes them
 * and scrolls there.
 */
export const ALL_COURSES_ANCHOR = 'courses-all';
/** Never more than five tiles (DEVICE_REVISION §4): lead + four, or five. */
const REGIONS_WITH_LEAD = 4;
const REGIONS_NO_LEAD = 5;
/* Tile geometry, read by the grid AND its shell (BRIEF_COURSES_SKELETONS 2.3). */
export const REGION_LEAD_H = 168;
export const REGION_TILE_H = 122;
export const REGION_GAP = 2;
export const REGION_TILES_NO_LEAD = REGIONS_NO_LEAD;
/** Non-lead tiles rotate per visit from the top REGION_POOL by rounds. */
export const REGION_POOL = 16;
export const REGION_LAST_KEY = 'courses.regionTiles.last';


/** The member's home region: primary_club_id → golf_courses.club_id → region. */
function useHomeRegion(clubId: string | null) {
  return useQuery({
    queryKey: ['courses-home-region', clubId],
    enabled: !!clubId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('region')
        .eq('club_id', clubId as string)
        .not('region', 'is', null)
        .limit(1);
      if (error) throw error;
      return ((data ?? [])[0] as { region: string | null } | undefined)?.region ?? null;
    },
  });
}

const NAME_SHADOW = '0 1px 6px rgba(0,0,0,0.55)';
const FACT_SHADOW = '0 1px 4px rgba(0,0,0,0.6)';

export function ByRegionSection() {
  const { user } = useSupabaseSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: truth, isLoading: truthLoading } = useCourseBrowseTruth();
  const home = useHomeClubStatus(user?.id);
  const homeRegionQuery = useHomeRegion(home.clubId);
  const homeRegion = homeRegionQuery.data ?? null;
  useSectionReady('byRegion', !homeRegionQuery.isLoading && !truthLoading && !home.isLoading);

  const rotated = useRef<{ lead: string | null; names: string[] } | null>(null);
  const regions = truth?.regions ?? [];
  const loading = truthLoading || home.isLoading || homeRegionQuery.isLoading;
  if (regions.length === 0) return loading ? <ByRegionShell /> : null;

  const lead = homeRegion ? regions.find((r) => r.region === homeRegion) ?? null : null;
  // Once per visit: the first pick after everything loads is held for the mount.
  if (!rotated.current && !loading) {
    const pool = [...regions].filter((r) => r !== lead).sort((a, b) => b.rounds - a.rounds).slice(0, REGION_POOL);
    const picked = pickRotating(pool, (r) => r.region, readRotationIds(REGION_LAST_KEY), lead ? REGIONS_WITH_LEAD : REGIONS_NO_LEAD);
    rotated.current = { lead: lead?.region ?? null, names: picked.map((r) => r.region) };
    writeRotationIds(REGION_LAST_KEY, rotated.current.names);
  }
  const held = rotated.current;
  const rest = held
    ? held.names.map((n) => regions.find((r) => r.region === n)).filter((r): r is BrowseRegion => !!r && r !== lead)
    : [];
  const tiles: Array<{ r: BrowseRegion; lead: boolean }> = [
    ...(lead ? [{ r: lead, lead: true }] : []),
    ...rest.map((r) => ({ r, lead: false })),
  ];


  const askHomeClub = !!user && !home.isLoading && !home.clubId;

  const open = (r: BrowseRegion) => {
    const params = new URLSearchParams(searchParams);
    if (r.subCountry) params.set('country', r.subCountry);
    else params.delete('country');
    params.set('region', r.region);
    setSearchParams(params, { replace: true });
    requestAnimationFrame(() =>
      document.getElementById(ALL_COURSES_ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  return (
    <section style={SECTION_WRAP}>
      <SectionHead
        tone="amber"
        kicker="Where to go"
        title="By region"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: REGION_GAP,
          marginLeft: -16,
          marginRight: -16,
          marginTop: HEAD_GAP,
        }}
      >
        {tiles.map(({ r, lead: isLead }, idx) => {
          // No lead + five tiles: the fifth spans so the grid closes cleanly.
          const spans = isLead || (!lead && idx === 4);
          const par = fmtToPar(r.avgToPar);
          const fact = isLead
            ? [plural(r.courses, 'course', 'courses'), plural(r.rounds, 'round', 'rounds'), playsToPar(r.avgToPar)]
            : [plural(r.courses, 'course', 'courses'), par];
          return (
            <button
              key={r.region}
              type="button"
              onClick={() => open(r)}
              style={{
                gridColumn: spans ? 'span 2' : undefined,
                height: isLead ? REGION_LEAD_H : REGION_TILE_H,
                padding: 0,
                border: 'none',
                borderRadius: 0,
                textAlign: 'left',
                cursor: 'pointer',
                background: 'transparent',
              }}
            >
              <CourseImageFallback
                courseId={r.imageCourseId}
                courseName={r.imageCourseName}
                imageUrl={r.imageUrl}
                style={{ height: '100%' }}
              >
                <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
                {isLead ? (
                  <span
                    className={GLASS_CHIP_CLASS}
                    style={{
                      position: 'absolute',
                      top: 11,
                      left: 12,
                      borderRadius: 999,
                      padding: '3px 8px',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#FFFFFF',
                    }}
                  >
                    Your patch
                  </span>
                ) : null}
                <div style={{ position: 'absolute', left: 12, right: 12, bottom: 11 }}>
                  <div
                    style={{
                      fontSize: isLead ? 26 : 19,
                      fontWeight: 700,
                      letterSpacing: isLead ? '-0.036em' : '-0.03em',
                      color: '#FFFFFF',
                      lineHeight: 1,
                      textShadow: NAME_SHADOW,
                    }}
                  >
                    {r.region}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.82)',
                      fontVariantNumeric: 'tabular-nums',
                      textShadow: FACT_SHADOW,
                    }}
                  >
                    {fact.filter(Boolean).join(' \u00B7 ')}
                  </div>
                </div>
              </CourseImageFallback>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 12, lineHeight: 1.5, color: A.DIM, marginTop: 8, marginBottom: 0 }}>
        Everywhere else is in the region filter at the foot of the page.
      </p>
      {askHomeClub ? (
        <p style={{ fontSize: 12, lineHeight: 1.5, color: A.DIM, marginTop: 12, marginBottom: 0 }}>
          Set your home club and your own region leads this list.{' '}
          <button
            type="button"
            onClick={() => openHomeClubPicker()}
            style={{ background: 'none', border: 'none', padding: 0, color: A.INK, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Set home club
          </button>
        </p>
      ) : null}
    </section>
  );
}
