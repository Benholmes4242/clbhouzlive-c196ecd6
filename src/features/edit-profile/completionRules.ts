/** EP5 counts canonical settled inputs in action order; coach requires a display handicap. */
export type CompletionAction = 'avatar' | 'cover' | 'bio' | 'homeClub' | 'handicap' | 'coach' | 'topTen';
export interface CompletionInputs { avatar?: string | null; cover?: string | null; bio: string; homeClub: boolean; pendingClub: boolean; handicap: number | null; coach: boolean; topTen: number }
export function completionItems(p: CompletionInputs): { key: CompletionAction; label: string; done: boolean }[] {
 return [
 { key: 'avatar', label: 'Add a photo', done: !!p.avatar },
 { key: 'cover', label: 'Add a cover', done: !!p.cover },
 { key: 'bio', label: 'Add a bio', done: !!p.bio.trim() },
 { key: 'homeClub', label: 'Add your home club', done: p.homeClub || p.pendingClub },
 { key: 'handicap', label: 'Connect your handicap', done: p.handicap != null },
 ...(p.handicap != null ? [{ key: 'coach' as const, label: 'Name your coach', done: p.coach }] : []),
 { key: 'topTen', label: 'Add your Top 10', done: p.topTen > 0 },
 ];
}
export function arrivalAction(src: string | null): 'homeClub' | 'username' | null {
 return src === 'nudge_club' ? 'homeClub' : src === 'nudge_username' ? 'username' : null;
}
