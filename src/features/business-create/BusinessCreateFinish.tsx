/** BC5 saved finish: only committed image URLs are shown; actions reuse live helpers. */
import { ChevronRight, Clock, ShieldCheck, Users, Pencil, Share } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { businessProfileShareUrl, shareBusinessProfile } from '@/lib/business/shareBusinessProfile';
import { toast } from '@/lib/toast';
import { draftHeroIdentity } from './step4Rules';
import { nameInitials } from './step2Rules';
import type { BusinessCreateDraft } from './createRules';
import type { CreateBusinessResult } from './createBusiness';

export function partialPhotoCopy(partials: string[]): string | null {
  if (!partials.length) return null;
  const photos = partials.includes('photos') || (partials.includes('logo') && partials.includes('cover photo'));
  return `Your ${photos ? 'photos' : partials[0]} didn't upload. Add ${photos ? 'them' : 'it'} from Edit profile.`;
}
function NextRow({ icon: Icon, title, sub, onClick }: { icon: LucideIcon; title: string; sub: string; onClick?: () => void }) {
  const content = <><span className="bizc-next-icon" data-info={!onClick}><Icon size={17} strokeWidth={1.8} aria-hidden="true" /></span><span className="bizc-next-text"><b>{title}</b><span>{sub}</span></span>{onClick && <ChevronRight className="bizc-next-chevron" size={18} aria-hidden="true" />}</>;
  return onClick ? <Button variant="ghost" className="bizc-next-row" onClick={onClick}>{content}</Button> : <div className="bizc-next-row">{content}</div>;
}
export function BusinessCreateFinish({ draft, result, userId }: { draft: BusinessCreateDraft; result: CreateBusinessResult; userId: string }) {
  const navigate = useNavigate();
  const identity = draftHeroIdentity(draft);
  const path = `/business/${result.slug || result.id}`;
  const partial = partialPhotoCopy(result.partials);
  const club = draft.category === 'Golf Club';
  return <>
    <main className="bizc-body bizc-finish-body" data-testid="bizc-finish">
      <div className="bizc-kicker">All set</div><h1>{identity.name} is live.</h1><p className="bizc-sub">This is how golfers will see you.</p>
      <div className="bizc-minihero">
        <div className="bizc-mini-cover bizc-finish-cover">{result.savedImages?.cover && <><img src={result.savedImages.cover} alt="" /><span className="bizc-mini-fade" /></>}</div>
        <div className="bizc-mini-identity"><div className="bizc-mini-crest bizc-finish-crest">{result.savedImages?.logo ? <img src={result.savedImages.logo} alt="" /> : nameInitials(identity.name)}</div><div className="bizc-mini-name">{identity.name}</div><div className="bizc-mini-place">{identity.line}</div></div>
      </div>
      {(draft.category === 'Golf Academy' || draft.category === 'Coach / Instructor') && <p className="bizc-finish-note">Golfers can now name you as their coach.</p>}
      {partial && <p className="bizc-finish-note">{partial}</p>}
      <div className="bizc-group bizc-next-label">Next</div>
      <div className="bizc-rows bizc-next-rows">
        {!club ? <NextRow icon={ShieldCheck} title="Get verified" sub="Free. Earns the badge golfers trust." onClick={() => navigate(`/business/${result.id}/verification`)} /> : result.claim === 'filed' ? <NextRow icon={Clock} title="Club claim under review" sub="We'll let you know once it's checked." /> : result.claim === 'failed' ? <NextRow icon={Clock} title="Your club claim didn't go through" sub="File it again from Edit profile." onClick={() => navigate(`/business/${result.id}/edit`)} /> : null}
        <NextRow icon={Users} title="Invite your team" sub="Let staff post and reply" onClick={() => navigate(`/business/${result.id}/team/invite`)} />
        <NextRow icon={Pencil} title="Post your first update" sub="Shows on your profile and in Clubhouse" onClick={() => usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: result.id })} />
        <NextRow icon={Share} title="Share your profile" sub="Copy your link or send it" onClick={() => { void shareBusinessProfile({ businessId: result.id, name: identity.name, url: businessProfileShareUrl(result.slug || result.id), userId }).catch(() => toast.error("Couldn't share your profile. Try again.")); }} />
      </div>
    </main>
    <div className="bizc-foot"><Button variant="ghost" className="bizc-primary" onClick={() => navigate(path, { replace: true })}>View my profile</Button></div>
  </>;
}