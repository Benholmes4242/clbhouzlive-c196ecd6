import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { scheduleRadixBodyLockSanitize } from '@/lib/radixLockSanitizer';

/**
 * Soft delete a business profile (owner only)
 *
 * Body-lock safety net: after invalidations, `scheduleRadixBodyLockSanitize`
 * checks — post-commit — whether `<body>` has a stranded `pointer-events:
 * none` from Radix's DismissableLayer with no live owner and clears it. It is
 * conditional-safe: it no-ops when our own body-scroll-lock counter is > 0
 * OR any Radix dialog is still open. This flow can only be initiated from
 * the confirm dialog on `/businesses/manage`, which is the sole modal live
 * during the mutation — so the guard's assumption holds. If a future nested
 * flow ever runs a business delete *underneath* another open modal, the
 * guard will refuse to sanitize and the safety net becomes a no-op rather
 * than stomping a legitimate lock. See `src/lib/radixLockSanitizer.ts`.
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

      // Runs AFTER React commits the invalidation-driven card eviction.
      // Only clears a stuck body pointer-events lock when no legitimate
      // owner remains (see helper).
      scheduleRadixBodyLockSanitize();
    },
    onError: (error: Error) => {
      console.error('Delete business error:', error);
      toast.error("Couldn't delete business", { description: error.message || 'Please try again' });
    },
  });
}
