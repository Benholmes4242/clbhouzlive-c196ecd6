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
          <div className="w-20 h-20 rounded-full bg-[hsl(38,92%,50%)]/10 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-[hsl(38,92%,50%)]" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-[22px] font-bold text-foreground tracking-tight">
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
        <div className="w-20 h-20 rounded-full bg-[hsl(38,92%,50%)]/10 flex items-center justify-center mb-4 animate-in fade-in zoom-in-75 duration-500">
          <CheckCircle2 size={44} className="text-[hsl(38,92%,50%)]" strokeWidth={1.5} />
        </div>

        <div className="text-center mb-8">
          <p className="text-[24px] font-bold text-foreground tracking-tight">
            You're all set!
          </p>
          <p className="text-[14px] text-muted-foreground mt-1.5">
            Welcome to Clbhouz. What do you want to do first?
          </p>
        </div>

        <div className="w-full space-y-3 max-w-sm">
          <button
            onClick={() => navigate('/courses', { replace: true })}
            className="w-full flex items-center gap-3.5 bg-[hsl(38,92%,50%)] rounded-2xl p-4 border-0 cursor-pointer active:scale-[0.98] transition-transform"
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
            className="w-full flex items-center gap-3.5 bg-muted rounded-2xl p-4 border border-border/40 cursor-pointer active:scale-[0.98] transition-transform"
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