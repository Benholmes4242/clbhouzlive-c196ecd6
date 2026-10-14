/**
 * Admin settings, moved out of the retired SystemPage (BRIEF_HEALTH).
 * Reached from the drawer's Settings row: /admin-v2/health?tab=settings.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePanelRole } from '@/hooks/usePanelRole';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { adminTheme as t } from '../theme';
import StatusPill from '../components/StatusPill';
import { useAdminPillVisibility } from '@/hooks/useAdminPillVisibility';
import { isPerfEnabled, setPerfLive, subscribePerfLive } from '@/perf/navTiming';
import { audioDebugEnabled, setAudioDebugEnabled, subscribeAudioDebugEnabled } from '@/perf/audioDebug';

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg,
        boxShadow: t.shadowCard,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {title && <div style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>{title}</div>}
            {subtitle && <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Tab 1: Audit Log ─────────────────────────────────────────────────────────


const ghostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: t.radius.md,
  border: `1px solid ${t.line}`,
  background: t.surface,
  color: t.ink,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background .12s',
};

// ─── Settings ──────────────────────────────────────────────────────────

export default function SettingsTab() {
  const { user } = useSupabaseSession();
  const { role } = usePanelRole();
  const [pillsVisible, setPillsVisible] = useAdminPillVisibility();
  const [perfEnabled, setPerfEnabled] = useState(() => isPerfEnabled());
  const [audioEnabled, setAudioEnabled] = useState(() => audioDebugEnabled());

  useEffect(() => {
    const unsub = subscribePerfLive(() => setPerfEnabled(isPerfEnabled()));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeAudioDebugEnabled(() => setAudioEnabled(audioDebugEnabled()));
    return unsub;
  }, []);


  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out');
      window.location.assign('/');
    } catch (e: any) {
      toast.error('Sign out failed', { description: e?.message });
    }
  };

  const roleLabel =
    role === 'full' ? 'Full Admin' : role === 'limited' ? 'Limited Admin' : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Signed in as" value={user?.email ?? '—'} />
          <Field label="User ID" value={user?.id ?? '—'} mono />
          <Field label="Role">
            <StatusPill tone={role === 'full' ? 'ok' : role === 'limited' ? 'warn' : 'neutral'}>
              {roleLabel}
            </StatusPill>
          </Field>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <Link to="/clubhouse" style={{ textDecoration: 'none' }}>
            <button style={ghostBtn}>
              <ArrowLeft size={12} /> Back to App
            </button>
          </Link>
          <button onClick={signOut} style={{ ...ghostBtn, color: t.dangerText, borderColor: t.dangerSoft }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </Card>

      <Card
        title="Developer Tools"
        subtitle="Per-device preferences for admin instrumentation"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.ink, fontSize: 13, fontWeight: 600 }}>Show video debug pills</div>
            <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>
              Reveal the floating DBG / BOOT toggles on this device. Toggling flips live — no reload needed.
            </div>
          </div>
          <ToggleSwitch
            checked={pillsVisible}
            onChange={() => setPillsVisible(!pillsVisible)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.ink, fontSize: 13, fontWeight: 600 }}>Instrumentation logging (DBG)</div>
            <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>
              Console perf/trace logging on this device. Same switch as the DBG pill.
            </div>
          </div>
          <ToggleSwitch
            checked={perfEnabled}
            onChange={() => setPerfLive(!perfEnabled)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.ink, fontSize: 13, fontWeight: 600 }}>Audio debug (AUDIO pill + heartbeats)</div>
            <div style={{ color: t.inkMuted, fontSize: 12, marginTop: 2 }}>
              Audio slot heartbeats, mute tracing, and the AUDIO log on this device. Toggling flips live — no reload needed.
            </div>
          </div>
          <ToggleSwitch
            checked={audioEnabled}
            onChange={() => setAudioDebugEnabled(!audioEnabled)}
          />
        </div>
      </Card>

    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        flexShrink: 0,
        width: 44,
        height: 26,
        borderRadius: 999,
        border: 'none',
        background: checked ? t.ink : t.line,
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
        transition: 'background .15s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: t.surface,
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transition: 'left .15s',
        }}
      />
    </button>
  );
}

function Field({
  label,
  value,
  mono,
  children,
}: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ color: t.inkFaint, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </span>
      {children ?? (
        <span
          style={{
            color: t.ink,
            fontSize: 13,
            fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '60%',
          }}
          title={value}
        >
          {value}
        </span>
      )}
    </div>
  );
}
