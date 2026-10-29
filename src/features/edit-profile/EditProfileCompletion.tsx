/** EP5 reuses golf/coach caches. Read failures suppress the card rather than invent completion. */
import { Button } from '@/components/ui/button';
import { useHomeClubStatus } from '@/features/home-club/useHomeClubStatus';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { useMyCoach } from '@/features/coach/hooks';
import { completionItems, type CompletionInputs, type CompletionAction } from './completionRules';
export function CompletionCard({ inputs, loading, onAction }: { inputs: CompletionInputs; loading: boolean; onAction: (action: CompletionAction) => void }) {
 const items = completionItems(inputs), missing = items.filter(item => !item.done);
 if (loading || !missing.length) return null;
 return <div className="ep-completion" data-testid="ep-completion">
 <b>{missing.length === 1 ? '1 thing left' : `${missing.length} things left`}</b>
 <p>Golfers trust a profile they can place.</p>
 <div className="ep-completion-bar" role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={items.length - missing.length}>
 {items.map(item => <i key={item.key} data-item={item.key} data-done={item.done} />)}
 </div>
 <div className="ep-completion-chips">{missing.slice(0, 3).map(item => <Button key={item.key} variant="ghost" className="ep-completion-chip" data-action={item.key} onClick={() => onAction(item.key)}>{item.label}</Button>)}</div>
 </div>;
}
export function EditProfileCompletion({ userId, inputs, loading, onAction }: { userId: string; inputs: Omit<CompletionInputs, 'pendingClub' | 'coach' | 'topTen'>; loading: boolean; onAction: (action: CompletionAction) => void }) {
 const home = useHomeClubStatus(userId), top = useUserTopTenCourses(userId), coach = useMyCoach(userId, inputs.handicap != null);
 return <CompletionCard inputs={{ ...inputs, pendingClub: home.state === 'pending' || !!home.hasOpenRequest, coach: !!coach.data, topTen: top.topTen.length }} loading={loading || !!home.isLoading || !!top.isLoading || (inputs.handicap != null && (!coach.isSuccess || coach.isError))} onAction={onAction} />;
}
