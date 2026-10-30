/** ST3 sentence ownership: profile is Everyone/Friends; other privacy values
 * retain usePrivacySettings' canonical levels. Tone is presentation only. */
import type { VisibilityLevel } from '@/hooks/usePrivacySettings';

export type PrivacySegment = { text: string; tone: 'ink' | 'mute' };
export interface StrangerPrivacy { isPublic: boolean; handicap: VisibilityLevel; leaderboards: VisibilityLevel; courses: VisibilityLevel }
export function strangerSummary(p: StrangerPrivacy): PrivacySegment[] {
  const items = [
    { text: 'your profile', level: p.isPublic ? 'public' : 'friends', boards: false },
    { text: 'your handicap', level: p.handicap, boards: false },
    { text: "the courses you've played", level: p.courses, boards: false },
    { text: 'where you rank on the boards', level: p.leaderboards, boards: true },
  ];
  const segments: PrivacySegment[] = [];
  const push = (text: string, tone: PrivacySegment['tone'] = 'ink') => segments.push({ text, tone });
  const clause = (texts: string[], prefix?: string) => {
    if (!texts.length) return;
    if (segments.length) push(' ', 'mute');
    if (prefix) push(`${prefix} `, 'mute');
    texts.forEach((text, index) => {
      if (index) push(index === texts.length - 1 ? ' and ' : ', ', 'mute');
      push(!prefix && index === 0 ? text[0].toUpperCase() + text.slice(1) : text);
    });
    push('.');
  };
  clause(items.filter(i => i.level === 'public').map(i => i.text));
  clause(items.filter(i => i.level === 'friends').map(i => i.text), 'Only friends see');
  if (p.leaderboards === 'private') clause(['the boards'], "You're left off");
  clause(items.filter(i => i.level === 'private' && !i.boards).map(i => i.text), 'Only you see');
  return segments;
}

export const visibilityLabel = (value: VisibilityLevel) => value === 'public' ? 'Everyone' : value === 'friends' ? 'Friends' : 'Only me';