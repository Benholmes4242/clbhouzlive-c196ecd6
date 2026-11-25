/** BC5 saved finish: only committed image URLs are shown; actions reuse live helpers. */
import { ChevronRight, Clock, Lock, ShieldCheck, Users, Pencil, Share } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
/** Brief 24B A5: a row that only unlocks once clbhouz approves the club claim. */
function LockedRow({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub: string }) {
  return <div className="bizc-next-row bizc-next-locked" role="button" aria-disabled="true" tabIndex={-1}><span className="bizc-next-icon"><Icon size={17} strokeWidth={1.8} aria-hidden="true" /></span><span className="bizc-next-text"><b>{title}</b><span>{sub}</span></span><Lock className="bizc-next-chevron" size={16} aria-hidden="true" /></div>;
}
/** Brief 24B Part A: a new Golf Club stays private (listing_status 'pending')
 * until clbhouz approves its claim, so the finish page never says it is live. */
function PendingClubFinish({ draft, result }: { draft: BusinessCreateDraft; result: CreateBusinessResult }) {
  const navigate = useNavigate();
  const { t } = useTranslation('profile');
  const identity = draftHeroIdentity(draft);
  const partial = partialPhotoCopy(result.partials);
  const k = (key: string, defaultValue: string, o?: Record<string, string>) => t(`businessPending.${key}`, { defaultValue, ...o });
  return <>
    <main className="bizc-body bizc-finish-body" data-testid="bizc-finish" data-pending="">
      <div className="bizc-kicker">{k('finishKicker', 'Claim sent')}</div><h1>{k('finishTitle', "We're checking your claim.")}</h1><p className="bizc-sub">{k('finishSub', "Your profile stays private until {{name}} is approved. We'll message you as soon as it is.", { name: identity.name })}</p>
      <div className="bizc-minihero">
        <div className="bizc-mini-cover bizc-finish-cover">{result.savedImages?.cover && <><img src={result.savedImages.cover} alt="" /><span className="bizc-mini-fade" /></>}<span className="bizc-review-pill" data-testid="bizc-review-pill"><Clock size={12} strokeWidth={2} aria-hidden="true" />{k('pill', 'Under review')}</span></div>
        <div className="bizc-mini-identity"><div className="bizc-mini-crest bizc-finish-crest">{result.savedImages?.logo ? <img src={result.savedImages.logo} alt="" /> : nameInitials(identity.name)}</div><div className="bizc-mini-name">{identity.name}</div><div className="bizc-mini-place">{identity.line}</div></div>
      </div>
      {partial && <p className="bizc-finish-note">{partial}</p>}
      <div className="bizc-group bizc-next-label">{k('whileLabel', 'While we check')}</div>
      <div className="bizc-rows bizc-next-rows">
        {result.claim === 'failed'
          ? <NextRow icon={Clock} title="Your club claim didn't go through" sub="File it again from Edit profile." onClick={() => navigate(`/business/${result.id}/edit`)} />
          : <div className="bizc-next-row bizc-next-status" data-testid="bizc-claim-status"><span className="bizc-next-icon"><Clock size={17} strokeWidth={1.8} aria-hidden="true" /></span><span className="bizc-next-text"><b>{k('statusTitle', 'Club claim under review')}</b><span>{k('statusSub', "Only you can see your profile until it's approved.")}</span></span></div>}
        <NextRow icon={Pencil} title={k('finishProfile', 'Finish your profile')} sub={k('finishProfileSub', 'Logo, cover photo, about and contact')} onClick={() => navigate(`/business/${result.id}/edit`)} />
      </div>
      <div className="bizc-group bizc-next-label">{k('unlocksLabel', 'Unlocks when approved')}</div>
      <div className="bizc-rows bizc-next-rows" data-testid="bizc-locked-rows">
        <LockedRow icon={Users} title="Invite your team" sub="Let staff post and reply" />
        <LockedRow icon={Pencil} title="Post your first update" sub="Shows on your profile and in Clubhouse" />
        <LockedRow icon={Share} title="Share your profile" sub="Copy your link or send it" />
      </div>
    </main>
    <div className="bizc-foot"><Button variant="ghost" className="bizc-primary" onClick={() => navigate('/', { replace: true })}>{k('backToClubhouse', 'Back to Clubhouse')}</Button></div>
  </>;
}
export function BusinessCreateFinish({ draft, result, userId }: { draft: BusinessCreateDraft; result: CreateBusinessResult; userId: string }) {
  const navigate = useNavigate();
  const identity = draftHeroIdentity(draft);
  const path = `/business/${result.slug || result.id}`;
  const partial = partialPhotoCopy(result.partials);
  const club = draft.category === 'Golf Club';
  if (club) return <PendingClubFinish draft={draft} result={result} />;
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