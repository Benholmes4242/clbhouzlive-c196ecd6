import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, ArrowRight, Link2 } from 'lucide-react';
import { callConnectWhs } from '@/lib/whs/api';
import type { ConnectWhsSuccess } from '@/lib/whs/types';

const LOADING_MESSAGES = [
  'Verifying with England Golf...',
  'Saving your handicap...',
  'Importing your scores...',
  'Finding your friends...',
];

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
  const [membershipNumber, setMembershipNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [successData, setSuccessData] = useState<ConnectWhsSuccess | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  }, []);

  const isValid = membershipNumber.trim().length >= 8 && password.length > 0;

  const handleConnect = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    setLoadingIdx(0);

    intervalRef.current = window.setInterval(() => {
      setLoadingIdx((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 1500);

    try {
      const data = await callConnectWhs(membershipNumber.trim(), password);
      if (data.ok === false) {
        const err = data;
        const code = err.error_code ?? 'internal_error';
        setError(ERROR_MESSAGES[code] ?? err.message ?? ERROR_MESSAGES.internal_error);
        return;
      }
      setSuccessData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setSubmitting(false);
    }
  };

  if (successData) {
    const firstName = (successData.name ?? '').split(' ')[0] || 'golfer';
    const handicap = successData.handicap_index;
    const homeClub = successData.home_club;
    const scores = successData.scores_imported ?? 0;
    const friends = successData.friends_imported ?? 0;

    return (
      <div className="px-5 pt-12 pb-8 flex flex-col items-center text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
          style={{ background: 'rgba(16,185,129,0.12)' }}
        >
          <CheckCircle2 className="h-7 w-7" style={{ color: '#10B981' }} />
        </div>
        <h2 className="text-[22px] font-bold text-foreground mb-3 leading-tight">
          Welcome aboard, {firstName}!
        </h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xs mb-3">
          Your England Golf account is connected. Your current handicap index is{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {typeof handicap === 'number' ? handicap.toFixed(1) : '—'}
          </span>
          {homeClub ? <> at <span className="font-medium">{homeClub}</span></> : null}.
        </p>
        <p className="text-[13px] text-muted-foreground mb-7">
          {scores} {scores === 1 ? 'round' : 'rounds'} and {friends}{' '}
          {friends === 1 ? 'friend' : 'friends'} imported.
        </p>
        <button
          onClick={onConnected}
          className="w-full max-w-sm inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-full transition-transform active:scale-[0.98]"
          style={{ background: '#0F172A', color: '#ffffff' }}
        >
          View my handicap
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-10">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground mb-3">
          England Golf
        </p>
        <h2 className="text-[26px] font-extrabold text-foreground leading-tight mb-2">
          Connect your handicap
        </h2>
        <p className="text-[15px] text-muted-foreground leading-snug max-w-xs mx-auto">
          Link your England Golf account to track your handicap, see every round, and play against your friends.
        </p>
      </div>

      {/* Hero illustration — static */}
      <div className="flex items-center justify-center gap-3 mb-7" aria-hidden>
        <div
          className="px-3 py-1.5 rounded-md text-[13px] font-bold lowercase tracking-tight"
          style={{ background: '#0F172A', color: '#ffffff' }}
        >
          clbhouz
        </div>
        <Link2 className="h-4 w-4" style={{ color: 'rgba(15,23,42,0.45)' }} />
        <div
          className="px-3 py-1.5 rounded-md text-[13px] font-semibold tracking-tight border"
          style={{ borderColor: 'rgba(15,23,42,0.18)', color: '#0F172A' }}
        >
          England Golf
        </div>
      </div>

      {/* Submitting state replaces the form */}
      {submitting ? (
        <div className="flex flex-col items-center justify-center py-14">
          <div
            className="w-10 h-10 rounded-full border-[3px] animate-spin mb-5"
            style={{ borderColor: 'rgba(15,23,42,0.12)', borderTopColor: '#F7931E' }}
          />
          <p
            key={loadingIdx}
            className="text-[14px] text-muted-foreground transition-opacity duration-300"
            style={{ animation: 'fadeIn 300ms ease' }}
          >
            {LOADING_MESSAGES[loadingIdx]}
          </p>
          <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
        </div>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConnect();
            }}
            className="space-y-4"
          >
            {/* Membership number */}
            <div>
              <label htmlFor="whs-membership" className="block text-[13px] font-medium text-foreground mb-1.5">
                Membership number
              </label>
              <input
                id="whs-membership"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 1013726541"
                value={membershipNumber}
                onChange={(e) => setMembershipNumber(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={submitting}
                className="w-full px-3.5 py-3 text-[15px] rounded-xl border bg-background text-foreground tabular-nums focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{
                  borderColor: 'rgba(15,23,42,0.14)',
                }}
              />
              <p className="text-[12px] text-muted-foreground mt-1.5">
                Find this on your member card or in MyEG
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="whs-password" className="block text-[13px] font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="whs-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your MyEG password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3.5 py-3 pr-11 text-[15px] rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{ borderColor: 'rgba(15,23,42,0.14)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[12px] text-muted-foreground mt-1.5">
                Same password you use for the MyEG app
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-lg text-[14px]"
                style={{ background: 'rgba(220,38,38,0.06)', color: '#B91C1C' }}
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Security copy */}
            <div
              className="flex gap-2.5 p-3 rounded-lg text-[13px] leading-snug"
              style={{ background: 'rgba(15,23,42,0.04)', color: 'rgba(15,23,42,0.78)' }}
            >
              <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'rgba(15,23,42,0.55)' }} />
              <p>
                <span className="font-semibold text-foreground">Your password is safe.</span>{' '}
                We send your sign-in details directly to England Golf to verify your account, then
                store an encrypted copy so we can keep your handicap up to date. clbhouz staff
                cannot read your password. You can disconnect any time.
              </p>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-full transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              style={{
                background: '#F7931E',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(247,147,30,0.28)',
              }}
            >
              Connect England Golf
            </button>
          </form>

          {onSkip && (
            <div className="text-center mt-5">
              <button
                onClick={onSkip}
                className="text-[14px] text-muted-foreground hover:text-foreground"
              >
                Not a member? Skip for now
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WhsConnectScreen;
