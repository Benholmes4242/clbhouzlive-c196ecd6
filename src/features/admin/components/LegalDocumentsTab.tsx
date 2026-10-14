import React, { useState } from 'react';
import { toast } from '@/lib/toast';
import { adminTheme as t } from '../theme';
import { LIST_SECTION, H, H_RIGHT, MORE } from './content/deskTokens';
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

/**
 * BRIEF_CONTENT_DESK Stage 5 (Pages.html) — Legal. Rows open the existing
 * editor; publish toggle and delete live inside it. Save logic unchanged.
 */
export default function LegalDocumentsTab() {
  const { isLoading, documents, create, update, remove } = useLegalDocumentsAdmin();
  const [editing, setEditing] = useState<AdminLegalDocument | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminLegalDocument | null>(null);
  const [all, setAll] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success('Deleted');
      setDeleteTarget(null);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  const shown = all ? documents : documents.slice(0, 6);
  const hidden = documents.length - shown.length;

  return (
    <>
      <section style={LIST_SECTION}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 10px' }}>
          <span style={H}>Legal</span>
          <span style={H_RIGHT}>effective</span>
        </div>
        {isLoading ? (
          <div style={{ ...ROW, color: t.inkFaint, fontSize: 12 }}>Loading</div>
        ) : documents.length === 0 ? (
          <div style={{ ...ROW, color: t.inkFaint, fontSize: 12 }}>No legal documents</div>
        ) : shown.map((d) => {
          const eff = effectiveLabel(d);
          return (
            <button key={d.id} type="button" onClick={() => setEditing(d)} style={ROW}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: t.ink }}>{d.title}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: eff.colour }}>{eff.text}</span>
            </button>
          );
        })}
        {hidden > 0 && (
          <button type="button" onClick={() => setAll(true)} style={MORE}>{hidden} more documents</button>
        )}
        {(all || documents.length <= 6) && !isLoading && (
          <button type="button" onClick={() => setCreating(true)} style={{ ...ROW, color: t.brandText, fontSize: 13.5, fontWeight: 700 }}>+ New document</button>
        )}
      </section>

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
        onDelete={editing ? () => setDeleteTarget(editing) : undefined}
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
    </>
  );
}

/** "d Mon yyyy"; okText within the last 30 days; "Hidden" when unpublished. */
export function effectiveLabel(d: { is_published: boolean; effective_date: string | null }, now = new Date()): { text: string; colour: string } {
  if (!d.is_published) return { text: 'Hidden', colour: t.inkFaint };
  if (!d.effective_date) return { text: '-', colour: t.inkMuted };
  const at = new Date(`${d.effective_date.slice(0, 10)}T12:00:00Z`);
  const text = at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' });
  const days = (now.getTime() - at.getTime()) / 86_400_000;
  return { text, colour: days >= -1 && days <= 30 ? t.okText : t.inkMuted };
}

const ROW: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center',
  padding: '10px 16px', width: '100%', textAlign: 'left', background: 'transparent',
  border: 0, borderTop: `1px solid ${t.hairline}`, cursor: 'pointer', font: 'inherit',
};

/* --------------------------- Editor sheet --------------------------- */

function DocumentEditor({
  open, initial, onClose, onSave, onDelete, busy,
}: {
  open: boolean;
  initial: AdminLegalDocument | null;
  onClose: () => void;
  onSave: (input: LegalDocumentInput) => void;
  /** Editing only: opens the existing delete confirm. */
  onDelete?: () => void;
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
          {onDelete && <button onClick={onDelete} style={{ ...btnSecondary, color: t.dangerText, marginRight: 'auto' }}>Delete</button>}
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
              padding: '10px 12px', borderRadius: 10, border: `1px solid ${t.line}`,
              background: t.surface, cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              <span style={{ fontSize: 13, color: t.ink, fontWeight: 600 }}>
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
      <label style={{ fontSize: 12, color: t.inkMuted, fontWeight: 600 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: t.inkFaint }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${t.line}`,
  background: t.surface,
  color: t.ink,
  fontSize: 14,
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 10, border: 'none',
  background: t.ink, color: t.canvas, fontSize: 13, fontWeight: 700, cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10,
  border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
