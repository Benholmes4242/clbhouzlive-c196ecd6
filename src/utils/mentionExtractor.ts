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
 * Resolve usernames to user IDs
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
 * Create mention notifications for all mentioned users
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
  
  const mentionedUsers = await resolveUsernames(usernames);
  
  // Filter out the current user (don't notify yourself)
  const usersToNotify = mentionedUsers.filter(u => u.id !== currentUserId);
  
  if (usersToNotify.length === 0) return;
  
  const notifications = usersToNotify.map(u => ({
    user_id: u.id,
    recipient_actor_type: 'personal',
    recipient_actor_id: u.id,
    actor_id: currentUserId,
    type: 'mention',
    title: 'Mentioned you',
    message: entityType === 'post' ? 'mentioned you in a post' : 'mentioned you in a comment',
    entity_type: entityType,
    entity_id: entityId,
    data: { post_id: postId },
  }));
  
  const { error } = await supabase.from('notifications').insert(notifications);
  
  if (error) {
    console.error('Error creating mention notifications:', error);
  }
}
