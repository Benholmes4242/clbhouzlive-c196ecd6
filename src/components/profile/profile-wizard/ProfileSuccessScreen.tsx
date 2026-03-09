/**
 * Backward-compatible ProfileSuccessScreen for business wizard
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  redirectTo?: string;
  message?: string;
  title?: string;
  subtitle?: string;
  onViewProfile?: () => void;
  onDone?: () => void;
}

export function ProfileSuccessScreen({ redirectTo, message, title, subtitle, onViewProfile, onDone }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (redirectTo) {
      const timer = setTimeout(() => navigate(redirectTo), 1800);
      return () => clearTimeout(timer);
    }
  }, [redirectTo, navigate]);

  return (
    <div className="fixed inset-0 z-[101] flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-75 duration-500">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 size={44} className="text-primary" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-[22px] font-bold text-foreground tracking-tight">
            {title ?? message ?? 'Profile saved'}
          </p>
          {subtitle && (
            <p className="text-[14px] text-muted-foreground mt-1">{subtitle}</p>
          )}
          {!subtitle && (
            <p className="text-[14px] text-muted-foreground mt-1">Redirecting…</p>
          )}
        </div>
        {(onViewProfile || onDone) && (
          <div className="flex gap-3 mt-4">
            {onViewProfile && (
              <button onClick={onViewProfile} className="px-4 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground">
                View Profile
              </button>
            )}
            {onDone && (
              <button onClick={onDone} className="px-4 py-2 text-sm font-medium rounded-xl bg-muted text-foreground">
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
