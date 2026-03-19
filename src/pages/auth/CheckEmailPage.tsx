import { useLocation, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

export default function CheckEmailPage() {
  useHideBottomNav();
  useHideHeader();

  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email || 'your inbox';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-6"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 20%, rgba(20, 20, 22, 1) 0%, #0a0a0a 100%)',
      }}
    >
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
          Didn't receive it? Check your spam folder, or{' '}
          <button
            onClick={() => navigate('/auth')}
            className="text-white/50 underline underline-offset-2"
          >
            go back and try again
          </button>.
        </p>
      </div>
    </div>
  );
}
