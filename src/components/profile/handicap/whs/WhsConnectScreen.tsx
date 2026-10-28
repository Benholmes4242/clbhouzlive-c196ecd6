import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useLocation, useNavigate } from 'react-router-dom';
import { callConnectWhs } from '@/lib/whs/api';
import type { ConnectWhsSuccess } from '@/lib/whs/types';
import { useSelectedCountry } from '@/lib/whs/useSelectedCountry';
import { getCountryById, type WhsCountry } from '@/lib/whs/whsCountries';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection, whsKeys } from '@/lib/whs/hooks';
import { setWhsConnectImmersive } from '@/components/header/globalHeaderRules';
import { applyRouteChrome } from '@/lib/routeChrome';
import EmptyStateScreen from './connect/EmptyStateScreen';
import CountryScreen from './connect/CountryScreen';
import EnglandGolfForm, { type FormErrorKind } from './connect/EnglandGolfForm';
import ComingSoonScreen from './connect/ComingSoonScreen';
import SyncingScreen from './connect/SyncingScreen';
import WelcomeAboardScreen from './connect/WelcomeAboardScreen';
import DeclinedScreen from './connect/DeclinedScreen';
import { BackRow } from './connect/Primitives';
import { SURFACE, FONT } from './connect/designTokens';

/** Wrapper ground: SURFACE on every stage, done included. */
export function connectWrapperBackground(_stage: string): string {
  return SURFACE;
}

/**
 * Top chrome. Every stage wears BackRow except 'done': the member has
 * connected and cannot go back, so done gets a bare spacer that keeps
 * BackRow's notch clearance (top + 4px bottom) but not its 44px control.
 */
export const ConnectTopChrome: React.FC<{
  stage: string;
  title: string;
  onBack?: () => void;
  immersive: boolean;
}> = ({ stage, title, onBack, immersive }) => {
  if (stage === 'done') {
    return (
      <div
        aria-hidden
        data-testid="connect-done-spacer"
        style={{
          paddingTop: immersive ? 'calc(max(env(safe-area-inset-top, 0px), 12px) + 6px)' : 6,
          paddingBottom: 4,
        }}
      />
    );
  }
  return <BackRow title={title} onBack={onBack} immersive={immersive} />;
};


const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Please sign in to clbhouz first, then try again.',
  invalid_request: 'Please fill in both your membership number and password.',
  already_connected: 'Your England Golf account is already linked. Pull down to refresh.',
  eg_auth_failed:
    "England Golf didn't recognise that membership number and password. Double-check them in your MyEG app.",
  eg_connection_refreshing:
    'Our connection to England Golf is being refreshed. This is on our side, not yours. Try again shortly.',
  eg_unavailable: 'England Golf is temporarily unreachable. Please try again in a few minutes.',
  internal_error: 'Something went wrong on our side. Please try again in a moment.',
  linked_elsewhere: 'This handicap is already linked to another clbhouz account.',
};

/** OB1.4: the edge function reports a second account linking the same record
 * as internal_error carrying the unique rule name. Client-side mapping only. */
export const LINKED_ELSEWHERE_RULE = 'whs_connections_passport_provider_unique';
export function isLinkedElsewhere(code: string | null | undefined, message: string | null | undefined): boolean {
  return (code ?? 'internal_error') === 'internal_error' && !!message && message.includes(LINKED_ELSEWHERE_RULE);
}

/**
 * BRIEF_WHS_CONNECT_INSTRUMENTATION — error categories for
 * whs_connect_failed. Analytics NEVER carries a raw provider message: a raw
 * message can contain identifying detail and lands in a table queried in
 * front of other people. The mapping lives in ONE place — here — so a new
 * failure mode cannot leak through unclassified.
 */
type WhsErrorCategory =
  | 'invalid_credentials'
  | 'provider_unavailable'
  | 'already_connected'
  | 'invalid_request'
  | 'not_authenticated'
  | 'network'
  | 'timeout'
  | 'unknown';

const ERROR_CODE_CATEGORY: Record<string, WhsErrorCategory> = {
  eg_auth_failed: 'invalid_credentials',
  eg_unavailable: 'provider_unavailable',
  eg_connection_refreshing: 'provider_unavailable',
  already_connected: 'already_connected',
  invalid_request: 'invalid_request',
  not_authenticated: 'not_authenticated',
  internal_error: 'unknown',
};

/** error_code -> the form's state. Display copy never drives behaviour. */
function errorKindFor(code: string): FormErrorKind {
  if (code === 'eg_auth_failed') return 'rejected';
  if (code === 'eg_connection_refreshing') return 'refreshing';
  return 'other';
}

function categorizeWhsError(code: string | null, err: unknown): WhsErrorCategory {
  if (code && ERROR_CODE_CATEGORY[code]) return ERROR_CODE_CATEGORY[code];
  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') return 'timeout';
    // fetch() network failure surfaces as a bare TypeError in every browser.
    if (err instanceof TypeError) return 'network';
  }
  return 'unknown';
}

interface Props {
  onConnected: () => void | Promise<void>;
  onDecline?: () => void;
  /** 'page' fills viewport height and pins CTAs. 'embedded' sizes to content. */
  layout?: 'page' | 'embedded';
  /** OB1 reuses credentials/errors/instrumentation, bypassing intro and payoff. */
  initialCountryId?: string;
  completeOnSuccess?: boolean;
  /** OB1.2: the host owns back/title; the connect top chrome is not drawn. */
  hideChrome?: boolean;
  /** OB1.5: embedded in /welcome setup ONLY. The form and sync stages drop
   *  their StageHead and 24px Stage sides (the host owns the one heading and
   *  the 20px edges), the submit button is the welcome primary pill, and a
   *  connect in flight shows the syncing screen. Passed only by
   *  WelcomeHandicap — never keyed off layout/hideChrome, which other hosts
   *  use. */
  setupEmbedded?: boolean;
  /** OB1.5: tells the host when a connect is in flight so it can swap its
   *  heading and hide its back/Skip controls. Fires false on unmount. */
  onSyncingChange?: (syncing: boolean) => void;
}

type Stage = 'intro' | 'country' | 'form' | 'comingSoon' | 'sync' | 'done' | 'declined';

export const WhsConnectScreen: React.FC<Props> = ({
  onConnected,
  onDecline,
  layout = 'page',
  initialCountryId,
  completeOnSuccess = false,
  hideChrome = false,
  setupEmbedded = false,
  onSyncingChange,
}) => {
  const { country: storedCountry, setCountryId } = useSelectedCountry();
  /* A host-chosen country wins from the first frame, so the stored pick can
     never flash the country list or another federation first. */
  const country = (initialCountryId ? getCountryById(initialCountryId) : undefined) ?? storedCountry;
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { data: connection } = useWhsConnection(user?.id);
  const [step, setStep] = useState<'intro' | 'country' | 'chosen' | 'declined'>(initialCountryId ? 'chosen' : 'intro');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* The form's state comes from error_code, never from the display copy. */
  const [errorKind, setErrorKind] = useState<FormErrorKind>(null);
  const [successData, setSuccessData] = useState<ConnectWhsSuccess | null>(null);

  const immersive = layout === 'page';

  /* ---- BRIEF_WHS_CONNECT_INSTRUMENTATION ----------------------------------
     The connect flow is the single gate on the product and previously emitted
     nothing. Every event below is derived from state that already existed;
     the flow's behaviour, copy, steps and layout are unchanged.

     Entry point: both mount sites resolve here — the immersive page at
     /manage/handicap (own profile) and the embedded friend view inside the
     /handicap tab. `page` in props already carries the path. */
  const entryPoint = immersive ? 'manage_handicap' : 'handicap_embedded';
  const preselected = Boolean(
    initialCountryId ?? (location.state as { preselectCountryId?: string } | null)?.preselectCountryId,
  );

  // whs_connect_viewed — the screen mounted. Fires once per mount.
  useEffect(() => {
    analyticsEvents.track('whs_connect_viewed', {
      entry_point: entryPoint,
      preselected_country: preselected,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // whs_connect_step — the funnel spine. One effect on `step` catches every
  // transition, including the preselect jump, so no setter path can skip it.
  const prevStepRef = useRef(step);
  useEffect(() => {
    const from = prevStepRef.current;
    if (from !== step) {
      analyticsEvents.track('whs_connect_step', { from, to: step });
      prevStepRef.current = step;
    }
  }, [step]);

  /* whs_connect_abandoned — THE point of the brief. Fires on unmount whenever
     no connection was produced: back-navigation, route change away, sheet
     closed. succeededRef is latched (never reset by WelcomeAboard's
     continue action clearing successData), so abandoned and succeeded are
     mutually exclusive by construction — succeeded sets the latch before
     any unmount can run. */
  const stepRef = useRef(step);
  stepRef.current = step;
  const succeededRef = useRef(false);
  useEffect(() => {
    return () => {
      if (!succeededRef.current) {
        analyticsEvents.track('whs_connect_abandoned', {
          step: stepRef.current,
          entry_point: entryPoint,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Page layout owns the whole viewport: the app chrome stops drawing a header
     (one back, one title) and the wash paints from physical y=0 behind the
     notch. Reuses the existing data-immersive-route mechanism via
     applyRouteChrome, exactly as course detail and the profile hero do. */
  useLayoutEffect(() => {
    if (!immersive) return;
    setWhsConnectImmersive(true);
    applyRouteChrome(window.location.pathname, true);
    return () => {
      setWhsConnectImmersive(false);
      applyRouteChrome(window.location.pathname, true);
    };
  }, [immersive]);

  useEffect(() => {
    const preselect = initialCountryId ?? (location.state as { preselectCountryId?: string } | null)?.preselectCountryId;
    if (preselect) {
      setCountryId(preselect);
      setStep('chosen');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handlePick = (c: WhsCountry) => {
    setCountryId(c.id);
    setStep('chosen');
    setError(null);
    setErrorKind(null);
    analyticsEvents.track('whs_connect_country', { country: c.id });
  };

  const handleSubmit = async (membershipNumber: string, password: string) => {
    setSubmitting(true);
    setError(null);
    setErrorKind(null);

    // S3.1: credentials are passed to the API call and NOWHERE else. No event
    // prop ever carries membershipNumber, password, or anything derived.
    analyticsEvents.track('whs_connect_submitted', { country: country?.id ?? null });

    try {
      const data = await callConnectWhs(membershipNumber, password);
      if (data.ok === false) {
        const code = data.error_code ?? 'internal_error';
        const linked = isLinkedElsewhere(code, data.message);
        setError(linked ? ERROR_MESSAGES.linked_elsewhere : ERROR_MESSAGES[code] ?? data.message ?? ERROR_MESSAGES.internal_error);
        setErrorKind(linked ? 'linked_elsewhere' : errorKindFor(code));
        // Categorised, never the raw message (S3.2).
        analyticsEvents.track('whs_connect_failed', {
          category: categorizeWhsError(code, null),
          country: country?.id ?? null,
        });
        return;
      }
      // Auto-restore: connected users have earned the live index chip.
      if (user?.id) {
        try {
          await supabase
            .from('user_profiles')
            .update({ hide_handicap_chip: false })
            .eq('id', user.id);
          queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
        } catch (e) {
          console.warn('[WhsConnectScreen] failed to clear hide_handicap_chip:', e);
        }
      }
      /* The done screen reads its counters off the connection row. Without this
         the ['whs-connection'] cache is still the pre-connect null, the counts
         query stays disabled, and every counter waits for nothing. */
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: whsKeys.connection(user.id) });
      }
      /* Latch BEFORE setSuccessData: the abandoned-on-unmount guard reads this
         ref, so succeeded and abandoned can never both fire (acceptance D). */
      succeededRef.current = true;
      analyticsEvents.track('whs_connect_succeeded', { country: country?.id ?? null });
      if (completeOnSuccess) { await onConnected(); return; }
      setSuccessData(data);
    } catch (err) {
      const linked = err instanceof Error && isLinkedElsewhere('internal_error', err.message);
      setError(linked ? ERROR_MESSAGES.linked_elsewhere : err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setErrorKind(linked ? 'linked_elsewhere' : 'other');
      // Name/shape only — the message string never leaves this function (S3.2).
      analyticsEvents.track('whs_connect_failed', {
        category: categorizeWhsError(null, err),
        country: country?.id ?? null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* OB1.5: in setup the syncing screen shows whenever a connect is in flight
     (completeOnSuccess hosts used to keep the greyed-out form instead). */
  const stage: Stage = successData
    ? 'done'
    : submitting && (!completeOnSuccess || setupEmbedded)
    ? 'sync'
    : step === 'declined'
    ? 'declined'
    : step === 'intro'
    ? 'intro'
    : step === 'country' || !country
    ? 'country'
    : !country.supported
    ? 'comingSoon'
    : 'form';

  /* OB1.5: the host swaps its heading and hides back/Skip while a connect is
     in flight. Fires on every transition and once more (false) on unmount. */
  const syncing = stage === 'sync';
  useEffect(() => {
    onSyncingChange?.(syncing);
  }, [syncing, onSyncingChange]);
  useEffect(() => () => onSyncingChange?.(false), [onSyncingChange]);

  /** ONE title on every stage. Each screen's own headline carries the voice,
   *  so the header never restates it - and never names a federation. */
  const HEADER_TITLE = 'Handicap';

  /** Per-stage back. Intro exits the flow (back to wherever the member came
   *  from, /profile as the fallback). Sync and done have no back: the sync is
   *  in flight, and done is completed by its own continue action. */
  const BACKS: Record<Stage, (() => void) | undefined> = {
    intro: immersive
      ? () => {
          if (window.history.length > 1) navigate(-1);
          else navigate('/profile', { replace: true });
        }
      : undefined,
    country: () => setStep('intro'),
    form: () => setStep('country'),
    comingSoon: () => setStep('country'),
    sync: undefined,
    done: undefined,
    declined: () => setStep('intro'),
  };


  const activeScreen = (() => {
    switch (stage) {
      case 'done':
        return (
          <WelcomeAboardScreen
            firstName={(successData?.name ?? '').split(' ')[0] || 'golfer'}
            handicapIndex={successData?.handicap_index ?? null}
            homeClub={successData?.home_club ?? null}
            connectionId={connection?.id ?? null}
            onContinue={async () => {
              await onConnected();
              setSuccessData(null);
            }}
          />
        );
      case 'sync':
        return <SyncingScreen setupEmbedded={setupEmbedded} />;
      case 'declined':
        return (
          <DeclinedScreen
            onContinue={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate('/profile', { replace: true });
            }}
            onReconsider={() => setStep('country')}
          />
        );
      case 'intro':
        return (
          <EmptyStateScreen
            layout={layout}
            onPickCountry={() => setStep('country')}
            onDecline={
              onDecline
                ? () => {
                    // The chip-hiding side effect is unchanged; the member now
                    // lands on a screen instead of nowhere.
                    onDecline();
                    setStep('declined');
                  }
                : undefined
            }
          />
        );
      case 'country':
        return <CountryScreen onSelect={handlePick} />;
      case 'comingSoon':
        return (
          <ComingSoonScreen country={country!} onChangeCountry={() => setStep('country')} />
        );
      case 'form':
      default:
        return (
          <EnglandGolfForm
            onSubmit={handleSubmit}
            error={error}
            errorKind={errorKind}
            submitting={completeOnSuccess && submitting}
            bodyName={country?.body}
            bodyShort={country?.bodyShort ?? country?.body}
            setupEmbedded={setupEmbedded}
          />
        );
    }
  })();

  const wrapperClass = immersive ? 'flex flex-col' : 'flex flex-col';

  return (
    <div
      className={wrapperClass}
      style={{
        fontFamily: FONT,
        /* FULL BLEED. The amber wash is no longer rendered anywhere in the
           flow: every stage, done included, paints SURFACE flat, matching the
           host page and notch shield. */
        background: connectWrapperBackground(stage),
        ...(immersive
          ? { minHeight: '100dvh', flex: '1 1 auto' }
          : { flex: '1 1 auto', minHeight: 0 }),
      }}
    >
      {!hideChrome && <ConnectTopChrome stage={stage} title={HEADER_TITLE} onBack={BACKS[stage]} immersive={immersive} />}
      {activeScreen}
    </div>
  );

};


export default WhsConnectScreen;
