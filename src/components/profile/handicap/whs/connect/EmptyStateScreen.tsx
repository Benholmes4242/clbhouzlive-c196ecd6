import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHomeClubStatus } from '@/features/home-club/useHomeClubStatus';
import { openHomeClubPicker } from '@/features/home-club/homeClubPickerStore';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { formatNumber } from '@/i18n/format';
import { connectReach } from '@/lib/whs/connectReach';
import { useConnectIntroCourse, type ConnectIntroCourse } from './useConnectIntroCourse';
import { DIM, INK, AMBER, NUM, FONT } from './designTokens';
import { FooterBar, Stage } from './Primitives';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
  layout?: 'page' | 'embedded';
}

type CirclePerson = { user_id: string; name: string; avatar_url: string | null; club: string | null; index: number };
type CirclePreview = { circle: number; connected: number; people: CirclePerson[] };

const PROMISES = ['analyse', 'leaderboards', 'topTen', 'community'] as const;
const PROMISE_RULE = 'rgba(255,255,255,0.11)';
const GROUND = '#0A0A0C';
const SOFT_INK = '#F3F5F7';
const MID = '#C9CED6';
const QUIET = '#9AA3AF';
const DIMMER = '#6B7380';
const BAR = '#3A3F47';
const GOOD = '#4ADE80';
const HAIR = 'rgba(255,255,255,0.08)';
const SECTION_DIVIDED: React.CSSProperties = { marginTop: 36, paddingTop: 36, borderTop: `1px solid ${HAIR}` };
const SAID_HAIR = 'rgba(255,255,255,0.12)';
const FAINT_HAIR = 'rgba(255,255,255,0.06)';
const AMBER_DASH = 'rgba(247,147,30,0.6)';
const AMBER_DASH_STRONG = 'rgba(247,147,30,0.7)';
const AMBER_ROW = 'rgba(247,147,30,0.07)';
const STEP_BG = 'rgba(255,255,255,0.06)';
const AVATAR_BG = 'rgba(255,255,255,0.08)';

const TRUST_STEPS = ['1', '2', '3'] as const;

const EXAMPLE = {
  bars: [64, 46, 57, 36, 72, 43, 54, 32, 61, 50, 39, 68, 46, 36, 57, 43, 75, 50, 39, 54],
  counters: new Set([1, 3, 5, 7, 10, 13, 15, 18]),
} as const;

const courseNameSuffixes = [
  ' Golf & Country Club',
  ' Golf and Country Club',
  ' Golf Club',
  ' Golf Links',
  ' Golf Course',
  ' Golf Centre',
  ' Golf Resort',
];

export function displayCourseName(name: string): string {
  const bracketExpanded = name.replace(/\(([^)]+)\)/g, (_match, raw: string) => ` ${raw.replace(/\s+Course$/i, '')}`);
  let out = bracketExpanded;
  for (const suffix of courseNameSuffixes) {
    out = out.replace(new RegExp(suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
  }
  out = out.replace(/\s+/g, ' ').trim();
  return out.length >= 3 ? out : name.trim();
}

export function startingHandicap(args: { egHandicapIndex?: number | null; manualHandicapIndex?: number | null }): number {
  const resolved = resolveDisplayHandicap({
    egHandicapIndex: args.egHandicapIndex ?? null,
    manualHandicapIndex: args.manualHandicapIndex ?? null,
    hasWhsConnection: false,
  });
  const raw = resolved.value == null ? 18 : Math.round(resolved.value);
  return Math.max(0, Math.min(36, raw));
}

export function signedOne(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  if (Object.is(rounded, -0) || rounded === 0) return '0.0';
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1).replace('-', '−');
}

export function formatIndex(n: number): string {
  return n < 0 ? `+${Math.abs(n).toFixed(1)}` : n.toFixed(1);
}

export function nextFooterHidden(current: boolean, ratio: number): boolean {
  if (ratio >= 0.6) return true;
  if (ratio < 0.3) return false;
  return current;
}

export function chooseCirclePeople(people: CirclePerson[], h: number): CirclePerson[] {
  if (people.length <= 4) return [...people].sort((a, b) => a.index - b.index);
  return [...people]
    .sort((a, b) => {
      const dist = Math.abs(a.index - h) - Math.abs(b.index - h);
      return dist || b.index - a.index;
    })
    .slice(0, 4)
    .sort((a, b) => a.index - b.index);
}

function useOwnIntroProfile(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['connect-intro-profile', userId ?? ''],
    enabled: !!userId && enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<{ eg_handicap_index: number | null; manual_handicap_index: number | null } | null> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('eg_handicap_index, manual_handicap_index')
        .eq('id', userId as string)
        .maybeSingle();
      if (error) throw error;
      return data as { eg_handicap_index: number | null; manual_handicap_index: number | null } | null;
    },
  });
}

function useConnectCirclePreview(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['connect-circle-preview', userId ?? ''],
    enabled: !!userId && enabled,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<CirclePreview> => {
      const { data, error } = await supabase.rpc('get_connect_circle_preview');
      if (error) throw error;
      const raw = (data ?? {}) as Partial<CirclePreview>;
      return {
        circle: Number(raw.circle ?? 0),
        connected: Number(raw.connected ?? 0),
        people: Array.isArray(raw.people) ? (raw.people as CirclePerson[]) : [],
      };
    },
  });
}

function useFittedThreeLine(deps: React.DependencyList) {
  const ref = React.useRef<HTMLHeadingElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '40px';
      const spans = Array.from(el.children) as HTMLElement[];
      const widest = Math.max(1, ...spans.map((s) => s.scrollWidth));
      const next = Math.max(30, Math.min(40, (40 * (el.clientWidth - 2)) / widest));
      el.style.fontSize = `${next}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

const LegacyFallback: React.FC<Props> = ({ onPickCountry, onDecline, layout = 'page' }) => {
  const { t } = useTranslation('handicap');
  const immersive = layout === 'page';
  return (
    <>
      <Stage fill>
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 0 auto' }}>
          <div style={{ height: 120, flexShrink: 0 }} />
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: AMBER, marginBottom: 14 }}>
            {t('whsConnect.intro.kicker')}
          </div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.02, color: INK }}>
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{t('whsConnect.intro.headlineLine1')}</span>
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{t('whsConnect.intro.headlineLine2')}</span>
          </h1>
          <div style={{ marginTop: 'auto', paddingTop: 40, display: 'flex', flexDirection: 'column' }}>
            {PROMISES.map((key, i) => (
              <div key={key} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 0', borderTop: i === 0 ? undefined : `1px solid ${PROMISE_RULE}` }}>
                <div style={{ ...NUM, width: 24, flexShrink: 0, paddingTop: 4, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: AMBER, whiteSpace: 'nowrap' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: INK }}>{t(`whsConnect.intro.promises.${key}.title`)}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.42, color: DIM, marginTop: 3 }}>{t(`whsConnect.intro.promises.${key}.line`)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Stage>
      {immersive ? (
        <FooterBar>
          <button type="button" onClick={onPickCountry} style={primaryCtaStyle}>{t('whsConnect.intro.cta')}</button>
          {onDecline ? <DeclineButton onClick={onDecline} /> : null}
        </FooterBar>
      ) : null}
    </>
  );
};

const primaryCtaStyle: React.CSSProperties = {
  width: '100%',
  height: 56,
  borderRadius: 16,
  border: 'none',
  background: SOFT_INK,
  color: GROUND,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: FONT,
  fontSize: 17,
  fontWeight: 700,
  cursor: 'pointer',
};

const DeclineButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} style={{ height: 36, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', fontFamily: FONT, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: QUIET, cursor: 'pointer' }}>
    <IntroText k="decline" />
  </button>
);

const IntroText: React.FC<{ k: string; options?: Record<string, unknown> }> = ({ k, options }) => {
  const { t } = useTranslation('handicap');
  return <>{t(`whsConnect.intro.${k}`, options)}</>;
};

/** The intro and course You tab share the inclusive course-stats verdict source and availability gate. */
const FirstScreen: React.FC<{
  course: ConnectIntroCourse;
  avgOverPar: number;
  rounds: number;
  hasHomeClub: boolean;
  onChange: () => void;
}> = ({ course, avgOverPar, rounds, hasHomeClub, onChange }) => {
  const { t } = useTranslation('handicap');
  const courseName = displayCourseName(course.courseName);
  const headlineRef = useFittedThreeLine([course.courseName, avgOverPar]);
  const labelStyle: React.CSSProperties = { width: 92, flexShrink: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.25, color: DIM };
  const valueStyle: React.CSSProperties = { width: 44, flexShrink: 0, textAlign: 'right', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: SOFT_INK, ...NUM };
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: QUIET }}>{t(course.source === 'home' ? 'whsConnect.intro.homeClubKicker' : 'whsConnect.intro.top100Kicker')}</span>
        <button type="button" onClick={onChange} style={{ background: 'none', border: 'none', padding: 0, fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: QUIET, cursor: 'pointer' }}>{t(hasHomeClub ? 'whsConnect.intro.change' : 'whsConnect.intro.setHomeClub')}</button>
      </div>
      <h1 ref={headlineRef} style={{ margin: '12px 0 0', fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.02, color: SOFT_INK }}>
        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{courseName}</span>
        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{t('whsConnect.intro.fieldHeadlineLine2', { shots: avgOverPar.toFixed(1) })}</span>
        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{t('whsConnect.intro.fieldHeadlineLine3')}</span>
      </h1>
      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flexShrink: 0, fontSize: 46, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: SOFT_INK, ...NUM }}>{signedOne(avgOverPar)}</span>
        <span><span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: SOFT_INK }}>{t('whsConnect.intro.fieldOver')}</span><span style={{ display: 'block', marginTop: 2, fontSize: 12, color: DIMMER }}>{t('whsConnect.intro.fieldAcross', { rounds: formatNumber(rounds) })}</span></span>
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={labelStyle}>{t('whsConnect.intro.fieldLabel')}</div>
          <div style={{ flex: 1, height: 10, borderRadius: 5, background: FAINT_HAIR, overflow: 'hidden' }}><div style={{ width: '100%', height: '100%', borderRadius: 5, background: SOFT_INK }} /></div>
          <div style={valueStyle}>{signedOne(avgOverPar)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={labelStyle}>{t('whsConnect.intro.youLabel')}</div>
          <div style={{ flex: 1, height: 10, borderRadius: 5, border: `1.5px dashed ${AMBER_DASH}`, boxSizing: 'border-box' }} />
          <div style={{ ...valueStyle, letterSpacing: 0, color: AMBER }}>?</div>
        </div>
      </div>
      <div style={{ marginTop: 18, paddingLeft: 12, borderLeft: `2px solid ${SAID_HAIR}`, fontSize: 14, lineHeight: 1.5, color: MID }}>
        <Trans t={t} i18nKey="whsConnect.intro.fieldSaid" values={{ courseName }} components={{ 1: <b style={{ color: SOFT_INK }} />, 3: <b style={{ color: SOFT_INK }} /> }} />
      </div>
    </>
  );
};

const IntroFooter: React.FC<{ hidden: boolean; display: boolean; onTransitionEnd: () => void; onPickCountry: () => void; onDecline?: () => void; h: number; circleShown: boolean }> = ({ hidden, display, onTransitionEnd, onPickCountry, onDecline, h, circleShown }) => {
  const { t } = useTranslation('handicap');
  const cta = () => {
    analyticsEvents.track('connect_intro_cta', { h, place: 'footer', circle_shown: circleShown });
    onPickCountry();
  };
  return (
    <div aria-hidden={hidden} onTransitionEnd={onTransitionEnd} style={{ padding: '18px 24px 30px', paddingBottom: 'calc(30px + env(safe-area-inset-bottom, 0px))', display: display ? 'flex' : 'none', flexDirection: 'column', gap: 12, background: GROUND, borderTop: `1px solid ${FAINT_HAIR}`, transform: hidden ? 'translateY(100%)' : 'translateY(0)', opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto', transition: 'transform 200ms ease, opacity 200ms ease' }}>
      <div style={{ fontSize: 13.5, lineHeight: 1.45, color: QUIET }}>
        <Trans t={t} i18nKey="whsConnect.intro.footerLine" components={{ 1: <span style={{ color: SOFT_INK, fontWeight: 700 }} /> }} />
      </div>
      <button type="button" onClick={cta} style={primaryCtaStyle}>{t('whsConnect.intro.connectCta')}</button>
      {onDecline ? <DeclineButton onClick={onDecline} /> : null}
    </div>
  );
};

const sectionHeadStyle: React.CSSProperties = { margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, color: SOFT_INK };
const sectionSubStyle: React.CSSProperties = { margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: QUIET };

const LastTwentySection: React.FC = () => {
  const { t } = useTranslation('handicap');
  return (
    <section style={SECTION_DIVIDED}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={sectionHeadStyle}>{t('whsConnect.intro.exampleCountTitle')}</h2>
        <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: DIMMER }}>{t('whsConnect.intro.exampleKicker')}</span>
      </div>
      <div style={{ marginTop: 18, height: 80, display: 'grid', gridTemplateColumns: 'repeat(20, minmax(0, 1fr))', gap: 3, alignItems: 'end' }}>
        {EXAMPLE.bars.map((height, i) => <span key={i} style={{ height, borderRadius: 4, background: EXAMPLE.counters.has(i) ? GOOD : BAR }} />)}
      </div>
      <p style={exampleTextStyle}>{t('whsConnect.intro.exampleCountText')}</p>
    </section>
  );
};

const exampleTextStyle: React.CSSProperties = { margin: '10px 0 0', fontSize: 13, lineHeight: 1.45, color: QUIET };

const CircleSection: React.FC<{ preview: CirclePreview; h: number }> = ({ preview, h }) => {
  const { t } = useTranslation('handicap');
  if (preview.connected <= 0) return null;
  const people = chooseCirclePeople(preview.people, h);
  const rows: Array<CirclePerson | 'you'> = [];
  let placed = false;
  for (const person of people) {
    if (!placed && h < person.index) {
      rows.push('you');
      placed = true;
    }
    rows.push(person);
  }
  if (!placed) rows.push('you');
  return (
    <section style={SECTION_DIVIDED}>
      <h2 style={sectionHeadStyle}>{t('whsConnect.intro.circleHeadingLine1')}<br />{t('whsConnect.intro.circleHeadingLine2')}</h2>
      <p style={sectionSubStyle}>{t('whsConnect.intro.circleSub', { count: preview.connected })}</p>
      <div style={{ margin: '16px -24px 0' }}>
        {rows.map((row) => row === 'you' ? <YouCircleRow key="you" /> : <PersonRow key={row.user_id} person={row} />)}
      </div>
    </section>
  );
};

const PersonRow: React.FC<{ person: CirclePerson }> = ({ person }) => (
  <div style={circleRowStyle()}>
    {person.avatar_url ? <img src={person.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover' }} /> : <span style={{ width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, background: AVATAR_BG, color: MID }}>{(person.name || '?').charAt(0).toUpperCase()}</span>}
    <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{person.name}</span>{person.club ? <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, color: DIMMER }}>{person.club}</span> : null}</span>
    <span style={{ fontSize: 18, fontWeight: 800 }}>{formatIndex(person.index)}</span>
  </div>
);

const YouCircleRow: React.FC = () => (
  <div style={circleRowStyle(AMBER_ROW)}>
    <span style={{ width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, border: `1.5px dashed ${AMBER_DASH_STRONG}`, color: AMBER }}>?</span>
    <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}><IntroText k="circleYou" /></span><span style={{ display: 'block', marginTop: 2, fontSize: 12.5, color: DIMMER }}><IntroText k="circleYouLine" /></span></span>
    <span style={{ width: 44, height: 26, borderRadius: 8, border: `1.5px dashed ${AMBER_DASH}` }} />
  </div>
);

function circleRowStyle(background?: string): React.CSSProperties {
  return { display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center', padding: '11px 24px', borderBottom: `1px solid ${FAINT_HAIR}`, background };
}

const TrustSection: React.FC = () => {
  const { t } = useTranslation('handicap');
  return (
    <section style={SECTION_DIVIDED}>
      <h2 style={sectionHeadStyle}>{t('whsConnect.intro.trustHeadingLine1')}<br />{t('whsConnect.intro.trustHeadingLine2')}</h2>
      <div style={{ marginTop: 18 }}>
        {TRUST_STEPS.map((x, i) => (
          <div key={x} style={{ display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr)', columnGap: 14, alignItems: 'start', padding: '14px 0', borderBottom: `1px solid ${HAIR}` }}>
            <span style={{ width: 36, height: 36, borderRadius: 12, background: STEP_BG, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: SOFT_INK }}>{i + 1}</span>
            <span><span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>{t(`whsConnect.intro.trustStep${x}Title`)}</span><span style={{ display: 'block', marginTop: 3, fontSize: 13.5, lineHeight: 1.45, color: QUIET }}>{t(`whsConnect.intro.trustStep${x}Line`)}</span></span>
          </div>
        ))}
      </div>
    </section>
  );
};

const EndBlock = React.forwardRef<HTMLDivElement, { onPickCountry: () => void; onDecline?: () => void; h: number; circleShown: boolean }>(({ onPickCountry, onDecline, h, circleShown }, ref) => {
  const { t } = useTranslation('handicap');
  const { live, count } = connectReach();
  const cta = () => {
    analyticsEvents.track('connect_intro_cta', { h, place: 'end', circle_shown: circleShown });
    onPickCountry();
  };
  return (
    <div ref={ref} style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button type="button" onClick={cta} style={primaryCtaStyle}>{t('whsConnect.intro.connectCta')}</button>
      <div style={{ textAlign: 'center', fontSize: 12.5, lineHeight: 1.5, color: DIMMER }}>{t('whsConnect.intro.endLine', { live, count })}</div>
      {onDecline ? <DeclineButton onClick={onDecline} /> : null}
    </div>
  );
});
EndBlock.displayName = 'EndBlock';

export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline, layout = 'page' }) => {
  const qc = useQueryClient();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const userId = user?.id;
  const home = useHomeClubStatus(userId);
  const homeSettled = !sessionLoading && (!userId || home.isFetched);
  // Disabled React Query v5 queries report isLoading false before they have ever run,
  // so the intro course is gated on the settled session/home-club state.
  const intro = useConnectIntroCourse(homeSettled ? home.clubId : null, homeSettled);
  const profile = useOwnIntroProfile(userId, homeSettled);
  const h0 = React.useMemo(() => startingHandicap({ egHandicapIndex: profile.data?.eg_handicap_index, manualHandicapIndex: profile.data?.manual_handicap_index }), [profile.data?.eg_handicap_index, profile.data?.manual_handicap_index]);
  const stats = useCourseStatsDetail(intro.data?.courseId, !!intro.data);
  const circle = useConnectCirclePreview(userId, !sessionLoading);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const [footerHidden, setFooterHidden] = React.useState(false);
  const [footerDisplay, setFooterDisplay] = React.useState(true);
  const viewedRef = React.useRef(false);
  const immersive = layout === 'page';

  const onChange = () => openHomeClubPicker({
    onSelected: () => {
      qc.invalidateQueries({ queryKey: ['home-club-status', userId] });
      qc.invalidateQueries({ queryKey: ['connect-intro-course'] });
    },
  });

  React.useEffect(() => {
    const target = endRef.current;
    if (!immersive || !target) return;
    const obs = new IntersectionObserver(([entry]) => {
      const ratio = entry?.intersectionRatio ?? 0;
      setFooterHidden((current) => nextFooterHidden(current, ratio));
    }, { root: null, threshold: [0, 0.3, 0.6, 1] });
    obs.observe(target);
    return () => obs.disconnect();
  }, [immersive, intro.data, stats.data]);

  React.useEffect(() => {
    if (!footerHidden) setFooterDisplay(true);
  }, [footerHidden]);

  const pending = !homeSettled || intro.isPending || (!!userId && profile.isPending) || (!!intro.data && stats.isPending);

  const avgOverPar = stats.data?.avg_over_par;
  const rounds = stats.data?.rounds_tracked ?? 0;
  const hasVerdict = avgOverPar != null && avgOverPar > 0 && rounds > 0;

  React.useEffect(() => {
    if (pending || !intro.data || !hasVerdict || viewedRef.current) return;
    viewedRef.current = true;
    analyticsEvents.track('connect_intro_viewed', { source: intro.data.source, h0 });
  }, [hasVerdict, h0, intro.data, pending]);

  if (pending) {
    return (
      <>
        <Stage ref={stageRef}>{null}</Stage>
        {immersive ? <FooterBar>{null}</FooterBar> : null}
      </>
    );
  }

  if (!intro.data) return <LegacyFallback onPickCountry={onPickCountry} onDecline={onDecline} layout={layout} />;
  if (!hasVerdict || avgOverPar == null) return <LegacyFallback onPickCountry={onPickCountry} onDecline={onDecline} layout={layout} />;

  const circleShown = !!circle.isFetched && (circle.data?.connected ?? 0) > 0;

  return (
    <>
      <Stage ref={stageRef}>
        <FirstScreen course={intro.data} avgOverPar={avgOverPar} rounds={rounds} hasHomeClub={home.clubId != null} onChange={onChange} />
        {circle.isFetched && circle.data ? <CircleSection preview={circle.data} h={h0} /> : null}
        <LastTwentySection />
        <TrustSection />
        <EndBlock ref={endRef} onPickCountry={onPickCountry} onDecline={onDecline} h={h0} circleShown={circleShown} />
        <div style={{ height: 40 }} />
      </Stage>
      {immersive ? <IntroFooter hidden={footerHidden} display={footerDisplay} onTransitionEnd={() => { if (footerHidden) setFooterDisplay(false); }} onPickCountry={onPickCountry} onDecline={onDecline} h={h0} circleShown={circleShown} /> : null}
    </>
  );
};

export default EmptyStateScreen;
