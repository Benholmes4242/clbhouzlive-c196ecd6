import React, { useState } from 'react';
import { toast } from '@/lib/toast';
import { Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react';
import { adminTheme as t } from '../theme';
import StatusPill from './StatusPill';
import EmptyState from './EmptyState';
import AdminSheet from './AdminSheet';
import ConfirmDialog from './ConfirmDialog';
import {
  useLegalDocumentsAdmin,
  type AdminLegalDocument,
  type LegalDocumentInput,
} from '../hooks/useLegalDocumentsAdmin';

const EMPTY_INPUT: LegalDocumentInput = {
  slug: '',
  title: '',
  body: '',
  sort_order: 100,
  effective_date: null,
  is_published: false,
};

export default function LegalDocumentsTab() {
  const { isLoading, documents, create, update, remove, togglePublish } = useLegalDocumentsAdmin();
  const [editing, setEditing] = useState<AdminLegalDocument | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminLegalDocument | null>(null);

  const handleSave = async (input: LegalDocumentInput, id?: string) => {
    try {
      if (id) {
        // slug is read-only after creation
        const { slug: _slug, ...patch } = input;
        await update.mutateAsync({ id, patch });
        toast.success('Document updated');
      } else {
        await create.mutateAsync(input);
        toast.success('Document created');
      }
      setEditing(null);
      setCreating(false);
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    }
  };

  const handleTogglePublish = async (d: AdminLegalDocument) => {
    try {
      await togglePublish.mutateAsync({ id: d.id, is_published: !d.is_published });
      toast.success(d.is_published ? 'Unpublished' : 'Published');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success('Deleted');
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: t.inkMuted }}>
          {documents.length} document{documents.length === 1 ? '' : 's'}. Edits go live immediately.
        </div>
        <button
          onClick={() => setCreating(true)}
          style={{
            padding: '10px 14px', borderRadius: t.radius.md,
            border: 'none', background: t.ink, color: t.surface,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={16} /> New document
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 56, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState title="No legal documents" subtitle="Create the first document to publish it." />
      ) : (
        <div style={{
          background: t.surface, border: `1px solid ${t.line}`,
          borderRadius: t.radius.lg, overflow: 'hidden',
        }}>
          {documents.map((d, i) => (
            <div
              key={d.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderTop: i === 0 ? 'none' : `1px solid ${t.line}`,
              }}
            >
              <div style={{
                minWidth: 40, fontSize: 12, fontWeight: 700, color: t.inkFaint,
                fontVariantNumeric: 'tabular-nums',
              }}>
                #{d.sort_order}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, lineHeight: 1.3 }}>
                  {d.title}
                </div>
                <div style={{
                  fontSize: 12, color: t.inkMuted, marginTop: 2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  /legal/{d.slug}{d.effective_date ? ` · effective ${d.effective_date}` : ''}
                </div>
              </div>
              <StatusPill tone={d.is_published ? 'ok' : 'neutral'}>
                {d.is_published ? 'Published' : 'Draft'}
              </StatusPill>
              <button
                onClick={() => handleTogglePublish(d)}
                title={d.is_published ? 'Unpublish' : 'Publish'}
                style={iconBtnStyle}
              >
                {d.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button onClick={() => setEditing(d)} title="Edit" style={iconBtnStyle}>
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteTarget(d)}
                title="Delete"
                style={{ ...iconBtnStyle, color: t.danger }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <DocumentEditor
        open={creating}
        initial={null}
        onClose={() => setCreating(false)}
        onSave={(input) => handleSave(input)}
        busy={create.isPending}
      />
      <DocumentEditor
        open={!!editing}
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={(input) => editing && handleSave(input, editing.id)}
        busy={update.isPending}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete document?"
        description={deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : undefined}
        confirmLabel="Delete"
        tone="danger"
        busy={remove.isPending}
      />

      <style>{`@keyframes admin-pulse { 0%,100%{opacity:.55} 50%{opacity:1} }`}</style>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  border: '1px solid #E2E8F0',
  background: '#FFFFFF', color: '#0F172A',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
};

/* --------------------------- Editor sheet --------------------------- */

function DocumentEditor({
  open, initial, onClose, onSave, busy,
}: {
  open: boolean;
  initial: AdminLegalDocument | null;
  onClose: () => void;
  onSave: (input: LegalDocumentInput) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState<LegalDocumentInput>(EMPTY_INPUT);

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        slug: initial.slug,
        title: initial.title,
        body: initial.body,
        sort_order: initial.sort_order,
        effective_date: initial.effective_date,
        is_published: initial.is_published,
      });
    } else {
      setForm(EMPTY_INPUT);
    }
  }, [open, initial]);

  const slugLocked = !!initial;
  const validSlug = /^[a-z0-9-]+$/.test(form.slug);
  const valid = form.title.trim().length > 0 && form.body.trim().length > 0 && validSlug;

  const handleSubmit = () => {
    if (!valid) {
      toast.error('Title, body and a lowercase slug are required');
      return;
    }
    onSave({
      ...form,
      slug: form.slug.trim().toLowerCase(),
      title: form.title.trim(),
      body: form.body,
      effective_date: form.effective_date || null,
    });
  };

  return (
    <AdminSheet
      open={open}
      onClose={onClose}
      title={initial ? 'Edit document' : 'New document'}
      subtitle={initial ? `/legal/${initial.slug}` : 'Publish a new legal document'}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} disabled={!valid || busy} style={{ ...btnPrimary, opacity: !valid || busy ? 0.55 : 1 }}>
            {busy ? 'Saving...' : initial ? 'Save changes' : 'Create document'}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={200}
            placeholder="e.g. Terms of Service"
            style={inputStyle}
          />
        </Field>

        <Field label="Slug" hint={slugLocked ? 'Slug is locked after creation to avoid breaking links.' : 'Lowercase letters, numbers and hyphens only.'}>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            disabled={slugLocked}
            placeholder="e.g. privacy"
            style={{ ...inputStyle, opacity: slugLocked ? 0.6 : 1 }}
          />
        </Field>

        <Field label="Body" hint="Blank line = paragraph. Prefix headings with # or ##. Use - for bullets, 1. for numbered lists.">
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={18}
            placeholder="Document body"
            style={{ ...inputStyle, resize: 'vertical', minHeight: 320, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, lineHeight: 1.55 }}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Effective date">
            <input
              type="date"
              value={form.effective_date ?? ''}
              onChange={(e) => setForm({ ...form, effective_date: e.target.value || null })}
              style={inputStyle}
            />
          </Field>
          <Field label="Sort order" hint="Lower = higher in list">
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
              style={inputStyle}
            />
          </Field>
          <Field label="Status">
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0',
              background: '#FFFFFF', cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600 }}>
                {form.is_published ? 'Published (live)' : 'Draft (hidden)'}
              </span>
            </label>
          </Field>
        </div>
      </div>
    </AdminSheet>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#94A3B8' }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: 14,
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 10, border: 'none',
  background: '#0F172A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10,
  border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#0F172A',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
