import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, ShieldCheck, Mail, KeyRound, Trash2, Ban, X,
  UserPlus, MoreVertical, Search, ShieldAlert, MapPin, Radio, BadgeCheck,
  AtSign,
} from 'lucide-react';
import { LABEL } from '@/lib/tokens/type';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useUserActions } from '@/hooks/admin/useUserDetails';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';
import { formatAgo } from '../lib/formatAgo';
import SectionTabs from '../components/SectionTabs';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import DetailDrawer from '../components/DetailDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import AdminErrorState from '../components/AdminErrorState';
import AdminSheet from '../components/AdminSheet';
import { useAdminUserDetail, type AdminUserDetail } from '../hooks/useUsers';
import { useMembersOverview, type MembersOverview } from '../hooks/useMembersRadar';
import MembersList from '../components/MembersList';
import { Skeleton } from '../lib/chartPrimitives';
import { londonDate } from '../lib/memberRadarDisplay';
import { useTeam, type TeamMember } from '../hooks/useTeam';
import { useInvites } from '../hooks/useInvites';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { useCreateAdminActionRequest } from '../hooks/useAdminActionRequests';
import MemberRadar from '../components/MemberRadar';

const LABEL_T = { ...LABEL, fontFeatureSettings: '"kern" 1, "liga" 1' } as const;
const FIG_T = { fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums' } as const;
/** 2.2 — last-seen is sentence case; LABEL's uppercase must never reach it. */
const AGE_T = { ...FIG_T, fontSize: 11, fontWeight: 600, letterSpacing: 0, textTransform: 'none' } as const;
const ago = (iso: string | null | undefined) => formatAgo(iso, { suffix: true, empty: '-' });

function ageTone(iso: string | null | undefined): string {
  if (!iso) return t.inkFaint;
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (h < 24) return t.ok;
  if (h < 24 * 14) return t.inkMuted;
  return t.inkFaint;
}

/** Admin membership role -> label. 2.4: a moderator reads "Moderator", never "Limited". */
function adminRoleLabel(role: string | null | undefined): string | null {
  if (role === 'full') return 'Full';
  if (role === 'limited') return 'Limited';
  if (role === 'moderator') return 'Moderator';
  return null;
}

/**
 * Members list (BRIEF_MEMBERS_LIST_REBUILD, Main.html). Route stays
 * /admin-v2/users; ?member= opens the Member screen; ?filter= holds the chip.
 * All list data is get_admin_members_overview. Team and invites sit in one
 * panel below, full admins only.
 */
export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const { role } = usePanelRole();
  const isFullAdmin = panelCan(role).manageAdmins;
  const overview = useMembersOverview();
  const drawerUserId = params.get('member');
  const { userDetail, detailLoading, detailError, refetchDetail, updateRole, roleUpdating } =
    useAdminUserDetail(drawerUserId);

  const openMember = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('member', id);
    setParams(next, { replace: true });
  };
  const closeMember = () => {
    const next = new URLSearchParams(params);
    next.delete('member');
    setParams(next, { replace: true });
  };

  return (
    <div
      style={{
        padding: '8px 12px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 1180,
        margin: '0 auto',
        color: t.ink,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {overview.error ? (
        <AdminErrorState onRetry={() => overview.refetch()} />
      ) : (
        <MembersList overview={overview.data} loading={overview.isPending} onOpenMember={openMember} />
      )}
      {isFullAdmin && <TeamPanel overview={overview.data} loading={overview.isPending} />}
      <Member360Sheet
        userId={drawerUserId}
        detail={userDetail ?? null}
        loading={detailLoading}
        error={detailError}
        onRetry={() => refetchDetail()}
        onClose={closeMember}
        onUpdateRole={updateRole}
        roleUpdating={roleUpdating}
      />
    </div>
  );
}

function SkeletonCards({ n = 6 }: { n?: number }) {
  return (
    <div>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{
          height: 64,
          borderTop: i > 0 ? `1px solid ${t.line}` : 'none',
          background: t.canvas,
          animation: 'admin-pulse 1.4s ease-in-out infinite',
        }} />
      ))}
      <style>{`@keyframes admin-pulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
    </div>
  );
}

/* ─────────────────────── Member 360 sheet ─────────────────────── */

const ROLE_OPTIONS = [
  { value: null,            label: 'No role' },
  { value: 'admin',         label: 'Admin' },
  { value: 'moderator',     label: 'Moderator' },
  { value: 'limited_admin', label: 'Limited Admin' },
];

function Member360Sheet({
  userId, detail, loading, error, onRetry, onClose, onUpdateRole, roleUpdating,
}: {
  userId: string | null;
  detail: AdminUserDetail | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onClose: () => void;
  onUpdateRole: (userId: string, role: string | null) => void;
  roleUpdating: boolean;
}) {
  const navigate = useNavigate();
  const actions = useUserActions();
  const { role: panelRole } = usePanelRole();
  const isFullAdmin = panelCan(panelRole).manageAdmins;
  const isLimited = panelRole === 'limited';
  const createRequest = useCreateAdminActionRequest();

  const [confirm, setConfirm] = useState<null | 'suspend' | 'delete' | 'reset' | 'verify' | 'unverify'>(null);
  const [busy, setBusy] = useState(false);
  const [requestMode, setRequestMode] = useState<null | 'delete' | 'ban' | 'role'>(null);
  const [reqReason, setReqReason] = useState('');
  const [reqRoleAction, setReqRoleAction] =
    useState<'grant_limited' | 'grant_full' | 'downgrade' | 'revoke'>('grant_limited');
  const [renameOpen, setRenameOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const close = () => { setMoreOpen(false); setConfirm(null); setRequestMode(null); setReqReason(''); onClose(); };
  const name = detail?.display_name ?? detail?.username ?? 'member';

  const qc = useQueryClient();
  const runConfirmed = async () => {
    if (!detail || !confirm) return;
    setBusy(true);
    try {
      let res: { success: boolean; error?: any } | undefined;
      if (confirm === 'suspend') res = detail.is_suspended
        ? await actions.unsuspendUser(detail.id)
        : await actions.suspendUser(detail.id);
      if (confirm === 'delete')  res = await actions.deleteUser(detail.id);
      if (confirm === 'reset')   res = await actions.resetPassword(detail.id, detail.email ?? `${detail.username ?? detail.id}@user`);
      if (confirm === 'verify')  res = await actions.verifyGolfer(detail.id);
      if (confirm === 'unverify') res = await actions.unverifyGolfer(detail.id);
      if (res && !res.success) {
        const errAny: any = (res as any).error;
        const msg = errAny instanceof Error ? errAny.message : (typeof errAny === 'string' ? errAny : 'Action failed');
        if (msg === 'already_verified') toast.error('This member is already verified');
        else if (msg === 'already_unverified') toast.error('This member is not verified');
        else toast.error(msg);
      } else if (res?.success) {
        qc.invalidateQueries({ queryKey: ['admin', 'members'] });
        toast.success(
          confirm === 'delete' ? 'User deleted' :
          confirm === 'suspend' ? (detail.is_suspended ? 'Suspension lifted' : 'User suspended') :
          confirm === 'verify' ? 'Golfer verified' :
          confirm === 'unverify' ? 'Verification removed' :
          'Password reset email sent'
        );
        if (confirm === 'verify' || confirm === 'unverify') {
          qc.invalidateQueries({ queryKey: ['admin-v2', 'users'] });
          qc.invalidateQueries({ queryKey: ['admin-v2', 'users', 'detail', detail.id] });
          qc.invalidateQueries({ queryKey: ['admin-user-details', detail.id] });
          qc.invalidateQueries({ queryKey: ['user-profile', detail.id] });
        }
      }
    } finally {
      setBusy(false);
      setConfirm(null);
      if (confirm === 'delete') close();
    }
  };

  const submitRequest = () => {
    if (!detail || !requestMode) return;
    if (requestMode === 'delete') {
      createRequest.mutate(
        {
          action_type: 'delete_user',
          target_user_id: detail.id,
          target_email: detail.email ?? null,
          payload: { reason: reqReason.trim() || 'Deletion requested' },
        },
        { onSuccess: () => close() },
      );
    } else if (requestMode === 'ban') {
      createRequest.mutate(
        {
          action_type: 'permanent_ban',
          target_user_id: detail.id,
          payload: { reason: reqReason.trim() || 'Permanent ban requested' },
        },
        { onSuccess: () => close() },
      );
    } else if (requestMode === 'role') {
      createRequest.mutate(
        {
          action_type: 'role_change',
          target_user_id: detail.id,
          payload: { roleAction: reqRoleAction, reason: reqReason.trim() || undefined },
        },
        { onSuccess: () => close() },
      );
    }
  };

  return (
    <DetailDrawer
      open={!!userId}
      onClose={close}
      title={detail?.display_name ?? (loading ? 'Loading...' : 'Member')}
      subtitle={detail?.username ? `@${detail.username}` : undefined}
      artboard
    >
      {userId && <MemberRadar userId={userId} full={isFullAdmin} onClose={close} onMore={() => setMoreOpen(true)} />}
      <AdminSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More actions">
        {detail ? <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isFullAdmin && (
              <>
                <DrawerBtn icon={<KeyRound size={14} />} onClick={() => { setMoreOpen(false); setConfirm('reset'); }}>Send password reset</DrawerBtn>
                <DrawerBtn icon={<AtSign size={14} />} onClick={() => { setMoreOpen(false); setRenameOpen(true); }}>Change username</DrawerBtn>
                {detail.is_verified ? (
                  <DrawerBtn icon={<BadgeCheck size={14} />} tone="danger" onClick={() => { setMoreOpen(false); setConfirm('unverify'); }}>
                    Remove verification
                  </DrawerBtn>
                ) : (
                  <DrawerBtn icon={<BadgeCheck size={14} />} onClick={() => { setMoreOpen(false); setConfirm('verify'); }}>
                    Verify golfer
                  </DrawerBtn>
                )}
                <DrawerBtn
                  icon={<Ban size={14} />}
                  tone={detail.is_suspended ? undefined : 'warn'}
                  onClick={() => { setMoreOpen(false); setConfirm('suspend'); }}
                >
                  {detail.is_suspended ? 'Lift suspension' : 'Suspend member'}
                </DrawerBtn>
                <DrawerBtn icon={<Trash2 size={14} />} tone="danger" onClick={() => { setMoreOpen(false); setConfirm('delete'); }}>Delete member</DrawerBtn>
              </>
            )}
            {isLimited && (
              <>
                <DrawerBtn icon={<ShieldAlert size={14} />} tone="warn" onClick={() => { setMoreOpen(false); setRequestMode('ban'); setReqReason(''); }}>Request permanent ban</DrawerBtn>
                <DrawerBtn icon={<Trash2 size={14} />} tone="danger" onClick={() => { setMoreOpen(false); setRequestMode('delete'); setReqReason(''); }}>Request delete</DrawerBtn>
                <DrawerBtn icon={<ShieldCheck size={14} />} onClick={() => { setMoreOpen(false); setRequestMode('role'); setReqReason(''); }}>Request role change</DrawerBtn>
              </>
            )}
          </div>
          {/* Role (full-admin direct edit) */}
          {isFullAdmin && (
            <Section title="App role">
              <div style={{
                background: t.canvas, border: `1px solid ${t.line}`,
                borderRadius: t.radius.md, padding: 12,
              }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ROLE_OPTIONS.map(opt => {
                    const active = (detail.role ?? null) === opt.value;
                    return (
                      <button
                        key={opt.value ?? 'none'}
                        disabled={roleUpdating}
                        onClick={() => onUpdateRole(detail.id, opt.value)}
                        style={{
                          padding: '6px 12px', borderRadius: 999,
                          border: `1px solid ${active ? 'transparent' : t.line}`,
                          background: active ? t.brandSoft : t.surface,
                          color: active ? t.brandText : t.inkMuted,
                          fontSize: 12, fontWeight: 600,
                          cursor: roleUpdating ? 'progress' : 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>
          )}

        </> : <SkeletonCards n={1} />}
      </AdminSheet>

      <ConfirmDialog
        open={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title="Send password reset email?"
        description={`A reset link will be emailed to ${name}.`}
        confirmLabel="Send reset"
        busy={busy}
      />
      <ConfirmDialog
        open={confirm === 'suspend'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title={detail?.is_suspended ? `Lift suspension on ${name}?` : `Suspend ${name}?`}
        description={
          detail?.is_suspended
            ? 'They will regain access immediately.'
            : 'They will be signed out and unable to post or comment until reinstated.'
        }
        requireText={detail?.is_suspended ? undefined : (detail?.username || detail?.display_name || 'SUSPEND')}
        confirmLabel={detail?.is_suspended ? 'Lift suspension' : 'Suspend member'}
        tone={detail?.is_suspended ? undefined : 'danger'}
        busy={busy}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title={`Delete ${name}?`}
        description="This permanently deletes the member and their data. This cannot be undone."
        requireText={detail?.username || detail?.display_name || 'DELETE'}
        confirmLabel="Delete member"
        tone="danger"
        busy={busy}
      />
      <ConfirmDialog
        open={confirm === 'verify'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title={`Verify ${name}?`}
        description="They'll be notified."
        confirmLabel="Verify golfer"
        busy={busy}
      />
      <ConfirmDialog
        open={confirm === 'unverify'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title={`Remove verification from ${name}?`}
        description="They will not be notified."
        confirmLabel="Remove verification"
        tone="danger"
        busy={busy}
      />
      {requestMode !== null && detail && (
        <div
          role="dialog" aria-modal="true"
          onClick={() => !createRequest.isPending && setRequestMode(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.surface, borderRadius: t.radius.lg, boxShadow: t.shadowPop,
              width: '100%', maxWidth: 460, padding: 20,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.ink }}>
                {requestMode === 'delete' ? 'Request member deletion'
                  : requestMode === 'ban' ? 'Request permanent ban'
                  : 'Request role change'}
              </div>
              <div style={{ fontSize: 13, color: t.inkMuted, marginTop: 6, lineHeight: 1.45 }}>
                A Full admin will review and either approve (which executes the action) or reject.
              </div>
            </div>

            {requestMode === 'role' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['grant_limited', 'grant_full', 'downgrade', 'revoke'] as const).map(ra => {
                  const active = reqRoleAction === ra;
                  return (
                    <button
                      key={ra}
                      onClick={() => setReqRoleAction(ra)}
                      style={{
                        padding: '6px 12px', borderRadius: 999,
                        border: `1px solid ${active ? 'transparent' : t.line}`,
                        background: active ? t.brandSoft : t.surface,
                        color: active ? t.brandText : t.inkMuted,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {ra.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            )}

            <textarea
              autoFocus
              placeholder="Reason (required)"
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: 10, borderRadius: t.radius.md,
                border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
                fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRequestMode(null)}
                disabled={createRequest.isPending}
                style={{
                  padding: '8px 14px', borderRadius: t.radius.md,
                  border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={submitRequest}
                disabled={createRequest.isPending || !reqReason.trim()}
                style={{
                  padding: '8px 14px', borderRadius: t.radius.md,
                  border: 'none', background: t.ink, color: t.surface,
                  fontSize: 13, fontWeight: 700,
                  cursor: (createRequest.isPending || !reqReason.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (createRequest.isPending || !reqReason.trim()) ? 0.55 : 1,
                }}
              >
                {createRequest.isPending ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </div>
        </div>
      )}
      {detail && (
        <ChangeUsernameSheet
          open={renameOpen}
          onClose={() => setRenameOpen(false)}
          userId={detail.id}
          currentUsername={detail.username ?? null}
        />
      )}
    </DetailDrawer>
  );
}

/* ─── Change username sheet (Full admins only) ─── */

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

function ChangeUsernameSheet({
  open, onClose, userId, currentUsername,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentUsername: string | null;
}) {
  const qc = useQueryClient();
  const actions = useUserActions();
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [saving, setSaving] = useState(false);
  const checkRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setValue('');
      setStatus('idle');
    }
    return () => { if (checkRef.current) clearTimeout(checkRef.current); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (checkRef.current) clearTimeout(checkRef.current);
    const candidate = value.trim().toLowerCase();
    if (!candidate) { setStatus('idle'); return; }
    if (!USERNAME_RE.test(candidate)) { setStatus('invalid'); return; }
    if (candidate === (currentUsername ?? '')) { setStatus('idle'); return; }
    setStatus('checking');
    checkRef.current = setTimeout(async () => {
      try {
        const escaped = candidate.replace(/[\\%_]/g, '\\$&');
        const { count, error } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .ilike('username', escaped)
          .neq('id', userId);
        if (error) { setStatus('error'); return; }
        setStatus((count ?? 0) > 0 ? 'taken' : 'available');
      } catch {
        setStatus('error');
      }
    }, 400);
  }, [value, open, userId, currentUsername]);

  const canSave = status === 'available' && !saving;

  const onSave = async () => {
    if (!canSave) return;
    const candidate = value.trim().toLowerCase();
    setSaving(true);
    const res = await actions.changeUsername(userId, candidate);
    setSaving(false);
    if (res.success) {
      toast.success('Username changed');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'users', 'detail', userId] });
      qc.invalidateQueries({ queryKey: ['admin-user-details', userId] });
      qc.invalidateQueries({ queryKey: ['user-profile', userId] });
      onClose();
    } else {
      const err = String((res as any).error ?? '');
      if (err === 'username_taken') {
        toast.error('That username was just taken');
        setStatus('taken');
      } else if (err === 'invalid_format') {
        toast.error('Invalid username format');
        setStatus('invalid');
      } else {
        toast.error(err || 'Failed to change username');
      }
    }
  };

  const hint =
    status === 'invalid' ? 'Use 3–20 characters: lowercase letters, digits, underscores, or dots.'
    : status === 'checking' ? 'Checking availability…'
    : status === 'available' ? 'Available'
    : status === 'taken' ? 'Taken'
    : status === 'error' ? 'Check failed — try again'
    : '3–20 chars: a–z, 0–9, underscore, dot.';
  const hintColor =
    status === 'available' ? t.ok
    : (status === 'taken' || status === 'invalid' || status === 'error') ? t.danger
    : t.inkMuted;

  return (
    <AdminSheet
      open={open}
      onClose={onClose}
      title="Change username"
      subtitle={currentUsername ? `Current: @${currentUsername}` : 'No current username'}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 14px', borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={onSave}
            disabled={!canSave}
            style={{
              padding: '8px 14px', borderRadius: t.radius.md,
              border: 'none', background: t.ink, color: t.surface,
              fontSize: 13, fontWeight: 700,
              cursor: canSave ? 'pointer' : 'not-allowed',
              opacity: canSave ? 1 : 0.55,
            }}
          >{saving ? 'Saving…' : 'Save'}</button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: t.inkMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          New username
        </label>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: `1px solid ${t.line}`, borderRadius: t.radius.md,
          background: t.surface, padding: '10px 12px',
        }}>
          <span style={{ color: t.inkMuted, fontSize: 14, fontWeight: 600 }}>@</span>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="new_username"
            maxLength={20}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: t.ink, fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: hintColor }}>{hint}</div>
      </div>
    </AdminSheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 11, color: t.inkFaint, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, divider }: { label: string; value: number; divider?: boolean }) {
  return (
    <div style={{
      padding: 12, textAlign: 'center',
      borderLeft: divider ? `1px solid ${t.line}` : 'none',
    }}>
      <div style={{
        fontSize: 18, fontWeight: 700, color: t.ink,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value.toLocaleString()}
      </div>
      <div style={{
        fontSize: 10, color: t.inkFaint, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4,
      }}>
        {label}
      </div>
    </div>
  );
}

function IdentityRow({
  icon, label, value, muted, divider, pill,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  muted?: boolean;
  divider?: boolean;
  pill?: { tone: 'ok' | 'warn'; label: string } | null;
}) {
  return (
    <div style={{
      padding: '10px 14px',
      borderTop: divider ? `1px solid ${t.line}` : 'none',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10, color: t.inkFaint, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {label}
        </div>
        {value && (
          <div style={{
            fontSize: 13, marginTop: 2,
            color: muted ? t.inkFaint : t.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {value}
          </div>
        )}
      </div>
      {pill && <StatusPill tone={pill.tone}>{pill.label}</StatusPill>}
    </div>
  );
}

function DrawerBtn({
  children, onClick, tone, icon, disabled,
}: { children: React.ReactNode; onClick: () => void; tone?: 'warn' | 'danger'; icon?: React.ReactNode; disabled?: boolean }) {
  const bg = tone === 'danger' ? t.dangerSoft : tone === 'warn' ? t.warnSoft : t.surface;
  const fg = tone === 'danger' ? t.dangerText : tone === 'warn' ? t.warnText : t.ink;
  const border = tone ? 'transparent' : t.line;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', borderRadius: t.radius.md,
        background: bg, color: fg,
        border: `1px solid ${border}`,
        fontSize: 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}{children}
    </button>
  );
}

/* ─────────────────────── Team & Roles (unchanged) ─────────────────────── */

/* ─────────────────────── Team (Main.html) ─────────────────────── */

interface InviteCandidate {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const TEAM_ROW: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '30px minmax(0,1fr) auto',
  columnGap: 10,
  alignItems: 'center',
  padding: '10px 16px',
  borderTop: `1px solid ${t.hairline}`,
};

/** Rows are overview.team then overview.invites, as returned. */
function TeamPanel({ overview, loading }: { overview: MembersOverview | undefined; loading: boolean }) {
  const team = useTeam();
  const invites = useInvites();
  const [showCreate, setShowCreate] = useState(false);
  const [confirm, setConfirm] = useState<{ userId: string; name: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const teamRows = overview?.team ?? [];
  // The overview already excludes invites for anyone with an unexpired admin
  // membership (by account and email), so its invites render as returned.
  const inviteRows = overview?.invites ?? [];
  const candidates: InviteCandidate[] = (overview?.members ?? [])
    .filter(m => !m.admin_role)
    .map(m => ({ id: m.user_id, display_name: m.display_name, username: m.username, avatar_url: m.photo_url }));

  const onConfirmRevoke = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await team.revoke.mutateAsync(confirm.userId);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: t.surface, borderRadius: 16, padding: '14px 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 10px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Team</span>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 12, fontWeight: 700, color: t.brandText, cursor: 'pointer' }}
        >
          Invite
        </button>
      </div>

      {loading
        ? Array.from({ length: 2 }, (_, i) => (
            <div key={i} style={TEAM_ROW}>
              <Skeleton height={30} radius={10} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Skeleton height={16} radius={3} />
                <Skeleton height={13} radius={3} />
              </span>
              <span style={{ width: 44 }}><Skeleton height={22} radius={999} /></span>
            </div>
          ))
        : (
          <>
            {teamRows.map(r => {
              const full = r.role === 'full';
              const name = r.display_name ?? 'Member';
              const since = `since ${londonDate(r.granted_at, { month: 'short', year: 'numeric' })}`;
              const addedBy = r.granted_by_name && r.granted_by_name !== r.display_name ? ` · added by ${r.granted_by_name}` : '';
              const member = team.data.find(m => m.userId === r.user_id);
              return (
                <div key={r.user_id} style={TEAM_ROW}>
                  <SquircleAvatar size={30} src={r.photo_url} alt={name} userId={r.user_id} hairlineRing />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: t.inkFaint }}>{since}{addedBy}</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: full ? t.okSoft : t.neutralSoft,
                        color: full ? t.okText : t.inkMuted,
                      }}
                    >
                      {adminRoleLabel(r.role) ?? r.role}
                    </span>
                    {member && <TeamMenu member={member} hook={team} onRevoke={() => setConfirm({ userId: r.user_id, name })} />}
                  </span>
                </div>
              );
            })}
            {inviteRows.map(i => {
              const name = i.display_name ?? i.email ?? 'Invite';
              const status = i.expired
                ? `Invite expired ${formatAgo(i.expires_at, { suffix: true })}`
                : `Invite sent ${formatAgo(i.created_at, { suffix: true })}`;
              const role = i.role ? ` · ${(adminRoleLabel(i.role) ?? i.role).toLowerCase()}` : '';
              return (
                <div key={i.id} style={TEAM_ROW}>
                  <SquircleAvatar size={30} alt={name} userId={i.id} hairlineRing />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: t.warnText }}>{status}{role}</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      disabled={invites.resend.isPending}
                      onClick={() => invites.resend.mutate(i.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 30,
                        padding: '0 12px',
                        borderRadius: 999,
                        border: `1px solid ${t.line}`,
                        background: 'transparent',
                        color: t.ink,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Re-invite
                    </button>
                    <InviteMenu onCancel={() => setConfirmCancel({ id: i.id, name })} />
                  </span>
                </div>
              );
            })}
          </>
        )}

      <CreateInviteDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        users={candidates}
        usersLoading={loading}
        onCreate={(invitedUserId, role) =>
          invites.create.mutate({ invitedUserId, role }, { onSuccess: () => setShowCreate(false) })
        }
        creating={invites.create.isPending}
      />
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onConfirmRevoke}
        title="Revoke admin access?"
        description={`This will remove admin access for ${confirm?.name ?? 'this user'}.`}
        requireText={confirm?.name || 'REVOKE'}
        confirmLabel="Revoke access"
        tone="danger"
        busy={busy}
      />
      <ConfirmDialog
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={async () => {
          if (!confirmCancel) return;
          setBusy(true);
          try {
            await invites.cancel.mutateAsync(confirmCancel.id);
            setConfirmCancel(null);
          } finally { setBusy(false); }
        }}
        title="Cancel invite?"
        description={`This will cancel the invite for ${confirmCancel?.name ?? 'this user'}.`}
        confirmLabel="Cancel invite"
        tone="danger"
        busy={busy}
      />
    </div>
  );
}

/** Invite rows carry the same more button and menu as team rows. */
function InviteMenu({ onCancel }: { onCancel: () => void }) {
  const [menu, setMenu] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setMenu(v => !v)}
        aria-label="Invite actions"
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          border: `1px solid ${t.line}`,
          background: 'transparent',
          color: t.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <MoreVertical size={14} />
      </button>
      {menu && (
        <>
          <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              zIndex: 50,
              minWidth: 200,
              background: t.surface,
              border: `1px solid ${t.line}`,
              borderRadius: t.radius.md,
              boxShadow: t.shadowPop,
              padding: 4,
            }}
          >
            <MenuItem danger onClick={() => { setMenu(false); onCancel(); }}>Cancel invite</MenuItem>
          </div>
        </>
      )}
    </div>
  );
}

/** The Team tab's existing more menu, unchanged, on each team row. */
function TeamMenu({ member, hook, onRevoke }: { member: TeamMember; hook: ReturnType<typeof useTeam>; onRevoke: () => void }) {
  const [menu, setMenu] = useState(false);
  const extend = async (days: number) => {
    const next = new Date(Date.now() + days * 86400_000).toISOString();
    await hook.setExpiry.mutateAsync({ userId: member.userId, expiresAt: next });
    setMenu(false);
  };
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setMenu(v => !v)}
        aria-label="Member actions"
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          border: `1px solid ${t.line}`,
          background: 'transparent',
          color: t.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <MoreVertical size={14} />
      </button>
      {menu && (
        <>
          <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              zIndex: 50,
              minWidth: 200,
              background: t.surface,
              border: `1px solid ${t.line}`,
              borderRadius: t.radius.md,
              boxShadow: t.shadowPop,
              padding: 4,
            }}
          >
            {member.role === 'full' ? (
              <MenuItem onClick={() => { hook.downgrade.mutate(member.userId); setMenu(false); }}>Downgrade to Limited</MenuItem>
            ) : (
              <MenuItem onClick={() => { hook.grantFull.mutate(member.userId); setMenu(false); }}>Upgrade to Full</MenuItem>
            )}
            <MenuItem onClick={() => extend(7)}>Extend expiry +7d</MenuItem>
            <MenuItem onClick={() => extend(30)}>Extend expiry +30d</MenuItem>
            <MenuItem onClick={() => { hook.setExpiry.mutate({ userId: member.userId, expiresAt: null }); setMenu(false); }}>
              Clear expiry
            </MenuItem>
            <MenuItem danger onClick={() => { setMenu(false); onRevoke(); }}>Revoke access</MenuItem>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '8px 12px', borderRadius: t.radius.sm,
        background: 'transparent', border: 'none',
        color: danger ? t.dangerText : t.ink,
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function CreateInviteDrawer({
  open, onClose, users, usersLoading, onCreate, creating,
}: {
  open: boolean; onClose: () => void;
  users: InviteCandidate[]; usersLoading: boolean;
  onCreate: (invitedUserId: string, role: string) => void;
  creating: boolean;
}) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<InviteCandidate | null>(null);
  const [role, setRole] = useState<'full' | 'limited'>('limited');

  useEffect(() => { if (!open) { setQ(''); setSelected(null); setRole('limited'); } }, [open]);

  const results = useMemo(() => {
    if (selected) return [];
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return users
      .filter(u =>
        u.display_name?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [q, users, selected]);

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Invite admin"
      subtitle="Send an admin invite to an existing user"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <DrawerBtn onClick={onClose}>Cancel</DrawerBtn>
          <DrawerBtn
            icon={<UserPlus size={14} />}
            onClick={() => selected && onCreate(selected.id, role)}
          >
            {creating ? 'Sending...' : 'Send invite'}
          </DrawerBtn>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase' }}>
            Recipient
          </label>
          {selected ? (
            <div style={{
              marginTop: 6, padding: 10,
              border: `1px solid ${t.line}`, borderRadius: t.radius.md,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <SquircleAvatar size={32} src={selected.avatar_url} alt={selected.display_name ?? ''} userId={selected.id} hairlineRing />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{selected.display_name}</div>
                <div style={{ fontSize: 11, color: t.inkMuted }}>@{selected.username}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  border: 'none', background: 'transparent', color: t.inkMuted,
                  cursor: 'pointer', padding: 4,
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <input
                autoFocus
                placeholder={usersLoading ? 'Loading users...' : 'Search by name or @username...'}
                value={q}
                onChange={e => setQ(e.target.value)}
                style={{
                  marginTop: 6, width: '100%', padding: '10px 12px',
                  borderRadius: t.radius.md, border: `1px solid ${t.line}`,
                  background: t.canvas, color: t.ink, fontSize: 14, outline: 'none',
                }}
              />
              {results.length > 0 && (
                <div style={{
                  marginTop: 6, border: `1px solid ${t.line}`, borderRadius: t.radius.md,
                  background: t.surface, overflow: 'hidden',
                }}>
                  {results.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelected(u)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: 10, border: 'none', background: 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <SquircleAvatar size={28} src={u.avatar_url} alt={u.display_name ?? ''} userId={u.id} hairlineRing />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: t.ink }}>{u.display_name}</div>
                        <div style={{ fontSize: 11, color: t.inkMuted }}>@{u.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase' }}>
            Panel role
          </label>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {(['limited', 'full'] as const).map(r => {
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '10px 12px',
                    borderRadius: t.radius.md,
                    border: `1px solid ${active ? 'transparent' : t.line}`,
                    background: active ? t.brandSoft : t.surface,
                    color: active ? t.brandText : t.ink,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {r === 'full' ? 'Full admin' : 'Limited admin'}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
}
