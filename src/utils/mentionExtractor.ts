import { supabase } from '@/integrations/supabase/client';

/**
 * Extract @mentions from text and return unique usernames (without the @ symbol)
 */
export function extractMentions(text: string): string[] {
  const mentions = text.match(/@(\w+)/g) || [];
  // Remove @ and dedupe
  const usernames = [...new Set(mentions.map(m => m.slice(1).toLowerCase()))];
  return usernames;
}

/**
 * Resolved mention entity with type information
 */
interface ResolvedMention {
  entity_id: string;
  entity_type: 'user' | 'business';
  username: string;
}

/**
 * Resolve usernames to user IDs (legacy - personal users only)
 */
export async function resolveUsernames(usernames: string[]): Promise<{ id: string; username: string }[]> {
  if (usernames.length === 0) return [];
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username')
    .in('username', usernames);
  
  if (error) {
    console.error('Error resolving usernames:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Resolve slug usernames against taggable_entities.
 * Handles both exact matches (tomholmes42) and slug variants
 * (danny_holmes → "danny holmes" or "dannyholmes").
 */
async function resolveAllMentions(usernames: string[]): Promise<ResolvedMention[]> {
  if (usernames.length === 0) return [];

  const results: ResolvedMention[] = [];

  for (const slug of usernames) {
    const withSpaces = slug.replace(/_/g, ' ');
    const withoutSeparators = slug.replace(/_/g, '');

    // Build OR clause covering exact slug, space variant, and no-separator variant
    const orClause = [slug, withSpaces, withoutSeparators]
      .filter((v, i, arr) => arr.indexOf(v) === i) // dedupe
      .map(v => `username.ilike.${v}`)
      .join(',');

    const { data, error } = await supabase
      .from('taggable_entities')
      .select('entity_id, entity_type, username')
      .or(orClause)
      .in('entity_type', ['user', 'business'])
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error resolving mention for', slug, error);
      continue;
    }
    if (data) {
      results.push({
        entity_id: data.entity_id,
        entity_type: data.entity_type as 'user' | 'business',
        username: data.username || slug,
      });
    }
  }

  return results;
}

/**
 * Store structured mention records in comment_mentions table
 */
async function storeCommentMentions(
  commentId: string,
  mentions: ResolvedMention[]
): Promise<void> {
  if (mentions.length === 0) return;

  const rows = mentions.map(m => ({
    comment_id: commentId,
    mentioned_entity_type: m.entity_type,
    mentioned_entity_id: m.entity_id,
    mentioned_username: m.username,
  }));

  const { error } = await supabase
    .from('comment_mentions' as any)
    .upsert(rows, { onConflict: 'comment_id,mentioned_entity_type,mentioned_entity_id', ignoreDuplicates: true });

  if (error) {
    console.error('Error storing comment mentions:', error);
  }
}

/**
 * Get business team members (owners/admins) for notification routing
 */
async function getBusinessTeamUserIds(businessId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('business_members')
    .select('user_profile_id, role')
    .eq('business_id', businessId)
    .in('role', ['owner', 'admin']);

  if (error) {
    console.error('Error fetching business team:', error);
    return [];
  }

  return (data || []).map(m => m.user_profile_id);
}

/**
 * Create mention notifications for all mentioned users AND businesses
 * Also stores structural mention records in comment_mentions table
 */
export async function createMentionNotifications(
  text: string,
  currentUserId: string,
  entityType: 'post' | 'comment',
  entityId: string,
  postId: string
): Promise<void> {
  const usernames = extractMentions(text);
  if (usernames.length === 0) return;
  
  // Resolve all mentions (users + businesses) via taggable_entities
  const allMentions = await resolveAllMentions(usernames);
  
  // Store structural mentions if this is a comment
  if (entityType === 'comment') {
    await storeCommentMentions(entityId, allMentions);
  }

  if (allMentions.length === 0) return;

  const notifications: any[] = [];

  for (const mention of allMentions) {
    if (mention.entity_type === 'user') {
      // Skip self-mention
      if (mention.entity_id === currentUserId) continue;

      notifications.push({
        user_id: mention.entity_id,
        recipient_actor_type: 'personal',
        recipient_actor_id: mention.entity_id,
        actor_id: currentUserId,
        type: 'mention',
        title: 'Mentioned you',
        message: entityType === 'post' ? 'mentioned you in a post' : 'mentioned you in a comment',
        entity_type: entityType,
        entity_id: entityId,
        data: { post_id: postId },
      });
    } else if (mention.entity_type === 'business') {
      // Get all owners/admins of this business to notify
      const teamUserIds = await getBusinessTeamUserIds(mention.entity_id);
      
      for (const teamUserId of teamUserIds) {
        // Skip if the current user is the team member
        if (teamUserId === currentUserId) continue;

        notifications.push({
          user_id: teamUserId, // For legacy routing
          recipient_actor_type: 'business',
          recipient_actor_id: mention.entity_id,
          actor_id: currentUserId,
          type: 'mention',
          title: 'Mentioned your business',
          message: entityType === 'post' ? 'mentioned your business in a post' : 'mentioned your business in a comment',
          entity_type: entityType,
          entity_id: entityId,
          data: { post_id: postId, business_id: mention.entity_id },
        });
      }
    }
  }
  
  if (notifications.length === 0) return;

  const { error } = await supabase
    .from('notifications')
    .upsert(notifications, { onConflict: 'user_id,type,actor_id', ignoreDuplicates: true });
  
  if (error) {
    console.error('Error creating mention notifications:', error);
  }
}
