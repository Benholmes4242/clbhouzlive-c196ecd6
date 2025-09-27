import React from 'react';
import { Edit, Flag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import '../../styles/responsive-profile.css';

interface GlassmorphicProfileCardProps {
  profile: {
    profile_photo_url?: string;
    display_name?: string;
    username?: string;
    home_club?: string;
    eg_handicap_index?: number;
  } | null;
  isOwnProfile: boolean;
  onEditProfile: () => void;
}

const GlassmorphicProfileCard: React.FC<GlassmorphicProfileCardProps> = ({
  profile,
  isOwnProfile,
  onEditProfile
}) => {
  const isMobile = useIsMobile();

  const glassmorphicStyle = {
    background: 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: '1px solid rgba(255, 255, 255, 0.35)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
  };

  return (
    <section 
      className="relative mx-4 rounded-2xl"
      style={{
        ...glassmorphicStyle,
        marginTop: 'calc(var(--panel-overlap) * -1)',
        padding: 'var(--panel-pad-y) var(--panel-pad-x)'
      }}
    >
      {/* Header block with 3-column grid layout */}
      <div
        className="grid items-center"
        style={{ gridTemplateColumns: `max-content 1fr var(--mini-w)` }}
      >
        {/* Left: menu space (could add kebab menu here) */}
        <div className="justify-self-start mr-2 sm:mr-3">
          {isOwnProfile && (
            <button
              onClick={onEditProfile}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all duration-300 flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Center: name + handle */}
        <div className="text-center">
          <h1 
            className="font-semibold leading-tight text-white line-clamp-1" 
            style={{ fontSize: 'var(--fs-display)' }}
          >
            {profile?.display_name || 'User'}
          </h1>
          <div 
            className="opacity-70 text-white/80 truncate max-w-[70%] mx-auto" 
            style={{ fontSize: 'var(--fs-handle)' }}
          >
            @{profile?.username || 'username'}
          </div>
        </div>

        {/* Right: mini card */}
        <div 
          className="justify-self-end rounded-lg border border-white/40 bg-white/20 backdrop-blur-sm shadow-sm overflow-hidden"
          style={{ 
            width: 'var(--mini-w)', 
            height: 'var(--mini-h)', 
            borderRadius: 'var(--mini-radius)' 
          }}
        >
          {profile?.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt="Mini profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Club + Handicap row aligned to mini card top */}
      <div 
        className="mt-3 grid items-start"
        style={{ gridTemplateColumns: '1fr 1fr', columnGap: 'clamp(12px, 4vw, 28px)' }}
      >
        <div className="text-center sm:text-left">
          <div className="opacity-60 text-white/60" style={{ fontSize: 'var(--fs-label)' }}>
            Golf Club
          </div>
          <div className="text-white" style={{ fontSize: 'var(--fs-value)' }}>
            {profile?.home_club || 'No Club'}
          </div>
        </div>
        <div className="text-center sm:text-right">
          <div className="opacity-60 text-white/60" style={{ fontSize: 'var(--fs-label)' }}>
            Handicap
          </div>
          <div className="text-white" style={{ fontSize: 'var(--fs-value)' }}>
            {profile?.eg_handicap_index !== null && profile?.eg_handicap_index !== undefined 
              ? `${profile.eg_handicap_index > 0 ? '+' : ''}${profile.eg_handicap_index.toFixed(1)}`
              : 'Not set'
            }
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlassmorphicProfileCard;