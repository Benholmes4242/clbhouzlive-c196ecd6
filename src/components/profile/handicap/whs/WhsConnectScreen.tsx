import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { callConnectWhs } from '@/lib/whs/api';
import type { ConnectWhsSuccess } from '@/lib/whs/types';
import { useSelectedCountry } from '@/lib/whs/useSelectedCountry';
import type { WhsCountry } from '@/lib/whs/whsCountries';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import EmptyStateScreen from './connect/EmptyStateScreen';
import CountryPickerSheet from './connect/CountryPickerSheet';
import EnglandGolfForm from './connect/EnglandGolfForm';
import ComingSoonScreen from './connect/ComingSoonScreen';
import SyncingScreen from './connect/SyncingScreen';
import WelcomeAboardScreen from './connect/WelcomeAboardScreen';

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
  onSkip?: () => void;
  onDecline?: () => void;
}

export const WhsConnectScreen: React.FC<Props> = ({ onConnected, onSkip, onDecline }) => {
  const { country, setCountryId } = useSelectedCountry();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ConnectWhsSuccess | null>(null);

  useEffect(() => {
    const preselect = (location.state as { preselectCountryId?: string } | null)?.preselectCountryId;
    if (preselect) setCountryId(preselect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = (c: WhsCountry) => {
    setCountryId(c.id);
    setPickerOpen(false);
    setError(null);
  };

  const handleChangeCountry = () => {
    setPickerOpen(true);
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

  if (successData) {
    const firstName = (successData.name ?? '').split(' ')[0] || 'golfer';
    return (
      <WelcomeAboardScreen
        firstName={firstName}
        handicapIndex={successData.handicap_index ?? null}
        homeClub={successData.home_club ?? null}
        scoresImported={successData.scores_imported ?? 0}
        friendsImported={successData.friends_imported ?? 0}
        onContinue={async () => {
          await onConnected();
          setSuccessData(null);
        }}
      />
    );
  }

  if (submitting) {
    return <SyncingScreen />;
  }

  if (!country) {
    return (
      <>
        <EmptyStateScreen onPickCountry={() => setPickerOpen(true)} onDecline={onDecline} />
        <CountryPickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handlePick}
        />
      </>
    );
  }

  if (!country.supported) {
    return (
      <>
        <ComingSoonScreen
          country={country}
          onChangeCountry={handleChangeCountry}
        />
        <CountryPickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handlePick}
        />
      </>
    );
  }

  return (
    <>
      <EnglandGolfForm
        onSubmit={handleSubmit}
        error={error}
        submitting={false}
        onChangeCountry={handleChangeCountry}
        onSkip={onSkip}
      />
      <CountryPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePick}
      />
    </>
  );
};

export default WhsConnectScreen;
