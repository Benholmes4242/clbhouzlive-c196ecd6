import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Mail, AtSign, Shield, Edit3, BarChart3, Check, X, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useDebounce } from '@/hooks/useDebounce';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import {
  useCreateInvite, useCreateInviteByUser,
  AssignableBusinessRole, BUSINESS_ROLE_LABELS,
} from '@/hooks/useBusinessTeam';

/* NO PRIVATE PALETTE - see BusinessReviewsPage. Shared manage vocabulary,
   derived from the analytical `A` ramp. */
import { INK, INK_45, HAIR, CARD_BG, PAGE_BG } from '@/components/manage/ui';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { BIZ } from '@/components/business/businessTokens';

const AMBER = A.AMBER;
const AMBER_SOFT = BIZ.amberTint;

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  profile_photo_url: string | null;
}

const ROLES: ReadonlyArray<{ value: AssignableBusinessRole; label: string; description: string; icon: typeof Shield }> = [
  { value: 'admin', label: 'Admin', description: 'Manage the business profile, posts, and team.', icon: Shield },
  { value: 'editor', label: 'Editor', description: 'Create and publish posts as the business.', icon: Edit3 },
  { value: 'analyst', label: 'Analyst', description: 'View insights and analytics only.', icon: BarChart3 },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BusinessInvitePage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  useHideBottomNav();

  const createEmailInvite = useCreateInvite(businessId || '');
  const createUserInvite = useCreateInviteByUser(businessId || '');

  const [query, setQuery] = useState('');
  const [pickedUser, setPickedUser] = useState<UserResult | null>(null);
  const [role, setRole] = useState<AssignableBusinessRole>('editor');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debounced = useDebounce(query, 250);
  const isEmail = useMemo(() => EMAIL_RE.test(query.trim()), [query]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (pickedUser) return;
      const q = debounced.trim();
      if (q.length < 2 || EMAIL_RE.test(q)) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const clean = q.replace(/^@/, '');
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
  }, [debounced, pickedUser]);

  const canSend = !!businessId && !!role && (pickedUser || (isEmail && !!query.trim()));

  const handleSend = async () => {
    if (!businessId || !canSend) return;
    try {
      if (pickedUser) {
        await createUserInvite.mutateAsync({ userId: pickedUser.id, role });
      } else {
        await createEmailInvite.mutateAsync({ email: query.trim(), role });
      }
      navigate(-1);
    } catch {
      /* toast handled in hook */
    }
  };

  const pending = createEmailInvite.isPending || createUserInvite.isPending;

  return (
    <ManagePageShell title="Invite to team">
      <main className="px-4 pt-4 pb-22 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[13px] leading-relaxed mb-5" style={{ color: INK_45 }}>
            They'll get an email and a clbhouz notification to accept. You can change their role or remove access anytime.
          </p>

          {/* Recipient */}
          <div
            className="mb-5"
            style={{
              background: CARD_BG,
              border: `1px solid ${HAIR}`,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <label className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{ color: INK_45 }}>
              Recipient
            </label>

            {pickedUser ? (
              <div className="mt-2 flex items-center gap-3 py-2">
                <SquircleAvatar
                  src={pickedUser.profile_photo_url || undefined}
                  alt={pickedUser.display_name || pickedUser.username}
                  size={40}
                  hairlineRing
                  ringColor={DARK_HAIRLINE}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14px] truncate" style={{ color: INK }}>
                    {pickedUser.display_name || pickedUser.username}
                  </p>
                  <p className="text-[12px] truncate" style={{ color: INK_45 }}>@{pickedUser.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPickedUser(null); setQuery(''); }}
                  className="h-8 w-8 flex items-center justify-center rounded-full active:bg-black/[0.06]"
                  aria-label="Clear recipient"
                >
                  <X size={16} color={INK_45} />
                </button>
              </div>
            ) : (
              <>
                <div className="relative mt-2">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: INK_45 }} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Email or @handle"
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    className="w-full pl-10 pr-3 py-2.5 text-[14px] outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${HAIR}`,
                      borderRadius: 10,
                      color: INK,
                    }}
                  />
                </div>

                {/* State hints */}
                {query.trim().length >= 2 && (
                  <div className="mt-3 space-y-1">
                    {isEmail ? (
                      <div className="flex items-center gap-2 py-2 px-1 text-[13px]" style={{ color: INK_45 }}>
                        <Mail size={14} />
                        Will send an email invite to <span className="font-semibold" style={{ color: INK }}>{query.trim()}</span>
                      </div>
                    ) : isSearching ? (
                      <div className="py-3 text-center text-[12px]" style={{ color: INK_45 }}>Searching…</div>
                    ) : results.length > 0 ? (
                      results.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => { setPickedUser(u); setQuery(''); setResults([]); }}
                          className="w-full flex items-center gap-3 py-2 px-1 rounded-lg active:bg-black/[0.03] text-left"
                        >
                          <SquircleAvatar
                            src={u.profile_photo_url || undefined}
                            alt={u.display_name || u.username}
                            size={36}
                            hairlineRing
                            ringColor={DARK_HAIRLINE}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[13.5px] truncate" style={{ color: INK }}>
                              {u.display_name || u.username}
                            </p>
                            <p className="text-[11.5px] truncate" style={{ color: INK_45 }}>@{u.username}</p>
                          </div>
                          <AtSign size={14} color={INK_45} />
                        </button>
                      ))
                    ) : (
                      <div className="py-3 text-center text-[12px]" style={{ color: INK_45 }}>
                        No user found. Enter an email to send an invite by mail.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Roles */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{ color: INK_45 }}>
                Role
              </span>
            </div>
            <div className="space-y-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const selected = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className="w-full flex items-start gap-3 p-3.5 text-left active:opacity-90"
                    style={{
                      background: CARD_BG,
                      border: `1px solid ${selected ? 'rgba(247,147,30,0.35)' : HAIR}`,
                      borderRadius: 14,
                      boxShadow: selected ? `0 0 0 3px ${AMBER_SOFT}` : 'none',
                    }}
                  >
                    <div
                      className="h-9 w-9 flex items-center justify-center shrink-0"
                      style={{
                        background: selected ? AMBER : 'rgba(255,255,255,0.06)',
                        borderRadius: 10,
                      }}
                    >
                      <Icon size={16} color={selected ? A.CANVAS : INK_45} strokeWidth={2.25} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[14.5px]" style={{ color: INK }}>{r.label}</p>
                        {selected && (
                          <span
                            className="inline-flex items-center justify-center h-4 w-4 rounded-full"
                            style={{ background: AMBER }}
                          >
                            <Check size={10} color={A.CANVAS} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] leading-snug mt-0.5" style={{ color: INK_45 }}>
                        {r.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11.5px] mt-2" style={{ color: INK_45 }}>
              Owners have full control and can't be assigned here.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Sticky footer */}
      <div className="fixed left-0 right-0 pointer-events-none" style={{ bottom: 0, zIndex: 40 }}>
        <div
          className="pointer-events-auto md:max-w-[440px] md:mx-auto px-4"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
            paddingTop: 12,
            background: `linear-gradient(to top, ${PAGE_BG} 60%, rgba(21,23,31,0))`,
          }}
        >
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || pending}
            className={`w-full flex items-center justify-center gap-2 active:opacity-90 ${pending ? '' : 'disabled:opacity-50'}`}
            style={{
              minHeight: 52,
              borderRadius: 14,
              background: INK,
              color: A.CANVAS,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              border: 'none',
            }}
          >
            <UserPlus size={18} strokeWidth={2.25} />
            {pending ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </div>
    </ManagePageShell>
  );
}
