import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Star, BookOpen } from 'lucide-react';

interface Props {
  username: string;
  isNewUser?: boolean;
}

export function WizardSuccessScreen({ username, isNewUser = false }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNewUser) {
      const timer = setTimeout(() => {
        navigate(`/profile/${username}`, { replace: true });
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [username, navigate, isNewUser]);

  if (!isNewUser) {
    return (
      <div className="fixed inset-0 z-[101] flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-75 duration-500">
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={44} style={{ color: '#F7931E' }} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
              Profile saved
            </p>
            <p className="text-[14px] text-muted-foreground mt-1">
              Taking you to your profile…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // New user — richer CTA screen
  return (
    <div className="fixed inset-0 z-[101] flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mb-4 animate-in fade-in zoom-in-75 duration-500">
          <CheckCircle2 size={44} style={{ color: '#F7931E' }} strokeWidth={1.5} />
        </div>

        <div className="text-center mb-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 3, height: 10, background: '#F7931E', borderRadius: 1 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              Welcome to clbhouz
            </span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: '0 0 6px' }}>
            You're all set!
          </p>
          <p className="text-[14px] text-muted-foreground mt-1.5">
            What do you want to do first?
          </p>
        </div>

        <div className="w-full space-y-3 max-w-sm">
          <button
            onClick={() => navigate('/courses', { replace: true })}
            className="w-full flex items-center gap-3.5 rounded-2xl p-4 border-0 cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: '#F7931E', boxShadow: '0 4px 16px rgba(247,147,30,0.28)' }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Star size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-semibold text-white">Review a course</p>
              <p className="text-[12px] text-white/70">Rate courses you've played</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full flex items-center gap-3.5 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: 'rgba(15,23,42,0.05)', border: '0.5px solid rgba(15,23,42,0.10)' }}
          >
            <div className="w-10 h-10 rounded-full bg-muted-foreground/10 flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-semibold text-foreground">Explore the feed</p>
              <p className="text-[12px] text-muted-foreground">See what other golfers are posting</p>
            </div>
          </button>
        </div>
      </div>

      <div className="pb-8 pt-4 text-center">
        <p className="text-[12px] text-muted-foreground/50">
          You can always complete your profile later in settings
        </p>
      </div>
    </div>
  );
}