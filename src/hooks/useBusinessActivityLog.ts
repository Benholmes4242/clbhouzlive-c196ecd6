import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessActivityLogEntry {
  id: string;
  business_id: string;
  actor_user_id: string | null;
  type: string;
  metadata: Record<string, any>;
  created_at: string;
  actor_profile?: {
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
}

export function useBusinessActivityLog(businessId?: string, limit = 50) {
  return useQuery({
    queryKey: ['business-activity-log', businessId, limit],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_activity_log')
        .select(`
          id,
          business_id,
          actor_user_id,
          type,
          metadata,
          created_at
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch actor profiles separately
      const actorIds = [...new Set(data.filter(d => d.actor_user_id).map(d => d.actor_user_id))];
      let actorProfiles: Record<string, any> = {};

      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', actorIds);

        if (profiles) {
          actorProfiles = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }

      return data.map(entry => ({
        ...entry,
        actor_profile: entry.actor_user_id ? actorProfiles[entry.actor_user_id] || null : null,
      })) as BusinessActivityLogEntry[];
    },
  });
}

// Helper to get human-readable activity descriptions
export function getActivityDescription(entry: BusinessActivityLogEntry): {
  title: string;
  description: string;
  icon: 'verification' | 'team' | 'profile' | 'settings';
} {
  const actorName = entry.actor_profile?.display_name || entry.actor_profile?.username || 'Someone';
  const metadata = entry.metadata || {};

  switch (entry.type) {
    case 'verification_requested':
      return {
        title: 'Verification requested',
        description: `${actorName} submitted a verification request`,
        icon: 'verification',
      };
    case 'verification_approved':
      return {
        title: 'Verification approved',
        description: 'Business has been verified',
        icon: 'verification',
      };
    case 'verification_rejected':
      return {
        title: 'Verification rejected',
        description: metadata.reason || 'Verification request was rejected',
        icon: 'verification',
      };
    case 'verification_domain_check_requested':
      return {
        title: 'Domain verification required',
        description: `Domain ${metadata.domain || ''} needs to be verified`,
        icon: 'verification',
      };
    case 'verification_domain_confirmed':
      return {
        title: 'Domain verified',
        description: `Email ${metadata.email || ''} was confirmed`,
        icon: 'verification',
      };
    case 'team_invite_sent':
      return {
        title: 'Team invitation sent',
        description: `${actorName} invited ${metadata.email || 'someone'} as ${metadata.role || 'member'}`,
        icon: 'team',
      };
    case 'team_invite_accepted':
      return {
        title: 'Team invitation accepted',
        description: `${actorName} joined as ${metadata.role || 'member'}`,
        icon: 'team',
      };
    case 'team_member_removed':
      return {
        title: 'Team member removed',
        description: `${actorName} removed a ${metadata.removed_role || 'member'}`,
        icon: 'team',
      };
    case 'team_role_changed':
      return {
        title: 'Role changed',
        description: `${actorName} changed a role from ${metadata.old_role} to ${metadata.new_role}`,
        icon: 'team',
      };
    case 'profile_updated':
      return {
        title: 'Profile updated',
        description: `${actorName} updated the business profile`,
        icon: 'profile',
      };
    default:
      return {
        title: entry.type.replace(/_/g, ' '),
        description: `By ${actorName}`,
        icon: 'settings',
      };
  }
}
