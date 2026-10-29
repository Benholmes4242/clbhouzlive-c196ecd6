import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useDebounce } from '@/hooks/useDebounce';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { toast } from '@/lib/toast';
import { shortBusinessName } from '@/components/business/home/BusinessHomeHeader';
import {
  useBusinessTeam, useBusinessInvites, useCreateInvite, useCreateInviteByUser,
  AssignableBusinessRole, BUSINESS_ROLE_LABELS,
} from '@/hooks/useBusinessTeam';

/* CB79 Team section 5 — the invite screen (team-s5.html is the signed-off spec).
   Suggestions come from get_business_invite_suggestions (INVITE_SUGGEST_V1, not
   yet in types.ts — the (supabase.rpc as any) pattern). Sending stays with
   useCreateInviteByUser / useCreateInvite; both fire the email. The CB74.1
   membership guard below is unchanged. */

const CANVAS = '#0B0B0D';
const CARD = '#17171B';
const ROLE_CARD = '#1C1C21';
const FIELD_BG = '#141418';
const MAIL_TILE = '#232329';
const INK = '#F8FAFC';
const MUTE = 'rgba(248,250,252,0.62)';
const DIM = 'rgba(248,250,252,0.42)';
const LINE = 'rgba(255,255,255,0.08)';
const HAIR = 'rgba(255,255,255,0.06)';
const SELECTED_EDGE = 'rgba(255,255,255,0.9)';

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  profile_photo_url: string | null;
}

interface InviteSuggestion {
  user_id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  reason: 'home_club' | 'follower';
  followed_at: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_ORDER: AssignableBusinessRole[] = ['admin', 'editor', 'analyst'];

/** INVITE_SUGGEST_V1: up to 10 golfers, home club first then newest followers. */
function useBusinessInviteSuggestions(businessId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['business-invite-suggestions', businessId],
    enabled: !!businessId && enabled,
    queryFn: async () => {
      const res = (await (supabase.rpc as any)('get_business_invite_suggestions', { p_business_id: businessId })) ?? {};
      if (res.error) throw res.error;
      return (Array.isArray(res.data) ? res.data : []) as InviteSuggestion[];
    },
  });
}

function firstNameOf(name: string | null | undefined, username: string | null | undefined): string {
  const source = (name || username || '').trim();
  return source.split(/\s+/)[0] || '';
}

function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 22, height: 22, borderRadius: 11, flex: 'none',
        border: on ? `6px solid ${INK}` : '1.5px solid rgba(255,255,255,0.3)',
      }}
    />
  );
}

export default function BusinessInvitePage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromTeam = location.state?.fromTeam === true;
  // CB79.2: a Team-origin invite pops its existing entry, never pushes Team.
  // Cold/deep opens replace Invite with Team so the back stack cannot loop.
  const returnToTeam = () => {
    if (fromTeam) navigate(-1);
    else if (businessId) navigate(`/business/${businessId}/team`, { replace: true });
  };
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  useHideBottomNav();

  const { session, loading: sessionLoading } = useSupabaseSession();
  const { data: membership, isPending: membershipPending } = useBusinessMembership(businessId);
  const waiting = sessionLoading || (!!session?.user?.id && membershipPending);
  const canManage = !!membership?.canManage;
  // This guard hides the form; the invite RPCs remain the authorization boundary.
  useEffect(() => {
    if (!waiting && !canManage && businessId) {
      navigate(`/business/${businessId}/team`, { replace: true });
    }
  }, [waiting, canManage, businessId, navigate]);

  const { data: business } = useBusinessProfile(businessId);
  const { data: members } = useBusinessTeam(businessId);
  const { data: invites } = useBusinessInvites(businessId);
  const { data: suggestions } = useBusinessInviteSuggestions(businessId, !waiting && canManage);

  const businessName = business?.name || '';
  const subtitle = businessName ? (shortBusinessName(businessName) ?? businessName) : undefined;

  const [query, setQuery] = useState('');
  const [savedQuery, setSavedQuery] = useState('');
  const [pickedUser, setPickedUser] = useState<UserResult | null>(null);
  const [role, setRole] = useState<AssignableBusinessRole | null>(null);
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [focused, setFocused] = useState(false);

  const debounced = useDebounce(query, 250);
  const isEmail = useMemo(() => EMAIL_RE.test(query.trim()), [query]);

  const teamIds = useMemo(
    () => new Set((members || []).map((m) => m.user_profile_id)),
    [members],
  );
  const pendingInviteIds = useMemo(
    () => new Set(
      (invites || [])
        .filter((i) => i.status === 'pending' && new Date(i.expires_at).getTime() > Date.now() && i.invitee_user_id)
        .map((i) => i.invitee_user_id as string),
    ),
    [invites],
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (waiting || !canManage || pickedUser) return;
      const q = debounced.trim();
      if (q.length < 2 || EMAIL_RE.test(q)) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        // Strip characters that break a PostgREST .or() filter before interpolating.
        const clean = q.replace(/^@/, '').replace(/[(),%*\\]/g, '');
        if (!clean) {
          if (!cancelled) setResults([]);
          return;
        }
        const { data, error } = await supabase
          .from('public_profiles')
          .select('id, username, display_name, profile_photo_url')
          .or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`)
          .limit(10);
        if (error) throw error;
        if (!cancelled) setResults((data || []) as UserResult[]);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [debounced, pickedUser, waiting, canManage]);

  const firstName = pickedUser ? firstNameOf(pickedUser.display_name, pickedUser.username) : '';
  const emailAddress = query.trim();
  const sentMessage = pickedUser
    ? t('business.team.sectionFive.sentUser', { first: firstName, defaultValue: `Invite sent to ${firstName}` })
    : t('business.team.sectionFive.sentEmail', { email: emailAddress, defaultValue: `Invite sent to ${emailAddress}` });
  const createEmailInvite = useCreateInvite(businessId || '', { successMessage: sentMessage, showSuccessToast: !fromTeam });
  const createUserInvite = useCreateInviteByUser(businessId || '', { successMessage: sentMessage, showSuccessToast: !fromTeam });
  const pending = createEmailInvite.isPending || createUserInvite.isPending;

  const hasRecipient = !!pickedUser || isEmail;
  const canSend = !!businessId && !!role && hasRecipient && !waiting && canManage;

  const pickUser = (u: UserResult) => {
    setSavedQuery(query);
    setPickedUser(u);
    setQuery('');
    setResults([]);
  };

  const handleSend = async () => {
    if (!businessId || !canSend || !role) return;
    try {
      if (pickedUser) {
        await createUserInvite.mutateAsync({ userId: pickedUser.id, role });
      } else {
        await createEmailInvite.mutateAsync({ email: emailAddress, role });
      }
      queryClient.invalidateQueries({ queryKey: ['business-invite-suggestions', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-team-feed', businessId] });
      returnToTeam();
      if (fromTeam) toast.success(sentMessage);
    } catch {
      /* the hook toasts the refusal; the screen stays exactly as it was */
    }
  };

  if (waiting) return <GenericPageSkeleton />;
  if (!canManage) return null;

  const homeClub = (suggestions || []).filter((s) => s.reason === 'home_club');
  const followers = (suggestions || []).filter((s) => s.reason === 'follower');
  const showSuggestions = !pickedUser && query.trim().length === 0;
  const showSearchCard = !pickedUser && query.trim().length >= 2;

  // INVITE_SUGGEST_V2: follow dates were reset by the follows-table merge, so
  // the follower sub-line is just the handle — the group heading says why.
  const followerSub = (s: InviteSuggestion): string => `@${s.username || ''}`;

  const renderPersonRow = (
    key: string,
    person: { id: string; username: string | null; display_name: string | null; profile_photo_url: string | null },
    sub: string,
    first: boolean,
  ) => {
    const onTeam = teamIds.has(person.id);
    const invitePending = pendingInviteIds.has(person.id);
    const blocked = onTeam || invitePending;
    const name = person.display_name || person.username || '';
    return (
      <button
        key={key}
        type="button"
        disabled={blocked}
        onClick={() => pickUser({ id: person.id, username: person.username || '', display_name: person.display_name, profile_photo_url: person.profile_photo_url })}
        className="w-full flex items-center text-left"
        style={{ gap: 12, padding: '11px 0', borderTop: first ? 'none' : `1px solid ${HAIR}` }}
      >
        <SquircleAvatar
          src={person.profile_photo_url || undefined}
          alt={name}
          userId={person.id}
          size={40}
          hairlineRing
          ringColor={DARK_HAIRLINE}
        />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="block truncate" style={{ fontSize: 15, fontWeight: 700, color: blocked ? MUTE : INK }}>{name}</span>
          <span className="block truncate" style={{ fontSize: 12, color: DIM, marginTop: 2 }}>{sub}</span>
        </span>
        {blocked ? (
          <span style={{ flex: 'none', fontSize: 11.5, fontWeight: 700, color: DIM }}>
            {onTeam
              ? t('business.team.sectionFive.onTheTeam', { defaultValue: 'On the team' })
              : t('business.team.sectionFive.invitePending', { defaultValue: 'Invite pending' })}
          </span>
        ) : (
          <Radio on={false} />
        )}
      </button>
    );
  };

  const cardStyle: React.CSSProperties = {
    margin: '8px 16px 0', background: CARD, border: `1px solid ${LINE}`, borderRadius: 16, padding: '0 14px',
  };
  const headingStyle: React.CSSProperties = {
    padding: '18px 20px 0', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: MUTE,
  };

  const buttonLabel = !hasRecipient
    ? t('business.team.sectionFive.chooseSomeone', { defaultValue: 'Choose someone to invite' })
    : !role
      ? t('business.team.sectionFive.chooseRole', { defaultValue: 'Choose a role' })
      : pickedUser
        ? t('business.team.sectionFive.inviteUserCta', { first: firstName, role: t(`business.team.sectionOne.roles.${role}`, { defaultValue: BUSINESS_ROLE_LABELS[role] }), defaultValue: `Invite ${firstName} as an ${BUSINESS_ROLE_LABELS[role]}` })
        : t('business.team.sectionFive.inviteEmailCta', { role: t(`business.team.sectionOne.roles.${role}`, { defaultValue: BUSINESS_ROLE_LABELS[role] }), defaultValue: `Invite by email as an ${BUSINESS_ROLE_LABELS[role]}` });

  return (
    <ManagePageShell
      title={t('business.team.sectionFive.title', { defaultValue: 'Invite to team' })}
      subtitle={subtitle}
      onBack={returnToTeam}
    >
      <main className="max-w-lg mx-auto" style={{ paddingBottom: 170 }}>
        {!pickedUser && (
          <div
            className="flex items-center"
            style={{
              margin: '12px 16px 0', height: 48, borderRadius: 14, background: FIELD_BG,
              border: `1px solid ${focused ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.14)'}`,
              gap: 10, padding: '0 14px',
            }}
          >
            <Search size={17} style={{ color: DIM, flex: 'none' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t('business.team.sectionFive.searchPlaceholder', { defaultValue: 'Name, @handle or email' })}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-[rgba(248,250,252,0.42)]"
              style={{ fontSize: 15, color: INK, caretColor: INK }}
            />
          </div>
        )}

        {/* Suggestions — only before anyone types */}
        {showSuggestions && homeClub.length > 0 && (
          <section>
            <h2 style={headingStyle}>
              {t('business.team.sectionFive.homeClubGroup', { club: business?.club_name || '', defaultValue: `Home club: ${business?.club_name || ''}` })}
            </h2>
            <div style={cardStyle}>
              {homeClub.map((s, i) => renderPersonRow(
                s.user_id,
                { id: s.user_id, username: s.username, display_name: s.display_name, profile_photo_url: s.profile_photo_url },
                `@${s.username || ''} · ${t('business.team.sectionFive.playsHere', { defaultValue: 'plays here' })}`,
                i === 0,
              ))}
            </div>
          </section>
        )}
        {showSuggestions && followers.length > 0 && (
          <section>
            <h2 style={headingStyle}>
              {t('business.team.sectionFive.followGroup', { business: businessName, defaultValue: `Follow ${businessName}` })}
            </h2>
            <div style={cardStyle}>
              {followers.map((s, i) => renderPersonRow(
                s.user_id,
                { id: s.user_id, username: s.username, display_name: s.display_name, profile_photo_url: s.profile_photo_url },
                followerSub(s),
                i === 0,
              ))}
            </div>
          </section>
        )}

        {/* Search results / email row */}
        {showSearchCard && !isEmail && results.length > 0 && (
          <div style={{ ...cardStyle, marginTop: 12 }}>
            {results.map((u, i) => renderPersonRow(u.id, u, `@${u.username}`, i === 0))}
          </div>
        )}
        {showSearchCard && !isEmail && !isSearching && results.length === 0 && null}
        {showSearchCard && isEmail && (
          <div style={{ ...cardStyle, marginTop: 12 }}>
            <div className="flex items-center" style={{ gap: 12, padding: '11px 0' }}>
              <span
                className="flex items-center justify-center"
                style={{ width: 40, height: 40, borderRadius: 13, background: MAIL_TILE, color: MUTE, flex: 'none' }}
              >
                <Mail size={17} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="block truncate" style={{ fontSize: 15, fontWeight: 700, color: INK }}>
                  {t('business.team.sectionFive.inviteByEmail', { defaultValue: 'Invite by email' })}
                </span>
                <span className="block truncate" style={{ fontSize: 12, color: DIM, marginTop: 2 }}>{emailAddress}</span>
              </span>
              <Radio on />
            </div>
          </div>
        )}

        {/* Chosen person chip */}
        {pickedUser && (
          <div
            className="flex items-center"
            style={{
              margin: '12px 16px 0', minHeight: 56, borderRadius: 16, background: CARD,
              border: `1px solid ${SELECTED_EDGE}`, padding: '8px 12px 8px 8px', gap: 12,
            }}
          >
            <SquircleAvatar
              src={pickedUser.profile_photo_url || undefined}
              alt={pickedUser.display_name || pickedUser.username}
              userId={pickedUser.id}
              size={40}
              hairlineRing
              ringColor={DARK_HAIRLINE}
            />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="block truncate" style={{ fontSize: 15, fontWeight: 700, color: INK }}>
                {pickedUser.display_name || pickedUser.username}
              </span>
              <span className="block truncate" style={{ fontSize: 12, color: DIM, marginTop: 2 }}>@{pickedUser.username}</span>
            </span>
            <button
              type="button"
              onClick={() => { setPickedUser(null); setQuery(savedQuery); }}
              style={{ fontSize: 13, fontWeight: 700, color: DIM, flex: 'none' }}
            >
              {t('business.team.sectionFive.change', { defaultValue: 'Change' })}
            </button>
          </div>
        )}

        {/* Role — only once someone is chosen (person chip or email row) */}
        {hasRecipient && (
          <section>
            <h2 style={headingStyle}>{t('business.team.sectionFive.roleKicker', { defaultValue: 'Role' })}</h2>
            {ROLE_ORDER.map((r) => {
              const selected = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="w-full flex items-start text-left"
                  style={{
                    margin: '8px 16px 0', padding: '12px 14px', borderRadius: 16, background: ROLE_CARD,
                    border: `1px solid ${selected ? SELECTED_EDGE : LINE}`, gap: 12,
                    width: 'calc(100% - 32px)',
                  }}
                >
                  <Radio on={selected} />
                  <span>
                    <span className="block" style={{ fontSize: 14.5, fontWeight: 700, color: INK }}>
                      {t(`business.team.sectionOne.roles.${r}`, { defaultValue: BUSINESS_ROLE_LABELS[r] })}
                    </span>
                    <span className="block" style={{ fontSize: 12, lineHeight: 1.4, color: MUTE, marginTop: 3 }}>
                      {t(`business.team.sectionOne.descriptions.${r}`, { business: businessName, defaultValue: '' })}
                    </span>
                  </span>
                </button>
              );
            })}
          </section>
        )}
      </main>

      {/* Pinned footer */}
      <div className="fixed left-0 right-0 pointer-events-none" style={{ bottom: 0, zIndex: 40 }}>
        <div
          className="pointer-events-auto md:max-w-[440px] md:mx-auto"
          style={{
            padding: '12px 16px max(env(safe-area-inset-bottom, 0px), 26px)',
            background: `linear-gradient(to top, ${CANVAS} 70%, transparent)`,
          }}
        >
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || pending}
            className="w-full flex items-center justify-center active:opacity-90"
            style={{
              height: 52, borderRadius: 16, background: INK, color: CANVAS,
              fontSize: 15, fontWeight: 700, border: 'none',
              opacity: !canSend || pending ? 0.32 : 1,
            }}
          >
            {pending ? t('business.team.sectionFive.sending', { defaultValue: 'Sending…' }) : buttonLabel}
          </button>
          <p style={{ marginTop: 8, textAlign: 'center', fontSize: 11.5, lineHeight: 1.4, color: DIM }}>
            {isEmail && !pickedUser
              ? t('business.team.sectionFive.fineEmail', { defaultValue: 'They get an email with a link to join. Anyone with the link can use it, so send it only to the right address. It lasts 14 days.' })
              : t('business.team.sectionFive.finePerson', { defaultValue: 'They get a clbhouz notification and an email. Invites last 14 days.' })}
          </p>
        </div>
      </div>
    </ManagePageShell>
  );
}
