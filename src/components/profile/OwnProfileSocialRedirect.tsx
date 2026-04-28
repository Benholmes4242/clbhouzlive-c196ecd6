import { Navigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { Loader2 } from 'lucide-react';

interface Props {
  tab: 'followers' | 'following' | 'friends';
}

export default function OwnProfileSocialRedirect({ tab }: Props) {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { profile, loading: profileLoading } = useProfileData();

  if (sessionLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !profile?.username) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to view this page.</p>
      </div>
    );
  }

  const search =
    tab === 'friends'
      ? '?tab=following&filter=friends'
      : tab === 'following'
      ? '?tab=following'
      : '';
  return <Navigate to={`/profile/${profile.username}/followers${search}`} replace />;
}
