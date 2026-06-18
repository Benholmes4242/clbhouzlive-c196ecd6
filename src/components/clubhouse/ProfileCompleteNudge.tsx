import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';

const ESSENTIALS_DISMISS_KEY = 'profile_essentials_nudge_dismissed_until';

export function ProfileCompleteNudge() {
  const navigate = useNavigate();
  const editRoute = useEditProfileRoute();
  const { user } = useSupabaseSession();
  const { profile } = useProfileData();
  const [dismissed, setDismissed] = useState(false);

  const hasPhoto = !!profile?.profile_photo_url;
  const hasHomeClub = !!(profile?.home_club || profile?.primary_club_id);
  const hasBio = !!(profile as any)?.bio;

  const genderRaw = (profile as any)?.gender as string | undefined;
  const countryRaw = (profile as any)?.country as string | undefined;
  const hasGender = !!genderRaw && genderRaw !== 'prefer_not_to_say';
  const hasCountry = !!countryRaw?.trim();
  const missingEssentials = !!profile && (!hasGender || !hasCountry);

  // Only the essentials (gender/country) nudge remains — the 7-day
  // completion nudge was retired.
  const shouldShow = missingEssentials;

  // Persist dismissal — essentials: 24h localStorage
  useEffect(() => {
    if (missingEssentials) {
      const until = localStorage.getItem(ESSENTIALS_DISMISS_KEY);
      if (until && parseInt(until, 10) > Date.now()) {
        setDismissed(true);
      }
    }
  }, [missingEssentials]);

  const handleDismiss = () => {
    localStorage.setItem(
      ESSENTIALS_DISMISS_KEY,
      String(Date.now() + 24 * 60 * 60 * 1000),
    );
    setDismissed(true);
  };

  if (!user || dismissed || !profile || !shouldShow) return null;

  const pct = Math.round(
    (hasPhoto ? 40 : 0) + (hasHomeClub ? 35 : 0) + (hasBio ? 25 : 0)
  );

  const message = !hasGender
    ? 'Help us match you to similar golfers — set your gender'
    : 'Set your country so we can show how you compare locally';

  const handleAction = () => {
    if (!hasGender) navigate(`${editRoute}?focus=gender`);
    else navigate(`${editRoute}?focus=country`);
  };

  // SVG progress ring calculations
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
        left: 12,
        right: 12,
        zIndex: 180,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 14,
        background: '#FFFFFF',
        border: '0.5px solid rgba(15,23,42,0.07)',
        boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
      }}
    >
      {/* Progress ring */}
      <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
        <svg width={40} height={40} viewBox="0 0 40 40">
          <circle cx={20} cy={20} r={radius} fill="none" stroke="rgba(15,23,42,0.10)" strokeWidth={3} />
          <circle
            cx={20} cy={20} r={radius} fill="none"
            stroke="hsl(38 92% 50%)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 20 20)"
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#C97A10',
        }}>
          {pct}%
        </span>
      </div>

      {/* Text */}
      <button
        onClick={handleAction}
        style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 }}>Complete your profile</p>
        <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0', lineHeight: 1.3 }}>{message}</p>
      </button>

      {/* Dismiss */}
      <button onClick={handleDismiss} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
        <X size={16} color="#94A3B8" />
      </button>
    </div>
  );
}
