import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Realtime subscription for business verification updates.
 * Subscribes to business_accounts and business_verification_requests changes
 * for a specific business, enabling instant UI updates when status changes.
 */
export function useBusinessVerificationRealtime(businessId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!businessId) return;

    // Subscribe to business account changes (for is_verified updates)
    const businessChannel = supabase
      .channel(`business-verification-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_accounts',
          filter: `id=eq.${businessId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['business-account-verification-status', businessId] });
          queryClient.invalidateQueries({ queryKey: ['business-account', businessId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_verification_requests',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          // Match the exact key shape used by useBusinessVerificationRequest so the
          // owner's open UI refreshes when an admin flips status.
          queryClient.invalidateQueries({ queryKey: ['business-verification-request', businessId] });
          // Legacy key kept in case any other surface still references it.
          queryClient.invalidateQueries({ queryKey: ['business-verification-request-status', businessId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(businessChannel);
    };
  }, [businessId, queryClient]);
}

/**
 * Realtime subscription for admin verification queue.
 * Subscribes to all business_verification_requests changes for instant admin UI updates.
 */
export function useAdminVerificationQueueRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-verification-queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_verification_requests',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
          queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-count'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'business_verification_approvals',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
          queryClient.invalidateQueries({ queryKey: ['admin-verification-my-reviews'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Realtime subscription for user notifications related to business verification.
 * Subscribes to notifications table for instant notification updates.
 */
export function useVerificationNotificationsRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`verification-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}