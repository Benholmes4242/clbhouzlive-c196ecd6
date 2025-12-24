import { supabase } from '@/integrations/supabase/client';

export interface BulkResult {
  success: string[];
  failed: { id: string; error: string }[];
}

/**
 * Bulk approve or reject verification requests
 */
export async function verifyBulk(
  action: 'approve' | 'reject',
  entityType: 'business' | 'golfer',
  ids: string[],
  reason?: string
): Promise<BulkResult> {
  const { data, error } = await supabase.functions.invoke('verify-bulk', {
    body: {
      action,
      entity_type: entityType,
      ids,
      reason,
    },
  });

  if (error) {
    console.error('[verifyBulk] Error:', error);
    throw new Error(error.message || 'Bulk verification failed');
  }

  return data as BulkResult;
}

/**
 * Bulk revoke admin invites
 */
export async function revokeBulkInvites(ids: string[]): Promise<BulkResult> {
  const { data, error } = await supabase.functions.invoke('admin-invite-manage', {
    body: {
      action: 'revoke_bulk',
      ids,
    },
  });

  if (error) {
    console.error('[revokeBulkInvites] Error:', error);
    throw new Error(error.message || 'Bulk revoke failed');
  }

  return data as BulkResult;
}
