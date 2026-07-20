import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';

/**
 * Soft delete a business profile (owner only)
 */
export function useDeleteBusiness() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ businessId, userId }: { businessId: string; userId: string }) => {
      const { error } = await supabase.rpc('soft_delete_business', {
        _business_id: businessId,
      });
      if (error) throw error;
      return { businessId };
    },
    onSuccess: () => {
      // Invalidate all business-related queries
      queryClient.invalidateQueries({ queryKey: ['course-claim'] });
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });

      toast.success('Business deleted');

      navigate('/businesses/manage');
    },
    onError: (error: Error) => {
      console.error('Delete business error:', error);
      toast.error("Couldn't delete business", { description: error.message || 'Please try again' });
    },
  });
}
