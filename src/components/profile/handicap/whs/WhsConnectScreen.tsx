import React, { useRef, useState } from 'react';
import { callConnectWhs } from '@/lib/whs/api';
import type { ConnectWhsSuccess } from '@/lib/whs/types';
import { useSelectedCountry } from '@/lib/whs/useSelectedCountry';
import type { WhsCountry } from '@/lib/whs/whsCountries';
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
  onConnected: () => void;
  onSkip?: () => void;
}

export const WhsConnectScreen: React.FC<Props> = ({ onConnected, onSkip }) => {
  const { country, setCountryId } = useSelectedCountry();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ConnectWhsSuccess | null>(null);

  const notifyMeFiredRef = useRef(false);

  const handlePick = (c: WhsCountry) => {
    setCountryId(c.id);
    setPickerOpen(false);
    setError(null);
    notifyMeFiredRef.current = false;
  };

  const handleChangeCountry = () => {
    setPickerOpen(true);
  };

  const handleNotifyMe = (c: WhsCountry) => {
    if (notifyMeFiredRef.current) return;
    notifyMeFiredRef.current = true;
    window.alert(`Thanks — we'll let you know when ${c.body} is ready.`);
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
        onContinue={onConnected}
      />
    );
  }

  if (submitting) {
    return <SyncingScreen />;
  }

  if (!country) {
    return (
      <>
        <EmptyStateScreen onPickCountry={() => setPickerOpen(true)} />
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
          onNotifyMe={handleNotifyMe}
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
