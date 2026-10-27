/**
 * CB115 — "Their followers" for every non-club business, after
 * BusinessNearbyCourses (or BusinessYouCard when there is no nearby card).
 * One read: get_business_follower_golf. Every privacy floor (10 handicaps for
 * the mix, 3 golfers per course, 3 courses max) lives in the function; the
 * client renders what it returns and recomputes nothing. Nothing renders until
 * the read settles; a failed read or null result means no card (state D).
 * The viewer's band comes from useWhsConnection → useHandicapTrend.current.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/i18n/format';
import { shortCourseName } from '@/features/courses/_shared/courseLabel';
import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { useHandicapTrend, useWhsConnection } from '@/lib/whs/hooks';

const T = {
  card: '#17171B', ink: '#F8FAFC', mute: 'rgba(248,250,252,0.62)', dim: 'rgba(248,250,252,0.42)',
  hair: 'rgba(255,255,255,0.08)', track: 'rgba(255,255,255,0.06)', fill: 'rgba(248,250,252,0.38)',
} as const;
const TAB = { fontVariantNumeric: 'tabular-nums' } as const;

export type BandKey = 'under5' | 'b5' | 'b10' | 'b15' | 'b20';
export const BANDS: Array<{ key: BandKey; label: string }> = [
  { key: 'under5', label: 'Under 5' }, { key: 'b5', label: '5\u201310' }, { key: 'b10', label: '10\u201315' },
  { key: 'b15', label: '15\u201320' }, { key: 'b20', label: '20+' },
];
export interface FollowerGolf {
  handicap_count: number | null;
  bands: Record<BandKey, number> | null;
  courses: Array<{ course_id: string; name: string; thumbnail_image: string | null; rounds: number; golfers: number }>;
}

/** Plus handicaps (negative) fall in Under 5. */
export function bandFor(h: number | null | undefined): BandKey | null {
  if (h == null || !Number.isFinite(h)) return null;
  if (h < 5) return 'under5';
  if (h < 10) return 'b5';
  if (h < 15) return 'b10';
  if (h < 20) return 'b15';
  return 'b20';
}
export const bandPct = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

export function useBusinessFollowerGolf(businessId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['business-follower-golf', businessId ?? null],
    enabled: enabled && !!businessId,
    staleTime: 60_000,
    queryFn: async (): Promise<FollowerGolf | null> => {
      const { data, error } = await (supabase as unknown as { rpc: (n: string, a: unknown) => Promise<{ data: unknown; error: unknown }> })
        .rpc('get_business_follower_golf', { p_business_id: businessId });
      if (error) throw error;
      if (!data || typeof data !== 'object') return null;
      const d = data as Partial<FollowerGolf>;
      return { handicap_count: d.handicap_count ?? null, bands: d.bands ?? null, courses: Array.isArray(d.courses) ? d.courses : [] };
    },
  });
}

export function BusinessFollowersCard({ isClub, businessId, viewerId }: { isClub: boolean; businessId: string; viewerId?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const q = useBusinessFollowerGolf(businessId, !isClub);
  const { data: connection } = useWhsConnection(isClub ? undefined : viewerId);
  const { data: trend } = useHandicapTrend((connection as { id?: string } | null | undefined)?.id);
  if (isClub || q.isLoading || q.isError || !q.data) return null;
  const { handicap_count, bands, courses } = q.data;
  const showMix = bands != null && handicap_count != null && handicap_count > 0;
  const showCourses = courses.length > 0;
  if (!showMix && !showCourses) return null;
  const mine = bandFor((trend as { current?: number | null } | null | undefined)?.current ?? null);

  return (
    <section data-business-followers style={{ background: T.card, border: `1px solid ${T.hair}`, borderRadius: 18, padding: 16, margin: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>
          {t('business.followers.kicker', { defaultValue: 'Their followers' })}
        </span>
        {handicap_count != null && (
          <span data-followers-count style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}>
            {t('business.followers.withHandicap', { count: handicap_count, n: formatNumber(handicap_count), defaultValue: `${formatNumber(handicap_count)} with a handicap` })}
          </span>
        )}
      </div>

      {showMix && (
        <div data-followers-mix>
          {BANDS.map(({ key, label }) => {
            const n = bands![key] ?? 0;
            const pct = bandPct(n, handicap_count!);
            const me = mine === key;
            return (
              <div key={key} data-band={key} data-band-me={me ? '' : undefined}
                style={{ display: 'grid', gridTemplateColumns: '70px minmax(0,1fr) 40px', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 12.5, ...TAB }}>
                <span style={{ color: me ? T.ink : T.mute, fontWeight: me ? 600 : undefined, whiteSpace: 'nowrap' }}>
                  {t(`business.followers.band.${key}`, { defaultValue: label })}
                  {me && (
                    <span data-band-you style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.dim, marginLeft: 5 }}>
                      {t('business.followers.you', { defaultValue: 'You' })}
                    </span>
                  )}
                </span>
                <span style={{ height: 6, borderRadius: 3, background: T.track, overflow: 'hidden' }}>
                  <i data-band-fill style={{ display: 'block', height: '100%', borderRadius: 3, width: `${(n / handicap_count!) * 100}%`, background: me ? T.ink : T.fill }} />
                </span>
                <span data-band-value style={{ textAlign: 'right', color: me ? T.ink : T.mute, fontWeight: me ? 600 : undefined }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {showCourses && (
        <div data-followers-courses style={showMix ? { marginTop: 16, paddingTop: 10, borderTop: `1px solid ${T.hair}` } : { marginTop: -8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, marginBottom: 8 }}>
            {t('business.followers.wherePlay', { defaultValue: 'Where they play most' })}
          </div>
          {courses.map((c, i) => (
            <button key={c.course_id} type="button" data-followers-course={c.course_id} onClick={() => navigate(`/courses/${c.course_id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 0', background: 'transparent', border: 0,
                borderTop: `1px solid ${T.hair}`, textAlign: 'left', cursor: 'pointer', color: T.ink }}>
              <span style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, overflow: 'hidden', flex: 'none' }}>
                {c.thumbnail_image
                  ? <img src={c.thumbnail_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <CourseImageFallback />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {shortCourseName(c.name)}
                </span>
                <span data-followers-meta style={{ display: 'block', marginTop: 2, fontSize: 12.5, color: T.mute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...TAB }}>
                  {i === 0
                    ? t('business.followers.firstRounds', { count: c.rounds, n: formatNumber(c.rounds), defaultValue: c.rounds === 1 ? '1 of their rounds in the last 12 months' : `${formatNumber(c.rounds)} of their rounds in the last 12 months` })
                    : t('business.followers.rounds', { count: c.rounds, n: formatNumber(c.rounds), defaultValue: c.rounds === 1 ? '1 round' : `${formatNumber(c.rounds)} rounds` })}
                </span>
              </span>
              <span style={{ color: T.dim, flex: 'none' }}>›</span>
            </button>
          ))}
        </div>
      )}

      <p data-followers-foot style={{ margin: '12px 0 0', fontSize: 12, lineHeight: 1.45, color: T.dim }}>
        {showCourses
          ? t('business.followers.footCourses', { defaultValue: 'From followers who show their handicap publicly. A course appears once 3 of them have played it.' })
          : t('business.followers.footMix', { defaultValue: 'From followers who show their handicap publicly.' })}
      </p>
    </section>
  );
}
