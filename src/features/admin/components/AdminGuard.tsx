import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';

async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return !!data;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['auth', 'is_admin'],
    queryFn: checkIsAdmin,
    staleTime: 60_000,
  });

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
