/** HS2: circle settlement alone owns intro readiness; profile supplies placement, never a course verdict.
 * Shared CTA/decline exports remain canonical for RoundsGate and ConnectGlance.
 * chooseCirclePeople defaults to four; this intro alone requests three.
 * HS2_FOOTER: Stage owns scrolling content; shared FooterBar owns actions and the loading CTA.
 * Embedded footer spacing mirrors EnglandGolfForm so setup hosts retain their gutter ownership.
 */
import React from 'react';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { connectReach } from '@/lib/whs/connectReach';
import { Button } from '@/components/ui/button';
import { FONT } from './designTokens';
import { FooterBar, Stage } from './Primitives';
import './connect-seat.css';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
  layout?: 'page' | 'embedded';
}
type CirclePerson = { user_id: string; name: string; avatar_url: string | null; club: string | null; index: number };
type CirclePreview = { circle: number; connected: number; people: CirclePerson[] };
const SOFT_INK = '#F3F5F7';
const GROUND = '#0A0A0C';
const QUIET = '#9AA3AF';

export function startingHandicap(args: { egHandicapIndex?: number | null; manualHandicapIndex?: number | null }): number {
  const resolved = resolveDisplayHandicap({
    egHandicapIndex: args.egHandicapIndex ?? null,
    manualHandicapIndex: args.manualHandicapIndex ?? null,
    hasWhsConnection: false,
  });
  const raw = resolved.value == null ? 18 : Math.round(resolved.value);
  return Math.max(0, Math.min(36, raw));
}

export function formatIndex(n: number): string {
  return n < 0 ? `+${Math.abs(n).toFixed(1)}` : n.toFixed(1);
}

export function chooseCirclePeople(people: CirclePerson[], h: number, count = 4): CirclePerson[] {
  return [...people]
    .sort((a, b) => Math.abs(a.index - h) - Math.abs(b.index - h) || b.index - a.index)
    .slice(0, count)
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

export const primaryCtaStyle: React.CSSProperties = {
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

export const declineButtonStyle: React.CSSProperties = { height: 36, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', fontFamily: FONT, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: QUIET, cursor: 'pointer' };

export const DeclineButton: React.FC<{ onClick: () => void; style?: React.CSSProperties; disabled?: boolean }> = ({ onClick, style, disabled }) => (
  <button type="button" disabled={disabled} onClick={onClick} style={{ ...declineButtonStyle, ...style }}>
    <IntroText k="decline" />
  </button>
);

const IntroText: React.FC<{ k: string; options?: Record<string, unknown> }> = ({ k, options }) => {
  const { t } = useTranslation('handicap');
  return <>{t(`whsConnect.intro.${k}`, options)}</>;
};

const CircleList: React.FC<{ preview: CirclePreview; h: number }> = ({ preview, h }) => {
  const { t } = useTranslation('handicap');
  const rows: Array<CirclePerson | 'you'> = [];
  let placed = false;
  for (const person of chooseCirclePeople(preview.people, h, 3)) {
    if (!placed && h < person.index) {
      rows.push('you');
      placed = true;
    }
    rows.push(person);
  }
  if (!placed) rows.push('you');
  return <div className="connect-seat-list" data-testid="connect-seat-list">
    {rows.map(row => row === 'you' ?
      <div className="connect-seat-row connect-seat-you" key="you" data-seat-person="you">
        <span className="connect-seat-avatar">?</span>
        <div className="connect-seat-name"><b>{t('whsConnect.intro.circleYou', { defaultValue: 'You' })}</b><span>{t('whsConnect.intro.seatYouLine', { defaultValue: 'your index goes here' })}</span></div>
        <span className="connect-seat-slot" aria-hidden="true" />
      </div> :
      <div className="connect-seat-row" key={row.user_id} data-seat-person={row.user_id}>
        {row.avatar_url ? <img className="connect-seat-avatar" src={row.avatar_url} alt="" /> : <span className="connect-seat-avatar">{getInitialsFromName(row.name) || '?'}</span>}
        <div className="connect-seat-name"><b>{row.name}</b>{row.club ? <span>{row.club}</span> : null}</div>
        <span className="connect-seat-index">{formatIndex(row.index)}</span>
      </div>)}
  </div>;
};

export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline, layout = 'page' }) => {
  const { t } = useTranslation('handicap');
  const { user, loading: sessionLoading } = useSupabaseSession();
  const profile = useOwnIntroProfile(user?.id, !sessionLoading);
  const circle = useConnectCirclePreview(user?.id, !sessionLoading);
  const h = startingHandicap({ egHandicapIndex: profile.data?.eg_handicap_index, manualHandicapIndex: profile.data?.manual_handicap_index });
  const settled = circle.isFetched || circle.isError;
  const preview = !circle.isError ? circle.data : undefined;
  const circleShown = (preview?.connected ?? 0) > 0;
  const viewed = React.useRef(false);
  React.useEffect(() => {
    if (!settled || viewed.current) return;
    viewed.current = true;
    analyticsEvents.track('connect_intro_viewed', { h0: h });
  }, [settled, h]);
  const { live, count } = connectReach();
  const cta = () => {
    analyticsEvents.track('connect_intro_cta', { h, place: 'footer', circle_shown: circleShown });
    onPickCountry();
  };
  return <>
    <Stage style={{ willChange: 'transform' }}>
    <div className="connect-seat">
      {!settled ? <div data-testid="connect-seat-skeleton" aria-busy="true" className="connect-seat-skeleton"><span /><span /></div> : <>
        <h1 data-testid="connect-seat-headline" data-connected={circleShown ? preview?.connected : 0}>
          {circleShown ? t('whsConnect.intro.seatHeadline', { count: preview?.connected, defaultValue: preview?.connected === 1 ? '1 golfer you follow is already here' : `${preview?.connected} golfers you follow are already here` }) : t('whsConnect.intro.seatEmptyHeadline', { defaultValue: 'Connect your handicap' })}
        </h1>
        <p className="connect-seat-lede">{circleShown ? t('whsConnect.intro.seatLede', { defaultValue: 'Connect your official handicap and take your seat.' }) : t('whsConnect.intro.seatEmptyLede', { defaultValue: "Your index, every round you've posted, and how you score hole by hole." })}</p>
        {circleShown && preview ? <CircleList preview={preview} h={h} /> : null}
        <div className="connect-seat-pills">{[
          ['seatTime', 'Thirty seconds'], ['seatReadOnly', 'Read only'], ['seatEncrypted', 'Password encrypted'], ['seatDisconnect', 'Disconnect any time'],
        ].map(([key, text]) => <span key={key}>{t(`whsConnect.intro.${key}`, { defaultValue: text })}</span>)}</div>
        <div className="connect-seat-countries">{t('whsConnect.intro.seatCountries', { live, count, defaultValue: `${live} is live now, with ${count} more countries on the way.` })}</div>
      </>}
    </div>
    <div style={{ height: 28 }} />
    </Stage>
    <FooterBar style={layout === 'embedded' ? { padding: '16px 0 8px', paddingBottom: 'calc(34px + env(safe-area-inset-bottom, 0px))' } : undefined}>
      {!settled ? <>
        <div className="connect-seat-skeleton-cta" data-testid="connect-seat-skeleton-cta" aria-hidden="true" />
        {onDecline ? <div className="connect-seat-skeleton-decline" aria-hidden="true" /> : null}
      </> : <>
        <Button variant="ghost" className="connect-seat-cta" style={primaryCtaStyle} onClick={cta}>{t('whsConnect.intro.connectCta', { defaultValue: 'Connect your handicap' })}</Button>
        {onDecline ? <DeclineButton style={{ marginTop: 12 }} onClick={onDecline} /> : null}
      </>}
    </FooterBar>
  </>;
};
export default EmptyStateScreen;
