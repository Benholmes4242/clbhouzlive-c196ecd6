import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Soft delete a business profile (owner only)
 */
export function useDeleteBusiness() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ businessId, userId }: { businessId: string; userId: string }) => {
      // Check if user is owner
      const { data: membership, error: membershipError } = await supabase
        .from('business_members')
        .select('role')
        .eq('business_id', businessId)
        .eq('user_profile_id', userId)
        .single();

      if (membershipError || !membership) {
        throw new Error('You do not have permission to delete this business');
      }

      if (membership.role !== 'owner') {
        throw new Error('Only the owner can delete this business');
      }

      // Soft delete the business
      const { error: deleteError } = await supabase
        .from('business_accounts')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (deleteError) throw deleteError;

      // Remove all memberships
      const { error: membershipDeleteError } = await supabase
        .from('business_members')
        .delete()
        .eq('business_id', businessId);

      if (membershipDeleteError) {
        console.error('Error removing memberships:', membershipDeleteError);
      }

      return { businessId };
    },
    onSuccess: () => {
      // Invalidate all business-related queries
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });

      toast.success('Business profile deleted', { description: 'The business profile has been removed from Clbhouz.' });

      navigate('/businesses/manage');
    },
    onError: (error: Error) => {
      console.error('Delete business error:', error);
      toast.error('Error', { description: error.message || 'Failed to delete business profile. Please try again.' });
    },
  });
}
