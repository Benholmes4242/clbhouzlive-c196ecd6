import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface EchoProfile {
  displayName: string | null;
  firstName: string | null;
  homeClub: string | null;
  handicap: number | null;
  location: string | null;
}

export function useEchoProfile(): EchoProfile {
  const { user } = useSupabaseSession();
  const [profile, setProfile] = useState<EchoProfile>({
    displayName: null,
    firstName: null,
    homeClub: null,
    handicap: null,
    location: null,
  });

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('user_profiles')
      .select('display_name, home_club, eg_handicap_index, city, country')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        const displayName = data.display_name || null;
        const firstName = displayName
          ? displayName.split(' ')[0]
          : null;
        setProfile({
          displayName,
          firstName,
          homeClub: data.home_club || null,
          handicap: data.eg_handicap_index ?? null,
          location: data.city
            ? `${data.city}${data.country ? ', ' + data.country : ''}`
            : data.country || null,
        });
      });
  }, [user?.id]);

  return profile;
}
