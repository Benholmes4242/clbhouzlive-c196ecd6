/** ST3 owns Privacy presentation, not writes: the parent's canonical privacy
 * hook supplies live values/setters; Profile remains the only handicap editor.
 * Sheets reuse BizcSheet lifecycle with locally scoped geometry and tokens. */
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import type { usePrivacySettings, VisibilityLevel } from '@/hooks/usePrivacySettings';
import { strangerSummary, visibilityLabel } from './privacySummary';
import { useSettingsBlockedCount } from './useSettingsBlockedCount';
import './settingsPrivacy.css';

type Sheet = 'profile' | 'leaderboards' | 'courses';
const SHEETS = {
  profile: { title: 'Profile', sub: 'Who can open your profile and posts.', lines: ['Any golfer can open your profile.', "Only your friends can. Everyone else sees it's private."] },
  leaderboards: { title: 'Leaderboards', sub: 'Who sees you ranked on the boards, Course Champions and course records.', lines: ['Any golfer sees where you rank.', 'Only your friends see you on the boards.', "You're left off every board."] },
  courses: { title: 'Courses', sub: 'Your Top 100 lists and your Courses tab, wherever they appear. Your counts stay on the boards either way.', lines: ["Any golfer sees the courses you've played.", 'Only your friends see them.', 'Only you see them.'] },
};
const LEVELS: VisibilityLevel[] = ['public', 'friends', 'private'];
interface Props { userId?: string; privacy: ReturnType<typeof usePrivacySettings>; onToggleRounds: (value: boolean) => void; onBlocked: () => void }
export function SettingsPrivacyCard({ userId, privacy: p, onToggleRounds, onBlocked }: Props) {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [busy, setBusy] = useState(false);
  const blocked = useSettingsBlockedCount(userId);
  const summary = strangerSummary({ isPublic: p.isPublic, handicap: p.handicapVisibility, leaderboards: p.leaderboardVisibility, courses: p.top100Visibility });
  const values = { profile: p.isPublic ? 'public' : 'friends', leaderboards: p.leaderboardVisibility, courses: p.top100Visibility } as const;
  const updating = { profile: p.isUpdatingPrivacy, leaderboards: p.isUpdatingLeaderboardVisibility, courses: p.isUpdatingTop100Visibility };
  const close = () => { if (!busy) setSheet(null); };
  const save = async (key: Sheet, value: VisibilityLevel) => {
    if (busy || updating[key]) return;
    setBusy(true);
    try {
      if (key === 'profile') await p.togglePublic(value === 'public');
      else if (key === 'leaderboards') await p.setLeaderboardVisibilityLevel(value);
      else await p.setTop100VisibilityLevel(value);
    } finally { setBusy(false); setSheet(null); }
  };
  return <>
    <div className="ep-rows st3-privacy" data-testid="settings-privacy">
      <div className="st3-seen"><i>What a golfer you don't know sees</i><p data-testid="stranger-summary">{summary.map((s, i) => <span key={i} className={s.tone === 'mute' ? 'st3-mute' : undefined}>{s.text}</span>)}</p></div>
      {(['profile', 'leaderboards', 'courses'] as const).map(key => <Button key={key} variant="ghost" className="ep-row" disabled={updating[key]} onClick={() => setSheet(key)}>
        <span className="ep-row-label">{SHEETS[key].title}</span><span className="ep-row-value">{visibilityLabel(values[key])}</span><ChevronRight size={18} className="ep-row-chev" aria-hidden />
      </Button>)}
      <div className="ep-row st3-rounds"><span className="ep-row-label">New rounds</span><span className="ep-row-value">Tell my followers</span><Button variant="ghost" className="bizc-switch st3-switch" role="switch" aria-label="New rounds" aria-checked={p.autoPostRounds} disabled={p.isUpdatingAutoPostRounds} onClick={() => onToggleRounds(!p.autoPostRounds)}><i aria-hidden /></Button></div>
      <Button variant="ghost" className="ep-row" onClick={onBlocked}><span className="ep-row-label">Blocked</span><span className={`ep-row-value${blocked === 0 ? ' ph' : ''}`} data-testid="settings-blocked-value">{blocked == null ? null : blocked === 0 ? 'No one' : `${blocked} ${blocked === 1 ? 'golfer' : 'golfers'}`}</span><ChevronRight size={18} className="ep-row-chev" aria-hidden /></Button>
    </div>
    <p className="st3-note">Your handicap, clubs and Top 10 each have their own setting on the Profile tab.</p>
    {sheet && <BizcSheet title={SHEETS[sheet].title} sub={SHEETS[sheet].sub} testId="st3-privacy-sheet" onDone={close} actionDisabled={busy || updating[sheet]}>
      <div className="st3-options" role="radiogroup" aria-label={SHEETS[sheet].title}>{LEVELS.slice(0, sheet === 'profile' ? 2 : 3).map((value, index) => <Button key={value} variant="ghost" className="ep-opt" role="radio" aria-checked={values[sheet] === value} disabled={busy || updating[sheet]} onClick={() => void save(sheet, value)}><span><b>{visibilityLabel(value)}</b><small>{SHEETS[sheet].lines[index]}</small></span><i className="ep-radio" aria-hidden /></Button>)}</div>
    </BizcSheet>}
  </>;
}