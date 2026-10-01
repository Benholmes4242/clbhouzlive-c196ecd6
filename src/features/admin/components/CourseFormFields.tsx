import React from 'react';
import { adminTheme as t } from '../theme';

/** Form primitives shared by the admin course editor and AddCourseSheet. */

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.inkFaint, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: t.inkMuted, fontWeight: 600 }}>
        {label}{required && <span style={{ color: t.danger, marginLeft: 2 }}>*</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { value: any; onChange: (v: string) => void }) {
  const { value, onChange, ...rest } = props;
  return (
    <input
      {...rest}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', minHeight: 44, padding: '10px 12px',
        borderRadius: t.radius.md, border: `1px solid ${t.line}`,
        background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
        ...(rest.style || {}),
      }}
    />
  );
}

export function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', minHeight: 44, padding: '10px 12px',
        borderRadius: t.radius.md, border: `1px solid ${t.line}`,
        background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
      }}
    >{children}</select>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', minHeight: 44,
        borderRadius: t.radius.md, border: `1px solid ${t.line}`,
        background: t.surface, cursor: 'pointer', width: '100%',
        textAlign: 'left',
      }}
    >
      <span style={{ flex: 1, fontSize: 14, color: t.ink, fontWeight: 500 }}>{label}</span>
      <span style={{
        width: 40, height: 24, borderRadius: 999,
        background: value ? t.ink : t.line,
        position: 'relative', transition: 'background .15s',
        flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 18 : 2,
          width: 20, height: 20, borderRadius: '50%',
          background: t.surface, transition: 'left .15s',
        }} />
      </span>
    </button>
  );
}

export function DraftRestoredBar({ visible, onDiscard }: { visible: boolean; onDiscard: () => void }) {
  if (!visible) return null;
  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, padding: '8px 12px', minHeight: 40,
        borderRadius: t.radius.md, border: `1px solid ${t.line}`,
        background: t.brandSoft, color: t.brandText,
        fontSize: 12, fontWeight: 600,
      }}
    >
      <span>Draft restored</span>
      <button
        type="button"
        onClick={onDiscard}
        style={{
          background: 'transparent', border: 'none',
          color: t.brandText, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', padding: '4px 8px',
        }}
      >Discard</button>
    </div>
  );
}
