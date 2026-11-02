/** EXPLORE_TOP_1 people row: server ordering/permissions, one day-post viewer path,
 * and the existing creator sheet layout. You always stays white (mock-B ruling).
 * The WS1 export name and data-watch-creators marker remain for existing consumers.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { getProfilePathById } from '@/lib/profileRoutes';
import { toast } from '@/lib/toast';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { loadPublishedViewerPosts } from '@/lib/publishedPostViewer';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { useExplorePeopleRow, type ExplorePerson } from './useExplorePeopleRow';
import './explore-top.css';

let viewedThisSession = false;
export function resetCreatorsRowSessionForTests() { viewedThisSession = false; }
const MUTE = 'var(--explore-top-mute)';

function PersonAvatar({ person, size }: { person: ExplorePerson; size: number }) {
  return <SquircleAvatar src={person.avatar_url ?? undefined} alt={person.display_name} userId={person.actor_id} size={size} fallback={person.display_name.charAt(0)} hairlineRing />;
}

export function CreatorsRow({ userId, onDepart = () => {} }: { userId: string | undefined; onDepart?: () => void }) {
  const { user } = useSupabaseSession();
  const signedIn = !!userId && !!user?.id && user.is_anonymous !== true;
  const people = useExplorePeopleRow(21, signedIn ? userId : undefined);
  const navigate = useNavigate();
  const location = useLocation();
  const { activeActor } = useActiveActor();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const request = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const list = people.data ?? [];
  const others = list.filter((p) => p.tier !== 'you');
  const you = list.find((p) => p.tier === 'you');
  const row = [...(you ? [you] : []), ...others.slice(0, 20)];
  const visible = signedIn && !people.isError && others.length > 0;
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !visible || viewedThisSession) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5) && !viewedThisSession) {
        viewedThisSession = true;
        analyticsEvents.track('explore_row_viewed');
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);
  useEffect(() => () => { request.current += 1; }, []);

  const openPerson = async (person: ExplorePerson, position: number) => {
    if (!signedIn) return;
    analyticsEvents.track('explore_row_tapped', { tier: person.tier, position, has_new: person.has_new });
    if (person.tier === 'you') {
      analyticsEvents.track('explore_row_you_tapped');
      setSheetOpen(false);
      usePostStudioStore.getState().openPostStudio({ actorType: 'personal', actorId: userId, returnPath: location.pathname + location.search });
      return;
    }
    if (!person.has_new) {
      setSheetOpen(false);
      navigate(getProfilePathById(person.actor_id, undefined, person.handle ?? undefined));
      return;
    }
    const token = ++request.current;
    setPending(person.actor_id);
    try {
      const posts = await loadPublishedViewerPosts(person.new_post_ids, { userId, actorId: activeActor?.id ?? userId ?? null, actorType: activeActor?.type === 'business' ? 'business' : 'personal' });
      if (request.current !== token) return;
      if (!posts.length) { toast.error("This post isn't available"); return; }
      setSheetOpen(false);
      onDepart();
      openWithOrigin({ posts, index: 0, originEl: null, openedFrom: 'explore-people', forceStartAtZero: true });
    } catch {
      if (request.current === token) toast.error("Couldn't load this post");
    } finally {
      if (request.current === token) setPending(null);
    }
  };

  if (!signedIn) return null;
  if (!people.isFetched) return <div data-watch-creators="skeleton" className="explore-people" aria-hidden><div className="explore-people-scroll">{Array.from({ length: 5 }, (_, i) => <span key={i} className="explore-person"><span className="explore-person-ring explore-person-skeleton" /><span className="explore-name-skeleton" /></span>)}</div></div>;
  if (!visible) return null;
  return <div ref={rootRef} data-watch-creators="row" className="explore-people">
    <div className="explore-people-scroll no-scrollbar">
      {row.map((person, i) => <Button key={person.actor_id} variant="ghost" className="explore-person" aria-label={person.tier === 'you' ? 'You' : person.display_name} aria-busy={pending === person.actor_id} onClick={() => void openPerson(person, i + 1)}>
        <span className="explore-person-ring" data-creator-ring={person.has_new ? 'true' : undefined}>
          <PersonAvatar person={person} size={64} />
          {person.tier === 'you' ? <span className="explore-person-plus" data-explore-plus aria-hidden><Plus size={10} strokeWidth={4} /></span> : null}
        </span>
        <span className="explore-person-name" data-name-ink={person.has_new || person.tier === 'you' ? 'ink' : 'mute'}>{person.tier === 'you' ? 'You' : person.display_name}</span>
      </Button>)}
      {others.length >= 21 ? <Button variant="ghost" className="explore-person" onClick={() => { analyticsEvents.track('explore_row_see_all'); setSheetOpen(true); }}><span className="explore-person-see"><ChevronRight size={18} strokeWidth={2.4} /></span><span className="explore-person-name" data-name-ink="mute">See all</span></Button> : null}
    </div>
    {sheetOpen ? <CreatorsSheet userId={userId} pending={pending} onClose={() => setSheetOpen(false)} onOpen={openPerson} /> : null}
  </div>;
}

function CreatorsSheet({ userId, pending, onClose, onOpen }: { userId: string | undefined; pending: string | null; onClose: () => void; onOpen: (person: ExplorePerson, position: number) => Promise<void> }) {
  const { t } = useTranslation('courses');
  const people = useExplorePeopleRow(50, userId);
  return <BottomSheet open onClose={onClose} scrollBody ariaLabelledBy="watch-creators-sheet-title">
    <div style={{ padding: '0 16px 24px', fontFamily: SANS }}>
      <h2 id="watch-creators-sheet-title" style={{ margin: 0, padding: '4px 0 12px', fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK }}>{t('amateur.watch.creators.title', 'Creators')}</h2>
      {(people.data ?? []).map((person, i) => <div key={person.actor_id} role="button" tabIndex={0} aria-busy={pending === person.actor_id} onClick={() => void onOpen(person, i + 1)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); void onOpen(person, i + 1); } }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', cursor: 'pointer', borderTop: i ? `0.5px solid ${A.BORDER}` : undefined, textAlign: 'left' }}>
        <PersonAvatar person={person} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15, fontWeight: 600, color: A.INK }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.tier === 'you' ? 'You' : person.display_name}</span>{person.is_verified ? <VerifiedBadge size="sm" /> : null}</div></div>
        {person.tier !== 'you' ? <CreatorFollowPill creator={person} /> : null}
      </div>)}
    </div>
  </BottomSheet>;
}

/** 32px outline pill; Following dims to mute with a 0.1-alpha border — the
 *  Find people pill, through the same canonical useToggleFollow mutation. */
function CreatorFollowPill({ creator }: { creator: ExplorePerson }) {
  const { t } = useTranslation('common');
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  const [followed, setFollowed] = useState(false);
  const [pending, setPending] = useState(false);

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) {
      toast.error(t('findPeople.signIn', { defaultValue: 'Please sign in' }));
      return;
    }
    const prev = followed;
    setFollowed(!prev);
    setPending(true);
    try {
      await toggle.mutateAsync({
        targetActorType: 'personal',
        targetActorId: creator.actor_id,
        targetUserId: 'personal' === 'personal' ? creator.actor_id : undefined,
        viewerActorType: activeActor?.type ?? 'personal',
        viewerActorId: activeActor?.id ?? user.id,
        viewerUserId: user.id,
        isFollowing: prev,
      });
    } catch {
      setFollowed(prev);
      toast.error(prev ? 'Could not unfollow' : 'Could not follow');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      style={{
        flex: 'none',
        height: 32,
        padding: '0 14px',
        borderRadius: 999,
        border: followed ? '1px solid rgba(248,250,252,0.1)' : '1px solid rgba(248,250,252,0.28)',
        background: 'transparent',
        color: followed ? MUTE : A.INK,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: SANS,
        cursor: 'pointer',
      }}
    >
      {followed
        ? t('findPeople.following', { defaultValue: 'Following' })
        : t('findPeople.follow', { defaultValue: 'Follow' })}
    </button>
  );
}

export default CreatorsRow;
