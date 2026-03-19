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
    <div className="min-h-[100dvh] bg-black flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Mail size={28} className="text-[#e8610a]" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] font-bold text-white">Check your inbox</h1>
          <p className="text-[15px] text-white/50 leading-relaxed">
            We sent a verification link to{' '}
            <span className="text-white/80 font-medium">{email}</span>.
            Tap it to complete your signup.
          </p>
        </div>
        <p className="text-[13px] text-white/30 leading-relaxed">
          Didn't receive it? Check your spam folder, or{' '}
          <button onClick={() => navigate('/auth')} className="text-white/50 underline underline-offset-2">
            go back and try again
          </button>.
        </p>
      </div>
    </div>
  );
}
