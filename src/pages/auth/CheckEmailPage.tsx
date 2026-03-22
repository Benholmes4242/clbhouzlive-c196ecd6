import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail } from 'lucide-react';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';

export default function CheckEmailPage() {
  useHideBottomNav();
  useHideHeader();
  useMedianStatusBar('dark', '#0d0d0d', true, false);

  useLayoutEffect(() => {
    document.body.classList.add('route-auth');
    return () => document.body.classList.remove('route-auth');
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email || 'your inbox';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{
        background: 'linear-gradient(180deg, #0d0d0d 0%, #111111 100%)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Subtle grain texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="flex flex-col items-center gap-5 p-8 rounded-3xl max-w-sm w-full text-center"
        style={{
          background: 'rgba(10, 10, 10, 0.78)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <Mail className="w-7 h-7 text-white/70" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">Check your inbox</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            We sent a verification link to{' '}
            <span className="text-white/80 font-medium">{email}</span>.
            Tap it to complete your signup.
          </p>
        </div>

        <p className="text-xs text-white/30 leading-relaxed pt-2">
          Didn't receive it? Typical — these things always end up in spam.{' '}
          Check your junk folder, it's almost certainly lurking in there.{' '}
          Still nothing?{' '}
          <button
            onClick={() => navigate('/auth')}
            className="text-white/50 underline underline-offset-2"
          >
            Go back and try again
          </button>.
        </p>
      </div>
    </div>
  );
}
