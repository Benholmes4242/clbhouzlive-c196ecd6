/**
 * BRIEF_ADMIN_SETTINGS — the admin Settings page at /admin-v2/settings,
 * replacing the old Health-tab SettingsTab. Exact match of the three signed-off
 * mocks (page / confirm sheet / maintenance on).
 *
 * S.2 Identity and S.10 This device render for every role. S.4 Platform,
 * S.7 Get the app, S.8 Staff accounts and S.9 Admin access render only for
 * panelCan(role).manageAdmins; their data arrives via useAdminSettings, which
 * is itself enabled only for full admins.
 *
 * Token law: every colour is an adminTheme key. The mocks' four unowned values
 * map to the nearest key per the brief: initials tiles -> t.neutralSoft, red
 * borders -> t.dangerSoft, dark text on red buttons -> t.canvas. The sheet
 * scrim stays rgba(0,0,0,0.62).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Copy, LogOut, Plus } from 'lucide-react';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { usePanelRole } from '@/hooks/usePanelRole';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { panelCan } from '@/lib/panelCan';
import { adminTheme as t } from '../theme';
import { useAdminSettings } from '../hooks/useAdminSettings';
import { useMembersOverview } from '../hooks/useMembersRadar';
import { formatAgo } from '../lib/formatAgo';
import { londonHM } from '../components/analytics/analyticsFormat';
import { useAdminPillVisibility } from '@/hooks/useAdminPillVisibility';
import { isPerfEnabled, setPerfLive, subscribePerfLive } from '@/perf/navTiming';
import { audioDebugEnabled, setAudioDebugEnabled, subscribeAudioDebugEnabled } from '@/perf/audioDebug';
import { removePersistedQueryCache } from '@/lib/queryPersister';
import { isMedianApp } from '@/utils/median/isMedianApp';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ─── shared pieces ─── */

function Switch({ checked, onChange, label, danger, small }: {
  checked: boolean; onChange: () => void; label: string; danger?: boolean; small?: boolean;
}) {
  const w = small ? 44 : 50;
  const h = small ? 26 : 30;
  const knob = small ? 20 : 24;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      style={{
        flexShrink: 0, width: w, height: h, borderRadius: 999, border: 'none', padding: 0,
        position: 'relative', cursor: 'pointer', transition: 'background .15s',
        background: checked ? (danger ? t.danger : t.ink) : t.line,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? w - knob - 3 : 3, width: knob, height: knob,
        borderRadius: '50%', background: checked ? t.surface : t.ink, transition: 'left .15s',
      }} />
    </button>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section style={{ margin: '28px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.inkFaint }}>{title}</h2>
        <span style={{ fontSize: 11, color: t.inkFaint }}>{note}</span>
      </div>
      {children}
    </section>
  );
}

function Card({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{
      marginTop: 10, borderRadius: 12, background: t.surface,
      border: `1px solid ${danger ? t.dangerSoft : t.hairline}`,
    }}>
      {children}
    </div>
  );
}

function Row({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div style={{
      padding: '14px 14px 14px 16px', display: 'grid', alignItems: 'center', columnGap: 12,
      borderTop: first ? undefined : `1px solid ${t.hairline}`,
    }}>
      {children}
    </div>
  );
}

/** The brief's bottom-sheet primitive: scrim 0.62, 22px top corners, grabber. */
function Sheet({ open, onClose, label, children }: {
  open: boolean; onClose: () => void; label: string; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, padding: '10px 20px 34px', borderRadius: '22px 22px 0 0',
          background: t.surface, borderTop: `1px solid ${t.line}`, maxHeight: '88dvh', overflowY: 'auto',
        }}
      >
        <div style={{ width: 40, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)', margin: '0 auto' }} />
        {children}
      </section>
    </div>
  );
}

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function RolePill({ role }: { role: 'full' | 'limited' | 'moderator' }) {
  const map = {
    full: { label: 'Full admin', background: t.okSoft, color: t.okText },
    limited: { label: 'Limited admin', background: t.warnSoft, color: t.warnText },
    moderator: { label: 'Moderator', background: t.neutralSoft, color: t.inkMuted },
  } as const;
  const s = map[role];
  return (
    <span style={{
      height: 26, padding: '0 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      background: s.background, color: s.color, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

function shellLabel(): string {
  if (!isMedianApp()) return 'Browser';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'Android app';
  return 'iOS app';
}

/* ─── S.2 Identity (every role) ─── */

function IdentitySection({ role }: { role: 'full' | 'limited' | 'moderator' }) {
  const { user } = useSupabaseSession();
  const me = useQuery({
    queryKey: ['admin-v2', 'me'],
    staleTime: 600_000,
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('user_profiles').select('display_name, username').eq('id', user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const email = user?.email ?? '';
  const name = me.data?.display_name || email.split('@')[0] || 'Admin';
  const initials = initialsOf(me.data?.display_name || email || 'A');

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out');
      window.location.assign('/');
    } catch (e) {
      toast.error('Sign out failed', { description: (e as { message?: string })?.message });
    }
  };

  return (
    <section style={{ padding: '20px 16px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '52px minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center' }}>
        <span style={{ width: 52, height: 52, borderRadius: 14, background: t.neutralSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: t.brand }}>{initials}</span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>{name}</span>
          <span style={{ display: 'block', marginTop: 2, fontSize: 13, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
        </span>
        <RolePill role={role} />
      </div>
      <div style={{
        marginTop: 14, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 8,
        height: 44, padding: '0 6px 0 12px', borderRadius: 12, background: t.surface, border: `1px solid ${t.hairline}`,
      }}>
        <span style={{ minWidth: 0, fontFamily: MONO, fontSize: 12, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.id ?? ''}</span>
        <button
          type="button"
          onClick={() => { navigator.clipboard?.writeText(user?.id ?? '').then(() => toast.success('Copied')); }}
          style={{
            height: 32, padding: '0 10px', borderRadius: 8, border: 'none', background: t.neutralSoft, color: t.ink,
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Copy size={13} aria-hidden />Copy ID
        </button>
      </div>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <Link to="/clubhouse" style={{
          height: 44, borderRadius: 12, border: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, fontSize: 14, fontWeight: 600, color: t.ink, textDecoration: 'none',
        }}>
          <ArrowLeft size={14} aria-hidden />Back to app
        </Link>
        <button type="button" onClick={signOut} style={{
          height: 44, borderRadius: 12, border: `1px solid ${t.dangerSoft}`, background: 'transparent', color: t.dangerText,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <LogOut size={14} aria-hidden />Sign out
        </button>
      </div>
    </section>
  );
}

/* ─── S.4 Platform + S.5 confirm sheet ─── */

function PlatformSection({ settings, setConfig, viewerId }: {
  settings: ReturnType<typeof useAdminSettings>;
  setConfig: (key: string, value: string) => Promise<boolean>;
  viewerId: string | undefined;
}) {
  const maintenance = settings.data?.maintenance;
  const on = maintenance?.on ?? false;
  const savedMessage = maintenance?.message ?? '';
  const [message, setMessage] = useState(savedMessage);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setMessage(savedMessage); }, [savedMessage]);
  const changed = message !== savedMessage;

  const saveMessage = async () => {
    if (changed && message.trim()) await setConfig('maintenance_message', message.trim());
  };
  const turnOff = async () => {
    if (await setConfig('maintenance_mode', 'off')) toast.success('Maintenance off');
  };
  const turnOn = async () => {
    if (changed && message.trim()) {
      if (!(await setConfig('maintenance_message', message.trim()))) return;
    }
    if (await setConfig('maintenance_mode', 'on')) {
      setConfirmOpen(false);
      toast.success('Maintenance on');
    }
  };

  const by = maintenance?.changed_by;
  const status = on
    ? `On since ${londonHM(maintenance?.changed_at ?? null)}${by ? ` · by ${by.user_id === viewerId ? 'you' : by.name}` : ''}`
    : 'Off · members are in';

  return (
    <Section title="Platform" note="Every member, live">
      <Card danger={on}>
        <Row first>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center' }}>
            <span>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>Maintenance mode</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12.5, color: on ? t.dangerText : t.inkMuted }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? t.danger : t.ok, display: 'inline-block' }} />
                {status}
              </span>
            </span>
            <Switch
              checked={on}
              danger
              label="Maintenance mode"
              onChange={() => { if (on) void turnOff(); else setConfirmOpen(true); }}
            />
          </div>
        </Row>
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${t.hairline}` }}>
          <label htmlFor="maintenance-message" style={{ display: 'block', paddingTop: 14, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkFaint }}>
            What members see
          </label>
          <textarea
            id="maintenance-message"
            ref={textareaRef}
            rows={3}
            maxLength={280}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => { if (!on) void saveMessage(); }}
            style={{
              marginTop: 8, width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10,
              border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, fontFamily: 'inherit',
              fontSize: 14, lineHeight: 1.45, resize: 'none',
            }}
          />
          {on ? (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: t.inkFaint }}>Changes reach members within 60 seconds.</span>
              <button
                type="button"
                disabled={!changed}
                onClick={() => void saveMessage()}
                style={{
                  height: 34, padding: '0 12px', borderRadius: 10, border: `1px solid ${t.line}`, background: 'transparent',
                  color: t.ink, fontSize: 13, fontWeight: 600, cursor: changed ? 'pointer' : 'default', fontFamily: 'inherit',
                  opacity: changed ? 1 : 0.5,
                }}
              >
                Save message
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 8, fontSize: 12, color: t.inkFaint }}>Admins skip the wall. Members see it within 60 seconds.</div>
          )}
        </div>
      </Card>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} label="Lock members out?">
        <div style={{ marginTop: 18, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.dangerText }}>Maintenance mode</div>
        <h2 style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Lock members out?</h2>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: t.inkMuted }}>
          Every member sees this screen until you turn it off. You and the other admins stay in.
        </p>
        <div style={{ marginTop: 18, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkFaint }}>What members see</div>
        {/* MaintenanceWall takes no compact/preview prop, so the mock's preview is drawn directly. */}
        <div style={{
          marginTop: 8, height: 220, borderRadius: 16, background: PAGE_CANVAS, border: `1px solid ${t.line}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: '#F8FAFC' }}>clbhouz</div>
          <div style={{ marginTop: 14, fontSize: 15, lineHeight: 1.45, color: 'rgba(248,250,252,0.72)' }}>{message}</div>
        </div>
        <button
          type="button"
          onClick={() => { setConfirmOpen(false); requestAnimationFrame(() => textareaRef.current?.focus()); }}
          style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', height: 36, border: 0, background: 'transparent', fontSize: 13, fontWeight: 600, color: t.brand, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
        >
          Edit the message
        </button>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => void turnOn()}
            style={{ height: 52, borderRadius: 14, border: 0, background: t.danger, color: t.canvas, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Turn maintenance on
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            style={{ height: 48, borderRadius: 14, border: 0, background: 'transparent', color: t.inkMuted, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
        </div>
      </Sheet>
    </Section>
  );
}

/* ─── S.7 Get the app ─── */

function GetTheAppSection({ settings, setConfig }: {
  settings: ReturnType<typeof useAdminSettings>;
  setConfig: (key: string, value: string) => Promise<boolean>;
}) {
  const links = settings.data?.links;
  const [editing, setEditing] = useState<'app' | 'play' | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openEditor = (which: 'app' | 'play') => {
    setEditing(which);
    setValue(which === 'app' ? links?.app_store_url ?? '' : links?.play_store_url ?? '');
    setError(null);
  };
  const remove = async () => {
    await setConfig('play_store_url', '');
    setEditing(null);
  };

  const row = (label: string, sub: React.ReactNode, pill: React.ReactNode, onClick: () => void, first?: boolean) => (
    <Row first={first}>
      <button type="button" onClick={onClick} style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto 14px', alignItems: 'center', columnGap: 12,
        border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', color: t.ink, fontFamily: 'inherit',
      }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{label}</span>
          <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>
        </span>
        {pill}
        <ChevronRight size={14} color={t.inkFaint} aria-hidden />
      </button>
    </Row>
  );
  const livePill = <span style={{ height: 24, padding: '0 9px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, background: t.okSoft, color: t.okText }}>Live</span>;
  const addPill = <span style={{ height: 24, padding: '0 9px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, background: t.warnSoft, color: t.warnText }}>Add</span>;
  const strip = (url: string) => url.replace(/^https:\/\//, '');

  return (
    <Section title="Get the app" note="clbhouz.co.uk/get">
      <Card>
        {row('App Store',
          <span style={{ color: t.inkMuted }}>{links?.app_store_url ? strip(links.app_store_url) : ''}</span>,
          livePill, () => openEditor('app'), true)}
        {row('Google Play',
          links?.play_store_url
            ? <span style={{ color: t.inkMuted }}>{strip(links.play_store_url)}</span>
            : <span style={{ color: t.warnText }}>Not set: the download page uses the default Play link</span>,
          links?.play_store_url ? livePill : addPill, () => openEditor('play'))}
        {row('Everything else', <span style={{ color: t.inkMuted }}>clbhouz.co.uk</span>, livePill,
          () => window.open('https://clbhouz.co.uk', '_blank', 'noopener'))}
      </Card>
      <div style={{ marginTop: 8, fontSize: 12, color: t.inkFaint }}>The QR code and every invite link send phones to the right store from here.</div>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} label={editing === 'app' ? 'App Store' : 'Google Play'}>
        <h2 style={{ margin: '18px 0 0', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{editing === 'app' ? 'App Store' : 'Google Play'}</h2>
        <input
          type="url"
          inputMode="url"
          placeholder="https://"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          aria-label="Store link"
          style={{
            marginTop: 14, width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10,
            border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, fontFamily: 'inherit', fontSize: 14,
          }}
        />
        {error ? <div style={{ marginTop: 8, fontSize: 12.5, color: t.dangerText }}>{error}</div> : null}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              const key = editing === 'app' ? 'app_download_url' : 'play_store_url';
              void setConfig(key, value.trim()).then((ok) => {
                if (ok) setEditing(null);
                else setError('The link was refused. It must be an https:// store link.');
              });
            }}
            style={{ height: 48, borderRadius: 12, border: 0, background: t.ink, color: t.surface, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Save
          </button>
          {editing === 'play' && links?.play_store_url ? (
            <button
              type="button"
              onClick={() => void remove()}
              style={{ height: 44, borderRadius: 12, border: `1px solid ${t.dangerSoft}`, background: 'transparent', color: t.dangerText, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Remove
            </button>
          ) : null}
        </div>
      </Sheet>
    </Section>
  );
}

/* ─── S.8 Staff accounts ─── */

function StaffSection({ settings, setStaff }: {
  settings: ReturnType<typeof useAdminSettings>;
  setStaff: (userId: string, staff: boolean) => Promise<boolean>;
}) {
  const staff = settings.data?.staff ?? [];
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [flipping, setFlipping] = useState<Record<string, boolean>>({});
  const members = useMembersOverview();

  const unflag = async (userId: string) => {
    // Optimistic: the switch flips now; the row drops out on refetch.
    setFlipping((f) => ({ ...f, [userId]: true }));
    const ok = await setStaff(userId, false);
    if (!ok) setFlipping((f) => ({ ...f, [userId]: false }));
  };

  const flagged = new Set(staff.map((s) => s.user_id));
  const needle = search.trim().toLowerCase();
  const candidates = (members.data?.members ?? [])
    .filter((m) => !flagged.has(m.user_id))
    .filter((m) => !needle || [m.display_name, m.username, m.email].some((v) => v?.toLowerCase().includes(needle)))
    .slice(0, 8);

  return (
    <Section title="Staff accounts" note="Left out of activity figures">
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em' }}>{staff.length}</span>
        <span style={{ fontSize: 13, color: t.inkMuted }}>{staff.length === 1 ? 'account' : 'accounts'} flagged as staff</span>
      </div>
      <Card>
        {staff.map((s, i) => (
          <Row key={s.user_id} first={i === 0}>
            <div style={{ display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center' }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: t.neutralSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: t.inkMuted }}>
                {initialsOf(s.name || s.email)}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: t.inkFaint }}>{s.is_you ? 'You' : s.name}</span>
              </span>
              <Switch small checked={!flipping[s.user_id]} label={`Staff account ${s.email}`} onChange={() => void unflag(s.user_id)} />
            </div>
          </Row>
        ))}
        <button
          type="button"
          onClick={() => { setAddOpen(true); setSearch(''); }}
          style={{
            height: 48, width: '100%', padding: '0 16px', borderTop: `1px solid ${t.hairline}`, border: 'none', borderTopWidth: 1,
            borderTopStyle: 'solid', borderTopColor: t.hairline, background: 'transparent', display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 600, color: t.brand, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={14} aria-hidden />Flag another account
        </button>
      </Card>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} label="Flag another account">
        <h2 style={{ margin: '18px 0 0', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Flag another account</h2>
        <input
          type="search"
          aria-label="Find a member"
          placeholder="Name, username or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            marginTop: 14, width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10,
            border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, fontFamily: 'inherit', fontSize: 14,
          }}
        />
        <div style={{ marginTop: 10 }}>
          {candidates.map((m) => (
            <button
              key={m.user_id}
              type="button"
              onClick={() => { void setStaff(m.user_id, true); setAddOpen(false); }}
              style={{
                width: '100%', padding: '12px 0', border: 0, borderTop: `1px solid ${t.hairline}`, background: 'transparent',
                display: 'block', textAlign: 'left', cursor: 'pointer', color: t.ink, fontFamily: 'inherit',
              }}
            >
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{m.display_name || m.username || 'Member'}</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: t.inkFaint }}>{m.email ?? (m.username ? `@${m.username}` : '')}</span>
            </button>
          ))}
          {needle && candidates.length === 0 ? (
            <div style={{ padding: '12px 0', fontSize: 13, color: t.inkFaint }}>No member matches "{search.trim()}"</div>
          ) : null}
        </div>
      </Sheet>
    </Section>
  );
}

/* ─── S.9 Admin access (full only) ─── */

function AdminAccessSection({ viewerId }: { viewerId: string | undefined }) {
  const overview = useMembersOverview();
  const team = overview.data?.team ?? [];
  const members = overview.data?.members ?? [];
  const lastSeen = (userId: string) => members.find((m) => m.user_id === userId)?.last_seen_at ?? null;
  const pillFor = (role: string) => {
    const key = role === 'full' ? 'full' : role === 'limited' ? 'limited' : 'moderator';
    const labels = { full: 'Full', limited: 'Limited', moderator: 'Moderator' } as const;
    const styles = {
      full: { background: t.okSoft, color: t.okText },
      limited: { background: t.warnSoft, color: t.warnText },
      moderator: { background: t.neutralSoft, color: t.inkMuted },
    } as const;
    return (
      <span style={{
        height: 26, padding: '0 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', ...styles[key],
      }}>
        {labels[key]}
      </span>
    );
  };
  return (
    <Section title="Admin access" note="Who can open this console">
      <Card>
        {team.map((m, i) => (
          <Row key={m.user_id} first={i === 0}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center' }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{m.display_name || 'Member'}</span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: t.inkFaint }}>
                  {m.user_id === viewerId
                    ? 'You · active now'
                    : lastSeen(m.user_id)
                      ? `Last in ${formatAgo(lastSeen(m.user_id), { suffix: true })}`
                      : 'Not seen yet'}
                </span>
              </span>
              {pillFor(m.role)}
            </div>
          </Row>
        ))}
      </Card>
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, fontSize: 11.5, color: t.inkFaint, lineHeight: 1.4 }}>
        <span><span style={{ color: t.ink, fontWeight: 600 }}>Full</span><br />everything</span>
        <span><span style={{ color: t.ink, fontWeight: 600 }}>Limited</span><br />no platform or roles</span>
        <span><span style={{ color: t.ink, fontWeight: 600 }}>Moderator</span><br />reports and inbox</span>
      </div>
    </Section>
  );
}

/* ─── S.10 This device (every role) ─── */

function ThisDeviceSection({ role, userId }: { role: string; userId: string | undefined }) {
  const location = useLocation();
  const qc = useQueryClient();
  const [pillsVisible, setPillsVisible] = useAdminPillVisibility();
  const [perfEnabled, setPerfEnabled] = useState(() => isPerfEnabled());
  const [audioEnabled, setAudioEnabled] = useState(() => audioDebugEnabled());
  const [diagSheet, setDiagSheet] = useState<string | null>(null);

  useEffect(() => subscribePerfLive(() => setPerfEnabled(isPerfEnabled())), []);
  useEffect(() => subscribeAudioDebugEnabled(() => setAudioEnabled(audioDebugEnabled())), []);

  const buildStamp = typeof __BUILD_STAMP__ === 'string' ? __BUILD_STAMP__ : null;
  const diagnostics = () => [
    'clbhouz diagnostics',
    `build: ${typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'unknown'}`,
    `built: ${buildStamp ?? 'unknown'}`,
    `shell: ${shellLabel()}`,
    `user: ${userId ?? ''}`,
    `role: ${role}`,
    `route: ${location.pathname}`,
    `time: ${new Date().toISOString()}`,
    `ua: ${navigator.userAgent}`,
  ].join('\n');

  const copyDiagnostics = async () => {
    const text = diagnostics();
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Diagnostics copied');
    } catch {
      // Clipboard refused: show the text in a sheet with a select-all textarea.
      setDiagSheet(text);
    }
  };

  const clearCached = async () => {
    await removePersistedQueryCache();
    qc.clear();
    window.location.reload();
  };

  const deviceRow = (label: string, sub: string, checked: boolean, onChange: () => void, first?: boolean) => (
    <Row first={first}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12, alignItems: 'center' }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{label}</span>
          <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, lineHeight: 1.4, color: t.inkMuted }}>{sub}</span>
        </span>
        <Switch checked={checked} label={label} onChange={onChange} />
      </div>
    </Row>
  );

  return (
    <Section title="This device" note="Only affects this phone">
      <Card>
        {deviceRow('Video debug pills', 'The floating DBG and BOOT buttons.', pillsVisible, () => setPillsVisible(!pillsVisible), true)}
        {deviceRow('Performance logging', 'Timing and trace lines in the console.', perfEnabled, () => setPerfLive(!perfEnabled))}
        {deviceRow('Audio debug', 'The AUDIO pill, heartbeats and mute tracing.', audioEnabled, () => setAudioDebugEnabled(!audioEnabled))}
      </Card>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <button type="button" onClick={() => void copyDiagnostics()} style={{
          height: 44, borderRadius: 12, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink,
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Copy diagnostics
        </button>
        <button type="button" onClick={() => void clearCached()} style={{
          height: 44, borderRadius: 12, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink,
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Clear cached data
        </button>
      </div>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', paddingTop: 12, borderTop: `1px solid ${t.hairline}` }}>
        {[
          { label: 'Build', value: <span style={{ fontFamily: MONO }}>{typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev'}</span> },
          { label: 'Shell', value: shellLabel() },
          { label: 'Deployed', value: formatAgo(buildStamp, { suffix: true }) },
        ].map((f) => (
          <div key={f.label}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkFaint }}>{f.label}</div>
            <div style={{ marginTop: 4, fontSize: 12.5 }}>{f.value}</div>
          </div>
        ))}
      </div>

      <Sheet open={diagSheet !== null} onClose={() => setDiagSheet(null)} label="Diagnostics">
        <h2 style={{ margin: '18px 0 0', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Diagnostics</h2>
        <textarea
          readOnly
          rows={9}
          value={diagSheet ?? ''}
          onFocus={(e) => e.target.select()}
          aria-label="Diagnostics text"
          style={{
            marginTop: 14, width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10,
            border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, fontFamily: MONO,
            fontSize: 12, lineHeight: 1.5, resize: 'none',
          }}
        />
      </Sheet>
    </Section>
  );
}

/* ─── the page ─── */

export default function SettingsPage() {
  const { role } = usePanelRole();
  const { user } = useSupabaseSession();
  const can = panelCan(role);
  const settings = useAdminSettings(role);
  const safeRole = role === 'full' || role === 'limited' ? role : 'moderator';

  return (
    <div style={{ paddingBottom: 40, fontVariantNumeric: 'tabular-nums' }}>
      <IdentitySection role={safeRole} />
      {can.manageAdmins ? (
        <>
          <PlatformSection settings={settings} setConfig={settings.setConfig} viewerId={user?.id} />
          <GetTheAppSection settings={settings} setConfig={settings.setConfig} />
          <StaffSection settings={settings} setStaff={settings.setStaff} />
          <AdminAccessSection viewerId={user?.id} />
        </>
      ) : null}
      <ThisDeviceSection role={role} userId={user?.id} />
    </div>
  );
}
