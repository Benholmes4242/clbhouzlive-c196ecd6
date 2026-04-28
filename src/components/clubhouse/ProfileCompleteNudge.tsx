import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';

export function ProfileCompleteNudge() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { profile } = useProfileData();
  const [dismissed, setDismissed] = useState(false);

  // Only show for first 7 days after signup
  const isRecent = profile?.created_at
    ? (Date.now() - new Date(profile.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  const hasPhoto = !!profile?.profile_photo_url;
  const hasHomeClub = !!(profile?.home_club || profile?.primary_club_id);
  const hasBio = !!(profile as any)?.bio;
  const isComplete = hasPhoto && hasHomeClub;

  // Persist dismissal in sessionStorage so it doesn't reappear mid-session
  useEffect(() => {
    if (sessionStorage.getItem('profile_nudge_dismissed')) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('profile_nudge_dismissed', '1');
    setDismissed(true);
  };

  if (!user || !isRecent || isComplete || dismissed || !profile) return null;

  const pct = Math.round(
    (hasPhoto ? 40 : 0) + (hasHomeClub ? 35 : 0) + (hasBio ? 25 : 0)
  );

  const message = !hasPhoto
    ? 'Add a profile photo — golfers with a photo get 3× more connections'
    : 'Add your home club to appear on leaderboards';

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
        background: 'rgba(13, 13, 13, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Progress ring */}
      <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
        <svg width={40} height={40} viewBox="0 0 40 40">
          <circle cx={20} cy={20} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={3} />
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
          fontSize: 10, fontWeight: 700, color: '#F7931E',
        }}>
          {pct}%
        </span>
      </div>

      {/* Text */}
      <button
        onClick={() => navigate(editRoute)}
        style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.92)', margin: 0 }}>Complete your profile</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0', lineHeight: 1.3 }}>{message}</p>
      </button>

      {/* Dismiss */}
      <button onClick={handleDismiss} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
        <X size={16} color="rgba(255,255,255,0.35)" />
      </button>
    </div>
  );
}