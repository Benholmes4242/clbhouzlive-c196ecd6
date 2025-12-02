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
      className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition"
    >
      <ChevronLeft className="mr-1 h-4 w-4" />
      {label}
    </button>
  );
}
