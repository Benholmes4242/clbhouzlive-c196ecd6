import React from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHomeClubStatus } from '@/features/home-club/useHomeClubStatus';
import { openHomeClubPicker } from '@/features/home-club/homeClubPickerStore';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { WHS_COUNTRIES } from '@/lib/whs/whsCountries';
import { useConnectIntroCourse, type ConnectIntroCourse } from './useConnectIntroCourse';
import { DIM, INK, AMBER, NUM, FONT } from './designTokens';
import { FooterBar, Stage } from './Primitives';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
  layout?: 'page' | 'embedded';
}

type IntroHole = { hole_no: number; par: number; stroke_index: number | null; avg_to_par: number };
type IntroBlock = { rounds: number; golfers: number; median_gross: number | null; par: number | null; holes: IntroHole[] };
type IntroBand = { lo: number; hi: number } & IntroBlock;
type IntroBandResult = { available: boolean; reason?: 'unauthenticated' | 'unmapped' | 'thin'; hcp: number; band: IntroBand | null; all: IntroBlock | null };
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
const FAINT_HAIR = 'rgba(255,255,255,0.06)';
const AMBER_DASH = 'rgba(247,147,30,0.6)';
const AMBER_DASH_STRONG = 'rgba(247,147,30,0.7)';
const AMBER_ROW = 'rgba(247,147,30,0.07)';
const STEP_BG = 'rgba(255,255,255,0.06)';
const AVATAR_BG = 'rgba(255,255,255,0.08)';

const TRUST_STEPS = ['1', '2', '3'] as const;

const EXAMPLE = {
  beat: [
    { score: '82', index: '11.3', good: true, active: false },
    { score: '83', index: '11.4', good: true, active: false },
    { score: '84', index: '11.6', good: true, active: true },
    { score: '85', index: '11.8', good: false, active: false },
    { score: '86', index: '11.8', good: false, active: false },
    { score: '87', index: '11.8', good: false, active: false },
  ],
  bars: [64, 46, 57, 36, 72, 43, 54, 32, 61, 50, 39, 68, 46, 36, 57, 43, 75, 50, 39, 54],
  counters: new Set([1, 3, 5, 7, 10, 13, 15, 18]),
  ways: [
    { titleKey: 'exampleWayDoubles', value: '10.4' },
    { titleKey: 'exampleWayBackNine', value: '11.0' },
  ],
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

export function costliestThree(holes: IntroHole[]): IntroHole[] {
  return [...holes]
    .sort((a, b) => {
      const avg = b.avg_to_par - a.avg_to_par;
      if (avg !== 0) return avg;
      const siA = a.stroke_index ?? Number.MAX_SAFE_INTEGER;
      const siB = b.stroke_index ?? Number.MAX_SAFE_INTEGER;
      if (siA !== siB) return siA - siB;
      return a.hole_no - b.hole_no;
    })
    .slice(0, 3);
}

export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

export function signedOne(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  if (Object.is(rounded, -0) || rounded === 0) return '0.0';
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1).replace('-', '−');
}

function unsignedOne(n: number): string {
  return Math.abs(Math.round(n * 10) / 10).toFixed(1);
}

export function rangeHcp(n: number): string {
  return n < 0 ? `+${Math.abs(n)}` : String(n);
}

export function formatIndex(n: number): string {
  return n < 0 ? `+${Math.abs(n).toFixed(1)}` : n.toFixed(1);
}

type IntroT = (key: string, options?: Record<string, unknown>) => string;

export function buildReadout(block: IntroBlock, band: IntroBand | null, h: number, t?: IntroT) {
  const holes = costliestThree(block.holes);
  const anyNegative = holes.some((x) => x.avg_to_par < 0);
  const holeList = holes.map((x) => ordinal(x.hole_no));
  const values = holes.map((x) => (anyNegative ? signedOne(x.avg_to_par) : unsignedOne(x.avg_to_par)));
  const median = block.median_gross == null ? '' : String(Math.round(block.median_gross));
  const par = block.par == null ? '' : String(block.par);
  const label = hcpLabel(h, t);
  return {
    median,
    baseline: band
      ? t?.('whsConnect.intro.readoutBandBaseline', { median, hcp: label, par }) ?? `${median} is what golfers off ${label} typically shoot here, par ${par}.`
      : t?.('whsConnect.intro.readoutAllBaseline', { median, par }) ?? `${median} is what golfers here typically shoot, par ${par}.`,
    cost: t?.('whsConnect.intro.readoutCost', {
      hole1: holeList[0],
      hole2: holeList[1],
      hole3: holeList[2],
      value1: values[0],
      value2: values[1],
      value3: values[2],
      ending: t(anyNegative ? 'whsConnect.intro.readoutAgainstPar' : 'whsConnect.intro.readoutOverPar'),
    }) ?? `The ${holeList[0]}, ${holeList[1]} and ${holeList[2]} cost them most: ${values[0]}, ${values[1]} and ${values[2]} ${anyNegative ? 'against par.' : 'over par.'}`,
    source: band
      ? t?.('whsConnect.intro.readoutBandSource', { count: band.rounds, lo: rangeHcp(band.lo), hi: rangeHcp(band.hi) }) ?? `From ${band.rounds} ${band.rounds === 1 ? 'round' : 'rounds'} by golfers off ${rangeHcp(band.lo)} to ${rangeHcp(band.hi)} at this course.`
      : t?.('whsConnect.intro.readoutAllSource', { count: block.rounds, hcp: label }) ?? `Not enough rounds yet from golfers off ${label}, so this is every golfer here: ${block.rounds} ${block.rounds === 1 ? 'round' : 'rounds'}.`,
  };
}

export function hcpLabel(n: number, t?: IntroT): string {
  return n === 0 ? t?.('whsConnect.intro.scratch') ?? 'scratch' : String(n);
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

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
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

function useConnectIntroBand(courseId: string | undefined, h: number, enabled: boolean) {
  const debouncedH = useDebouncedValue(h, 250);
  return useQuery({
    queryKey: ['connect-intro-band', courseId ?? '', debouncedH],
    enabled: !!courseId && enabled,
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<IntroBandResult | null> => {
      const { data, error } = await supabase.rpc('get_connect_intro_band', { p_course_id: courseId as string, p_hcp: debouncedH });
      if (error) throw error;
      return data as IntroBandResult | null;
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

const LegacyFallback: React.FC<Props> = ({ onPickCountry, onDecline }) => {
  const { t } = useTranslation('handicap');
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
      <FooterBar>
        <button type="button" onClick={onPickCountry} style={primaryCtaStyle}>{t('whsConnect.intro.cta')}</button>
        {onDecline ? <DeclineButton onClick={onDecline} /> : null}
      </FooterBar>
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

const Stepper: React.FC<{ value: number; onChange: (next: number) => void }> = ({ value, onChange }) => {
  const { t } = useTranslation('handicap');
  return (
    <div style={{ paddingTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: MID }}>{t('whsConnect.intro.stepperLabel')}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <button type="button" aria-label={t('whsConnect.intro.lowerHandicapAria')} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))} style={stepperButtonStyle(value <= 0)}>&minus;</button>
        <span style={{ minWidth: 56, textAlign: 'center', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: SOFT_INK, ...NUM }}>{value}</span>
        <button type="button" aria-label={t('whsConnect.intro.higherHandicapAria')} disabled={value >= 36} onClick={() => onChange(Math.min(36, value + 1))} style={stepperButtonStyle(value >= 36)}>+</button>
      </span>
    </div>
  );
};

function stepperButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'transparent',
    color: SOFT_INK,
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: 600,
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'default' : 'pointer',
  };
}

const HoleChart: React.FC<{ block: IntroBlock; top: IntroHole[]; fetching: boolean }> = ({ block, top, fetching }) => {
  const topSet = new Set(top.map((h) => h.hole_no));
  const byHole = new Map(block.holes.map((h) => [h.hole_no, h]));
  const holes = Array.from({ length: 18 }, (_, i) => byHole.get(i + 1));
  return (
    <div style={{ paddingTop: 18 }}>
      <div style={{ height: 22, display: 'grid', gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gap: 3, alignItems: 'end' }}>
        {holes.map((h, i) => (
          <span key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 800, color: AMBER, whiteSpace: 'nowrap' }}>{h && topSet.has(h.hole_no) ? signedOne(h.avg_to_par) : ''}</span>
        ))}
      </div>
      <div style={{ height: 150, display: 'grid', gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gap: 3, alignItems: 'end', opacity: fetching ? 0.6 : 1, transition: 'opacity 160ms ease' }}>
        {holes.map((h, i) => {
          const height = Math.max(4, Math.round((Math.min(Math.max(h?.avg_to_par ?? 0, 0), 2.8) / 2.8) * 150));
          return <div key={i} style={{ height, borderRadius: 4, background: h && topSet.has(h.hole_no) ? AMBER : BAR, transition: 'height 220ms ease' }} />;
        })}
      </div>
      <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gap: 3 }}>
        {holes.map((_, i) => <span key={i} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: DIMMER }}>{i + 1}</span>)}
      </div>
    </div>
  );
};

const FirstScreen: React.FC<{
  course: ConnectIntroCourse;
  block: IntroBlock;
  band: IntroBand | null;
  h: number;
  dataHcp: number;
  setH: (h: number) => void;
  hasHomeClub: boolean;
  onChange: () => void;
  fetching: boolean;
}> = ({ course, block, band, h, dataHcp, setH, hasHomeClub, onChange, fetching }) => {
  const { t } = useTranslation('handicap');
  const headlineRef = useFittedThreeLine([course.courseName]);
  const top = costliestThree(block.holes);
  const readout = buildReadout(block, band, dataHcp, t);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: QUIET }}>{t(course.source === 'home' ? 'whsConnect.intro.homeClubKicker' : 'whsConnect.intro.top100Kicker')}</span>
        <button type="button" onClick={onChange} style={{ background: 'none', border: 'none', padding: 0, fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: QUIET, cursor: 'pointer' }}>{t(hasHomeClub ? 'whsConnect.intro.change' : 'whsConnect.intro.setHomeClub')}</button>
      </div>
      <h1 ref={headlineRef} style={{ margin: '12px 0 0', fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.02, color: SOFT_INK }}>
        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{t('whsConnect.intro.tryHeadlineLine1')}</span>
        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{displayCourseName(course.courseName)}</span>
        <span style={{ display: 'block', whiteSpace: 'nowrap', color: AMBER }}>{t('whsConnect.intro.tryHeadlineLine3')}</span>
      </h1>
      <Stepper value={h} onChange={setH} />
      <HoleChart block={block} top={top} fetching={fetching} />
      <div style={{ paddingTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          {readout.median ? <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: SOFT_INK, ...NUM }}>{readout.median}</span> : null}
          <span style={{ fontSize: 14, lineHeight: 1.35, color: MID }}>{readout.baseline}</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.45, color: MID }}>{readout.cost}</div>
        <div style={{ marginTop: 6, fontSize: 12, color: DIMMER }}>{readout.source}</div>
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
        <Trans t={t} i18nKey="whsConnect.intro.footerLine" components={[null, <span style={{ color: SOFT_INK, fontWeight: 700 }} />]} />
      </div>
      <button type="button" onClick={cta} style={primaryCtaStyle}>{t('whsConnect.intro.connectCta')}</button>
      {onDecline ? <DeclineButton onClick={onDecline} /> : null}
    </div>
  );
};

const YouTable: React.FC<{ block: IntroBlock; all: IntroBlock; band: IntroBand | null; h: number }> = ({ block, all, band, h }) => {
  const { t } = useTranslation('handicap');
  const top = costliestThree(block.holes);
  const hardest = costliestThree(all.holes)[0]?.hole_no;
  return (
    <section style={{ paddingTop: 32 }}>
      <h2 style={sectionHeadStyle}>{t('whsConnect.intro.youTableHeadingLine1')}<br />{t('whsConnect.intro.youTableHeadingLine2')}<br /><span style={{ color: AMBER }}>{t('whsConnect.intro.youTableHeadingLine3')}</span></h2>
      <p style={sectionSubStyle}>{t('whsConnect.intro.youTableSub')}</p>
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 84px 84px', columnGap: 8, paddingBottom: 8, borderBottom: `1px solid ${HAIR}`, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: DIMMER }}>
        <span>{t('whsConnect.intro.youTableHole')}</span><span style={{ textAlign: 'right' }}>{band ? (h === 0 ? t('whsConnect.intro.youTableScratch') : t('whsConnect.intro.youTableOff', { hcp: h })) : t('whsConnect.intro.youTableAllGolfers')}</span><span style={{ textAlign: 'right' }}>{t('whsConnect.intro.youTableYou')}</span>
      </div>
      {top.map((hole) => (
        <div key={hole.hole_no} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 84px 84px', columnGap: 8, alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${HAIR}` }}>
          <span><span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>{ordinal(hole.hole_no)}</span><span style={{ display: 'block', marginTop: 2, fontSize: 12.5, color: DIMMER }}>{t('whsConnect.intro.youTablePar', { par: hole.par })}{hardest === hole.hole_no ? ` · ${t('whsConnect.intro.youTableHardest')}` : ''}</span></span>
          <span style={{ textAlign: 'right', fontSize: 18, fontWeight: 800, color: MID }}>{signedOne(hole.avg_to_par)}</span>
          <span style={{ justifySelf: 'end', width: 64, height: 30, borderRadius: 10, border: `1.5px dashed ${AMBER_DASH}` }} />
        </div>
      ))}
    </section>
  );
};

const sectionHeadStyle: React.CSSProperties = { margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, color: SOFT_INK };
const sectionSubStyle: React.CSSProperties = { margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: QUIET };

const ExampleBlock: React.FC = () => {
  const { t } = useTranslation('handicap');
  return (
    <section style={{ paddingTop: 52 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={sectionHeadStyle}>{t('whsConnect.intro.exampleHeading')}</h2>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: DIMMER }}>{t('whsConnect.intro.exampleKicker')}</span>
      </div>
      <p style={sectionSubStyle}>{t('whsConnect.intro.exampleSub')}</p>
      <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${HAIR}` }}>
        <ExampleTitle n="01" title={t('whsConnect.intro.exampleBeatTitle')} />
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4 }}>
        {EXAMPLE.beat.map((x) => <span key={x.score} style={{ height: 58, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, border: x.active ? `1.5px solid ${SOFT_INK}` : `1px solid ${HAIR}`, background: x.active ? AVATAR_BG : undefined }}><span style={{ fontSize: 15, fontWeight: 800 }}>{x.score}</span><span style={{ fontSize: 11.5, fontWeight: 700, color: x.good ? GOOD : DIMMER }}>{x.index}</span></span>)}
      </div>
      <p style={exampleTextStyle}>{t('whsConnect.intro.exampleBeatText')}</p>
    </div>
    <div style={{ marginTop: 26, paddingTop: 18, borderTop: `1px solid ${HAIR}` }}>
      <ExampleTitle n="02" title={t('whsConnect.intro.exampleCountTitle')} />
      <div style={{ marginTop: 14, height: 80, display: 'grid', gridTemplateColumns: 'repeat(20, minmax(0, 1fr))', gap: 3, alignItems: 'end' }}>
        {EXAMPLE.bars.map((height, i) => <span key={i} style={{ height, borderRadius: 4, background: EXAMPLE.counters.has(i) ? GOOD : BAR }} />)}
      </div>
      <p style={exampleTextStyle}>{t('whsConnect.intro.exampleCountText')}</p>
    </div>
    <div style={{ marginTop: 26, paddingTop: 18, borderTop: `1px solid ${HAIR}` }}>
      <ExampleTitle n="03" title={t('whsConnect.intro.exampleWaysTitle')} />
      <div style={{ marginTop: 12 }}>
        {EXAMPLE.ways.map((x) => <div key={x.titleKey} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12, alignItems: 'baseline', padding: '10px 0', borderBottom: `1px solid ${FAINT_HAIR}` }}><span style={{ fontSize: 14.5, fontWeight: 600, color: MID }}>{t(`whsConnect.intro.${x.titleKey}`)}</span><span style={{ fontSize: 18, fontWeight: 800, color: GOOD }}>{x.value}</span></div>)}
      </div>
      <p style={exampleTextStyle}>{t('whsConnect.intro.exampleWaysText')}</p>
    </div>
  </section>
  );
};

const ExampleTitle: React.FC<{ n: string; title: string }> = ({ n, title }) => <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}><span style={{ fontSize: 13, fontWeight: 800, color: AMBER }}>{n}</span><span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span></div>;
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
    <section style={{ paddingTop: 52 }}>
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
    <section style={{ paddingTop: 52 }}>
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
        </div>
      ))}
    </div>
  </section>
);

const EndBlock = React.forwardRef<HTMLDivElement, { onPickCountry: () => void; onDecline?: () => void; h: number; circleShown: boolean }>(({ onPickCountry, onDecline, h, circleShown }, ref) => {
  const live = WHS_COUNTRIES.filter((c) => c.supported).map((c) => c.name);
  const notYet = WHS_COUNTRIES.filter((c) => !c.supported).length;
  const liveText = live.length <= 1 ? live[0] ?? '' : `${live.slice(0, -1).join(', ')} and ${live[live.length - 1]}`;
  const cta = () => {
    analyticsEvents.track('connect_intro_cta', { h, place: 'end', circle_shown: circleShown });
    onPickCountry();
  };
  return (
    <div ref={ref} style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button type="button" onClick={cta} style={primaryCtaStyle}>Connect your handicap</button>
      <div style={{ textAlign: 'center', fontSize: 12.5, lineHeight: 1.5, color: DIMMER }}>Works with official handicaps. {liveText} is live now, with {notYet} more countries on the way.</div>
      {onDecline ? <DeclineButton onClick={onDecline} /> : null}
    </div>
  );
});
EndBlock.displayName = 'EndBlock';

export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline }) => {
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
  const [h, setHState] = React.useState(h0);
  const h0Applied = React.useRef(false);
  React.useEffect(() => {
    if (profile.isFetched && !h0Applied.current) {
      h0Applied.current = true;
      setHState(h0);
    }
  }, [h0, profile.isFetched]);
  const band = useConnectIntroBand(intro.data?.courseId, h, !!intro.data);
  const circle = useConnectCirclePreview(userId, !sessionLoading);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const [footerHidden, setFooterHidden] = React.useState(false);
  const triedRef = React.useRef(false);
  const viewedRef = React.useRef(false);

  const onChange = () => openHomeClubPicker({
    onSelected: () => {
      qc.invalidateQueries({ queryKey: ['home-club-status', userId] });
      qc.invalidateQueries({ queryKey: ['connect-intro-course'] });
    },
  });

  const setH = (next: number) => {
    if (!triedRef.current) {
      triedRef.current = true;
      analyticsEvents.track('connect_intro_hcp_tried', { from: h0, to: next });
    }
    setHState(next);
  };

  React.useEffect(() => {
    const root = stageRef.current;
    const target = endRef.current;
    if (!root || !target) return;
    const obs = new IntersectionObserver(([entry]) => setFooterHidden(entry.intersectionRatio >= 0.6), { root, threshold: [0, 0.6, 1] });
    obs.observe(target);
    return () => obs.disconnect();
  }, [intro.data, band.data]);

  const pending = !homeSettled || intro.isPending || (!!userId && profile.isPending) || (!!intro.data && band.isPending);
  if (pending) {
    return (
      <>
        <Stage ref={stageRef}>{null}</Stage>
        <FooterBar>{null}</FooterBar>
      </>
    );
  }

  if (!intro.data) return <LegacyFallback onPickCountry={onPickCountry} onDecline={onDecline} />;
  if (!band.data || band.data.available === false || !band.data.all) return <LegacyFallback onPickCountry={onPickCountry} onDecline={onDecline} />;

  const block = band.data.band ?? band.data.all;
  const circleShown = !!circle.isFetched && (circle.data?.connected ?? 0) > 0;

  if (!viewedRef.current) {
    viewedRef.current = true;
    analyticsEvents.track('connect_intro_viewed', { source: intro.data.source, band: !!band.data.band, h0 });
  }

  return (
    <Stage ref={stageRef}>
      <FirstScreen course={intro.data} block={block} band={band.data.band} h={h} setH={setH} hasHomeClub={home.clubId != null} onChange={onChange} onPickCountry={onPickCountry} onDecline={onDecline} footerHidden={footerHidden} fetching={band.isFetching} circleShown={circleShown} />
      <YouTable block={block} all={band.data.all} band={band.data.band} h={h} />
      <ExampleBlock />
      {circle.isFetched && circle.data ? <CircleSection preview={circle.data} h={h} /> : null}
      <TrustSection />
      <EndBlock ref={endRef} onPickCountry={onPickCountry} onDecline={onDecline} h={h} circleShown={circleShown} />
      <div style={{ height: 40 }} />
    </Stage>
  );
};

export default EmptyStateScreen;
