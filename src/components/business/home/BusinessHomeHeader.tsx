/**
 * CB66 — Business home, section 1: the header (switcher, identity, buttons,
 * status rows). Values are literal from the signed-off biz-header.html.
 *
 * Ownership:
 * - Verification state comes from `deriveVerificationState` plus the domain
 *   rule (requires_domain_check && !domain_confirmed); claim rules mirror
 *   BusinessCommandCard's canClaimCourse. Status rows render only after both
 *   per-business reads settle, so rows may appear but never disappear.
 * - Status rows and the ··· menu are owner/admin only; Delete is owner only.
 * - Share goes through `shareBusinessProfile` (shared with BusinessProfilePage).
 * - Business colour: memberships carry no colour field, so initials sit on a
 *   deterministic gradient picked from the business id.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal, Plus, Eye, Share, Trash2, ShieldCheck, Globe, Clock, AlertCircle, Flag } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { getCityCountry } from '@/lib/locationDisplay';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';
import { useBusinessVerificationRequest, deriveVerificationState } from '@/hooks/useBusinessVerificationRequest';
import { useBusinessCourseClaim } from '@/hooks/useBusinessCourseClaim';
import { CLUB_ANALYTICS_CATEGORY } from '@/features/business/clubAnalytics/useClubCourseLink';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { shareBusinessProfile, businessProfileShareUrl } from '@/lib/business/shareBusinessProfile';
import { ClaimYourCourseSheet } from '@/components/business/ClaimYourCourseSheet';
import { Skeleton } from '@/components/ui/skeleton';

/* Literal mock values. */
export const H = {
  ink: '#F8FAFC',
  mute: 'rgba(248,250,252,0.62)',
  dim: 'rgba(248,250,252,0.42)',
  line: 'rgba(255,255,255,0.08)',
  card: '#17171B',
  onInk: '#0B0B0D',
  btnHair: 'rgba(255,255,255,0.14)',
  actFill: 'rgba(255,255,255,0.04)',
  chipOn: 'rgba(255,255,255,0.9)',
  menuBg: '#202026',
  menuHair: 'rgba(255,255,255,0.1)',
  hair: 'rgba(255,255,255,0.06)',
  danger: '#FF6B6B',
} as const;

const GRADIENTS = [
  'linear-gradient(140deg,#5a3d1f,#a0703c)',
  'linear-gradient(140deg,#2c4a2e,#5f8a4f)',
  'linear-gradient(140deg,#1f3a5a,#3f6e9c)',
  'linear-gradient(140deg,#4a2c4a,#8a4f7f)',
  'linear-gradient(140deg,#4a3a1f,#8a7a3c)',
];
export function businessColour(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}
export function businessInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join('').toUpperCase();
}
/**
 * CB66.1: drop trailing words (and trailing punctuation-only words like "&")
 * while the name is over 14 characters; never cut inside a word, never an
 * ellipsis. Returns null when even the first word alone is over 14, so the
 * button falls back to a bare "Post".
 */
export function shortBusinessName(name: string): string | null {
  const words = name.trim().split(/\s+/);
  const punctOnly = (w: string) => !/[\p{L}\p{N}]/u.test(w);
  while (words.length > 1 && words.join(' ').length > 14) {
    words.pop();
    while (words.length > 1 && punctOnly(words[words.length - 1])) words.pop();
  }
  const result = words.join(' ');
  return result.length <= 14 ? result : null;
}

export const ROLE_LINE: Record<BusinessMembership['role'], string> = {
  owner: "You're the primary manager",
  admin: "You're a manager",
  editor: "You're an editor",
  analyst: "You're an analyst",
};

type Biz = BusinessMembership['business'];

function Logo({ business, size, radius, fontSize }: { business: Biz; size: number; radius: number; fontSize: number }) {
  return (
    <div
      data-business-logo=""
      className="shrink-0 overflow-hidden flex items-center justify-center"
      style={{
        width: size, height: size, borderRadius: radius,
        background: business.logo_url ? '#1a1a1f' : businessColour(business.id),
        border: size >= 60 ? `1px solid ${H.line}` : undefined,
        fontSize, fontWeight: 800, color: '#fff',
      }}
    >
      {business.logo_url
        ? <img src={business.logo_url} alt="" className="w-full h-full object-cover" />
        : businessInitials(business.name)}
    </div>
  );
}

/* ─────────────────────── switcher ─────────────────────── */

export function BusinessSwitcher({
  memberships, selectedId, onSelect, onAdd,
}: { memberships: BusinessMembership[]; selectedId: string | null; onSelect: (id: string) => void; onAdd: () => void }) {
  return (
    <div
      data-switcher=""
      className="flex no-scrollbar"
      style={{ gap: 8, padding: '10px 16px 4px', overflowX: 'auto', flexWrap: 'nowrap' }}
    >
      {memberships.map((m) => {
        const on = m.business.id === selectedId;
        return (
          <button
            key={m.business.id}
            type="button"
            data-chip={m.business.id}
            aria-pressed={on}
            onClick={() => onSelect(m.business.id)}
            className="flex items-center shrink-0"
            style={{
              gap: 7, height: 36, padding: '0 12px 0 5px', borderRadius: 18,
              border: `1px solid ${on ? H.chipOn : H.line}`, background: 'transparent',
              color: on ? H.ink : H.mute, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            }}
          >
            <Logo business={m.business} size={26} radius={9} fontSize={10} />
            {m.business.name}
          </button>
        );
      })}
      <button
        type="button"
        data-chip-add=""
        onClick={onAdd}
        className="flex items-center shrink-0"
        style={{
          gap: 4, height: 36, padding: '0 12px', borderRadius: 18, border: `1px solid ${H.line}`,
          background: 'transparent', color: H.mute, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
        }}
      >
        <Plus style={{ width: 16, height: 16 }} strokeWidth={1.9} />
        Add
      </button>
    </div>
  );
}

/* ─────────────────────── status row ─────────────────────── */

function StatusRow({
  kind, icon: Icon, title, sub, action, onAction,
}: {
  kind: string;
  icon: LucideIcon;
  title: string; sub: string; action?: string; onAction?: () => void;
}) {
  return (
    <div
      data-status-row={kind}
      className="flex items-center"
      style={{
        margin: '10px 16px 0', border: `1px solid ${H.line}`, background: H.card,
        borderRadius: 14, padding: '11px 12px 11px 14px', gap: 12,
      }}
    >
      <span className="flex shrink-0" style={{ color: H.mute }}><Icon style={{ width: 16, height: 16 }} strokeWidth={1.9} /></span>
      <div className="flex-1 min-w-0">
        <b className="block" style={{ fontSize: 13.5, fontWeight: 700, color: H.ink }}>{title}</b>
        <span className="block" style={{ marginTop: 2, fontSize: 12, lineHeight: 1.35, color: H.mute }}>{sub}</span>
      </div>
      {action && (
        <button
          type="button"
          data-status-action=""
          onClick={onAction}
          className="shrink-0 flex items-center"
          style={{
            height: 30, padding: '0 13px', borderRadius: 15, border: `1px solid ${H.btnHair}`,
            background: H.actFill, color: H.ink, fontSize: 12.5, fontWeight: 700,
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

function StatusRows({ business, userId }: { business: Biz; userId: string }) {
  const navigate = useNavigate();
  const [claimOpen, setClaimOpen] = useState(false);
  const { data: request, isLoading: vLoading } = useBusinessVerificationRequest(business.id);
  const { data: claim, isLoading: cLoading } = useBusinessCourseClaim(business.id);
  if (vLoading || cLoading) return null;

  const state = deriveVerificationState(business.is_verified, request);
  const domain = !!request?.requires_domain_check && !request?.domain_confirmed;
  // Today's card and menu send every unverified state to the verification flow.
  const toVerify = () => navigate(`/business/${business.id}/verification`);

  let verification: React.ReactNode = null;
  if (state === 'none') {
    verification = <StatusRow kind="none" icon={ShieldCheck} title="Not verified yet" sub={`The badge tells golfers this is the real ${business.name}.`} action="Get verified" onAction={toVerify} />;
  } else if (state === 'pending' && domain) {
    verification = <StatusRow kind="domain" icon={Globe} title="Verify your domain" sub="The last step before your verification is reviewed." action="Verify" onAction={toVerify} />;
  } else if (state === 'pending') {
    verification = <StatusRow kind="pending" icon={Clock} title="Verification pending" sub="Our team is reviewing your request." />;
  } else if (state === 'needs_more_info') {
    verification = <StatusRow kind="needs_more_info" icon={AlertCircle} title="We need a little more" sub="Your verification request is waiting on you." action="Respond" onAction={toVerify} />;
  } else if (state === 'rejected') {
    verification = <StatusRow kind="rejected" icon={ShieldCheck} title="Verification not approved" sub="You can apply again with new evidence." action="Reapply" onAction={toVerify} />;
  }

  let course: React.ReactNode = null;
  if (business.category === CLUB_ANALYTICS_CATEGORY && !business.club_id) {
    const inFlight = claim?.status === 'pending' || claim?.status === 'needs_more_info';
    course = inFlight
      ? <StatusRow kind="claim_pending" icon={Clock} title={`Your claim on ${claim?.courseName || business.name} is with our team`} sub="Claiming a course is separate from verification." />
      : <StatusRow kind="claim" icon={Flag} title="Claim your course" sub={`Link ${business.name} to its course page to unlock course analytics.`} action="Claim" onAction={() => setClaimOpen(true)} />;
  }

  return (
    <>
      {verification}
      {course}
      <ClaimYourCourseSheet open={claimOpen} onClose={() => setClaimOpen(false)} businessId={business.id} businessName={business.name} userProfileId={userId} />
    </>
  );
}

/* ─────────────────────── header ─────────────────────── */

export function BusinessHomeHeader({
  membership, userId, onRequestDelete,
}: { membership: BusinessMembership; userId: string; onRequestDelete: (input: { id: string; name: string }) => void }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { business, role } = membership;
  const canManage = role === 'owner' || role === 'admin';
  const canPost = role !== 'analyst';
  const loc = getCityCountry({ city: business.city, region: business.region, country: business.country, location: business.location });
  const subline = [business.category?.trim() || null, loc].filter(Boolean).join(' · ');
  const slugOrId = business.slug || business.id;

  const btn: React.CSSProperties = {
    flex: 1, height: 44, borderRadius: 14, gap: 7, fontSize: 14, fontWeight: 700,
  };
  const menuItem: React.CSSProperties = { height: 44, padding: '0 14px', gap: 10, fontSize: 14, fontWeight: 600 };

  return (
    <div data-business-header="" data-role={role}>
      <div style={{ padding: '16px 16px 0' }}>
        <div className="flex items-center" style={{ gap: 14 }}>
          <Logo business={business} size={60} radius={18} fontSize={20} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center" style={{ gap: 7, fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', color: H.ink, lineHeight: 1.2 }}>
              <span className="truncate">{business.name}</span>
              {business.is_verified && <span data-verified-badge="" className="inline-flex shrink-0"><VerifiedBadge size="sm" className="!w-[17px] !h-[17px]" /></span>}
            </div>
            {subline && <div data-subline="" style={{ marginTop: 3, fontSize: 13, color: H.mute }}>{subline}</div>}
            <div data-role-line="" style={{ marginTop: 2, fontSize: 12, color: H.dim }}>{ROLE_LINE[role]}</div>
          </div>
          {canManage && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="More options" data-header-menu="" className="self-start shrink-0 flex items-center justify-center" style={{ minWidth: 40, minHeight: 40, marginTop: -6, marginRight: -10, color: H.mute, background: 'transparent', border: 'none' }}>
                  <MoreHorizontal style={{ width: 16, height: 16 }} strokeWidth={1.9} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0" style={{ width: 250, background: H.menuBg, border: `1px solid ${H.menuHair}`, borderRadius: 14, padding: '4px 0', boxShadow: '0 12px 30px rgba(0,0,0,.5)' }}>
                <DropdownMenuItem
                  data-menu-item="share"
                  className="cursor-pointer rounded-none"
                  style={{ ...menuItem, color: H.ink }}
                  onClick={() => shareBusinessProfile({ businessId: business.id, name: business.name, url: businessProfileShareUrl(slugOrId), userId })}
                >
                  <Share style={{ width: 16, height: 16 }} strokeWidth={1.9} />Share profile
                </DropdownMenuItem>
                {role === 'owner' && (
                  <DropdownMenuItem
                    data-menu-item="delete"
                    className="cursor-pointer rounded-none"
                    style={{ ...menuItem, color: H.danger, borderTop: `1px solid ${H.hair}` }}
                    onClick={() => {
                      // Close the menu before the hoisted dialog opens (Radix layer race).
                      setMenuOpen(false);
                      requestAnimationFrame(() => onRequestDelete({ id: business.id, name: business.name }));
                    }}
                  >
                    <Trash2 style={{ width: 16, height: 16 }} strokeWidth={1.9} />Delete business profile
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex" style={{ marginTop: 14, gap: 8 }}>
          {canPost && (
            <button
              type="button"
              data-cta="post"
              onClick={() => usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: business.id })}
              className="flex items-center justify-center min-w-0"
              style={{ ...btn, background: H.ink, color: H.onInk, border: 'none' }}
            >
              <Plus className="shrink-0" style={{ width: 16, height: 16 }} strokeWidth={1.9} />
              <span className="truncate">{(() => { const s = shortBusinessName(business.name); return s ? `Post as ${s}` : 'Post'; })()}</span>
            </button>
          )}
          <button
            type="button"
            data-cta="view"
            onClick={() => navigate(`/business/${slugOrId}`)}
            className="flex items-center justify-center"
            style={{ ...btn, background: 'transparent', border: `1px solid ${H.btnHair}`, color: H.ink }}
          >
            <Eye className="shrink-0" style={{ width: 16, height: 16 }} strokeWidth={1.9} />
            View profile
          </button>
        </div>
      </div>
      {canManage && <StatusRows key={business.id} business={business} userId={userId} />}
    </div>
  );
}

/* ─────────────────────── loading ─────────────────────── */

export function BusinessHomeHeaderSkeleton() {
  const sk = { background: 'rgba(255,255,255,0.06)', borderRadius: 8 } as const;
  return (
    <div data-business-header-skeleton="">
      <div className="flex" style={{ gap: 8, padding: '10px 16px 4px' }}>
        <Skeleton style={{ ...sk, width: 110, height: 36, borderRadius: 18 }} />
        <Skeleton style={{ ...sk, width: 70, height: 36, borderRadius: 18 }} />
      </div>
      <div style={{ padding: '16px 16px 0' }}>
        <div className="flex items-center" style={{ gap: 14 }}>
          <Skeleton style={{ ...sk, width: 60, height: 60, borderRadius: 18 }} />
          <div style={{ flex: 1 }}>
            <Skeleton style={{ ...sk, width: '58%', height: 22 }} />
            <Skeleton style={{ ...sk, width: '76%', height: 13, marginTop: 8 }} />
            <Skeleton style={{ ...sk, width: '46%', height: 12, marginTop: 6 }} />
          </div>
        </div>
        <div className="flex" style={{ marginTop: 14 }}>
          <Skeleton style={{ ...sk, flex: 1, height: 44, borderRadius: 14 }} />
        </div>
      </div>
    </div>
  );
}
