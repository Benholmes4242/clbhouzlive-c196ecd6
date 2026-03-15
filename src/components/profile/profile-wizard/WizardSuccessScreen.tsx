import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  username: string;
}

export function WizardSuccessScreen({ username }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/profile/${username}`);
    }, 1800);
    return () => clearTimeout(timer);
  }, [username, navigate]);

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
