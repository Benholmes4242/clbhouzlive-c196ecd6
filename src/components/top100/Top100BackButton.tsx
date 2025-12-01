import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface Top100BackButtonProps {
  to: string;
  label?: string;
}

export default function Top100BackButton({ to, label = 'Back to Top 100' }: Top100BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-1 text-slate-600 dark:text-slate-200 pl-1 pb-2 pt-1
                 text-[15px] font-medium hover:text-slate-900 dark:hover:text-white 
                 transition-colors"
    >
      <ChevronLeft size={18} strokeWidth={2} />
      {label}
    </button>
  );
}
