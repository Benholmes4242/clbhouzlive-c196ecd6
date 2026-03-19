import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  useHideBottomNav();
  useHideHeader();

  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    const run = async () => {
      try {
        // Wait one tick for Supabase client to process URL hash tokens
        await new Promise(r => setTimeout(r, 150));

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setMessage('Session not found. Redirecting…');
          setTimeout(() => navigate('/auth', { replace: true }), 1500);
          return;
        }

        // Check for password recovery flow
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('type') === 'recovery') {
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        setMessage('Setting up your profile…');

        // Give the DB trigger time to create the profile row
        await new Promise(r => setTimeout(r, 700));

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, has_completed_onboarding')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile || !profile.has_completed_onboarding) {
          navigate('/edit-profile', { replace: true });
        } else {
          navigate('/', { replace: true });
        }

      } catch (err) {
        console.error('[AuthCallback]', err);
        setMessage('Something went wrong. Redirecting…');
        setTimeout(() => navigate('/auth', { replace: true }), 1500);
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-[#e8610a]" />
        <p className="text-[15px] text-white/60">{message}</p>
      </div>
    </div>
  );
}
