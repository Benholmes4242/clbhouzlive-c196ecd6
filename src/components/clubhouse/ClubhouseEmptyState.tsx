import React from 'react';
import { Compass, Users } from 'lucide-react';
import { FriendsEmptyState } from '@/components/clubhouse/FriendsEmptyState';

interface ClubhouseEmptyStateProps {
  activeTab: 'foryou' | 'friends';
  user: { id: string } | null | undefined;
  isError: boolean;
  onSignIn: () => void;
  onRetry: () => void;
  userId?: string;
  onSeeYourFeed: () => void;
}

export const ClubhouseEmptyState: React.FC<ClubhouseEmptyStateProps> = ({
  activeTab,
  user,
  isError,
  onSignIn,
  onRetry,
  userId,
  onSeeYourFeed,
}) => {
  if (activeTab === 'friends') {
    if (!user) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
          style={{ background: '#15171F', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 70px)' }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Users className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>
          <p className="text-[17px] font-semibold mb-1" style={{ color: '#FFFFFF' }}>Sign in to see your friends</p>
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Create an account or sign in to start following golfers.
          </p>
          <button
            onClick={onSignIn}
            style={{ background: '#F7931E', color: '#0F172A', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.10em', padding: '12px 24px', borderRadius: 12, border: 'none' }}
          >
            Sign in
          </button>
        </div>
      );
    }
    if (isError) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
          style={{ background: '#15171F', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 70px)' }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Users className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>
          <p className="text-[17px] font-semibold mb-1" style={{ color: '#FFFFFF' }}>Couldn’t load your feed</p>
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Tap retry to try again.</p>
          <button
            onClick={onRetry}
            style={{ background: '#0F172A', color: '#FFFFFF', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.10em', padding: '12px 24px', borderRadius: 12, border: 'none' }}
          >
            Retry
          </button>
        </div>
      );
    }
    return <FriendsEmptyState userId={userId ?? user.id} onSeeYourFeed={onSeeYourFeed} />;
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
      style={{ background: '#15171F', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 70px)' }}
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <Compass className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.5)' }} />
      </div>
      <p className="text-lg font-semibold mb-1" style={{ color: '#FFFFFF' }}>
        {!user ? 'Sign in to see your feed' : (isError ? 'Couldn’t load your feed' : 'No posts to show')}
      </p>
      <p className="text-[14px] mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {!user ? 'Create an account or sign in to get started.' : (isError ? 'Tap retry to try again.' : 'Check back soon for new content')}
      </p>
      {!user ? (
        <button
          onClick={onSignIn}
          style={{ background: '#F7931E', color: '#0F172A', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.10em', padding: '12px 24px', borderRadius: 12, border: 'none' }}
        >
          Sign in
        </button>
      ) : (
        <button
          onClick={onRetry}
          style={{ background: '#0F172A', color: '#FFFFFF', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.10em', padding: '12px 24px', borderRadius: 12, border: 'none' }}
        >
          Retry
        </button>
      )}
    </div>
  );
};
