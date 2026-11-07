/** Credit/thanks search shares the canonical mention queries. No notifications
 * or actor permission decisions are made by these composer-only adapters. */
import { searchMentionMembers, searchMentionBusinesses } from '@/components/mentions/MentionsComposerInput';
import type { VideoThanks } from './videoDetails';
export interface CreditPerson { id: string; name: string; avatarUrl: string | null; username: string | null; homeClub: string | null }
const pattern = (query: string) => `%${query.trim().replace(/[%_]/g, c => `\\${c}`)}%`;
export async function searchCreditPeople(query: string): Promise<CreditPerson[]> {
  if (!query.trim()) return [];
  const { data, error } = await searchMentionMembers(pattern(query), 8, true);
  if (error) throw error;
  return (data ?? []).map(row => ({ id: row.id, name: row.display_name || row.username || 'Golfer', avatarUrl: row.profile_photo_url ?? null, username: row.username, homeClub: 'home_club' in row && typeof row.home_club === 'string' ? row.home_club : null }));
}
export async function searchVideoBusinesses(query: string): Promise<VideoThanks[]> {
  if (!query.trim()) return [];
  const { data, error } = await searchMentionBusinesses(pattern(query), 8, true);
  if (error) throw error;
  return (data ?? []).map(row => ({ id: row.id, name: row.name, logoUrl: row.logo_url ?? null, category: 'category' in row && typeof row.category === 'string' ? row.category : null }));
}