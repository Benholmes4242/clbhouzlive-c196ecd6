import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { callConnectWhs } from '@/lib/whs/api';
import type { ConnectWhsSuccess } from '@/lib/whs/types';
import { useSelectedCountry } from '@/lib/whs/useSelectedCountry';
import type { WhsCountry } from '@/lib/whs/whsCountries';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import EmptyStateScreen from './connect/EmptyStateScreen';
import CountryScreen from './connect/CountryScreen';
import EnglandGolfForm from './connect/EnglandGolfForm';
import ComingSoonScreen from './connect/ComingSoonScreen';
import SyncingScreen from './connect/SyncingScreen';
import WelcomeAboardScreen from './connect/WelcomeAboardScreen';
import { HeaderBar } from './connect/Primitives';
import { CANVAS, FONT } from './connect/designTokens';

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Please sign in to clbhouz first, then try again.',
  invalid_request: 'Please fill in both your membership number and password.',
  already_connected: 'Your England Golf account is already linked. Pull down to refresh.',
  eg_auth_failed:
    "England Golf didn't recognise that membership number and password. Double-check them in your MyEG app.",
  eg_unavailable: 'England Golf is temporarily unreachable. Please try again in a few minutes.',
  internal_error: 'Something went wrong on our side. Please try again in a moment.',
};

interface Props {
  onConnected: () => void | Promise<void>;
  onDecline?: () => void;
  /** 'page' fills viewport height and pins CTAs. 'embedded' sizes to content. */
  layout?: 'page' | 'embedded';
}

type Stage = 'intro' | 'country' | 'form' | 'comingSoon' | 'sync' | 'done';

export const WhsConnectScreen: React.FC<Props> = ({
  onConnected,
  onDecline,
  layout = 'page',
}) => {
  const { country, setCountryId } = useSelectedCountry();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { data: connection } = useWhsConnection(user?.id);
  const [step, setStep] = useState<'intro' | 'country' | 'chosen'>('intro');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ConnectWhsSuccess | null>(null);

  useEffect(() => {
    const preselect = (location.state as { preselectCountryId?: string } | null)?.preselectCountryId;
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
  };

  const handleSubmit = async (membershipNumber: string, password: string) => {
    setSubmitting(true);
    setError(null);

    try {
      const data = await callConnectWhs(membershipNumber, password);
      if (data.ok === false) {
        const code = data.error_code ?? 'internal_error';
        setError(ERROR_MESSAGES[code] ?? data.message ?? ERROR_MESSAGES.internal_error);
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
      setSuccessData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stage: Stage = successData
    ? 'done'
    : submitting
    ? 'sync'
    : step === 'intro'
    ? 'intro'
    : step === 'country' || !country
    ? 'country'
    : !country.supported
    ? 'comingSoon'
    : 'form';

  const HEADERS: Record<Stage, { title: string; back?: () => void }> = {
    intro: { title: 'Connect your handicap' },
    country: { title: 'Where do you play?', back: () => setStep('intro') },
    form: { title: 'England Golf', back: () => setStep('country') },
    comingSoon: { title: country?.name ?? 'Coming soon', back: () => setStep('country') },
    sync: { title: 'Connecting' },
    done: { title: 'Connected' },
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
        return <SyncingScreen />;
      case 'intro':
        return (
          <EmptyStateScreen onPickCountry={() => setStep('country')} onDecline={onDecline} />
        );
      case 'country':
        return <CountryScreen onSelect={handlePick} />;
      case 'comingSoon':
        return (
          <ComingSoonScreen country={country!} onChangeCountry={() => setStep('country')} />
        );
      case 'form':
      default:
        return <EnglandGolfForm onSubmit={handleSubmit} error={error} submitting={false} />;
    }
  })();

  const wrapperClass =
    layout === 'page' ? 'flex flex-col flex-1 min-h-0' : 'flex flex-col';

  const header = HEADERS[stage];

  return (
    <div className={wrapperClass} style={{ fontFamily: FONT, background: CANVAS }}>
      <HeaderBar title={header.title} onBack={header.back} />
      {activeScreen}
    </div>
  );
};

export default WhsConnectScreen;
