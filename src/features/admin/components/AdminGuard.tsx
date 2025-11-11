import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const { data: ok, isLoading } = useQuery({
    queryKey: ['auth.is_admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) return false;
      return !!data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (ok === false) nav('/');
  }, [ok, nav]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/70">Loading...</div>
      </div>
    );
  }
  
  if (!ok) return null;
  return <>{children}</>;
}
