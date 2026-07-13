import React, { useMemo, useState } from 'react';
import { toast } from '@/lib/toast';
import { Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react';
import { adminTheme as t } from '../theme';
import StatusPill from './StatusPill';
import EmptyState from './EmptyState';
import AdminSheet from './AdminSheet';
import ConfirmDialog from './ConfirmDialog';
import {
  useHelpArticlesAdmin,
  type AdminHelpArticle,
  type HelpArticleInput,
} from '../hooks/useHelpArticlesAdmin';

const KNOWN_CATEGORIES = [
  'Account',
  'Handicap',
  'Creator',
  'Posting',
  'Privacy',
  'General',
];

const EMPTY_INPUT: HelpArticleInput = {
  category: 'General',
  question: '',
  answer: '',
  sort_order: 0,
  is_published: true,
};

export default function HelpArticlesTab() {
  const { isLoading, articles, grouped, create, update, remove, togglePublish } =
    useHelpArticlesAdmin();
  const [editing, setEditing] = useState<AdminHelpArticle | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminHelpArticle | null>(null);

  const categoryKeys = useMemo(() => Object.keys(grouped), [grouped]);

  const handleSave = async (input: HelpArticleInput, id?: string) => {
    try {
      if (id) {
        await update.mutateAsync({ id, patch: input });
        toast.success('Article updated');
      } else {
        await create.mutateAsync(input);
        toast.success('Article created');
      }
      setEditing(null);
      setCreating(false);
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    }
  };

  const handleTogglePublish = async (a: AdminHelpArticle) => {
    try {
      await togglePublish.mutateAsync({ id: a.id, is_published: !a.is_published });
      toast.success(a.is_published ? 'Unpublished' : 'Published');
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
          {articles.length} article{articles.length === 1 ? '' : 's'} across {categoryKeys.length} categor{categoryKeys.length === 1 ? 'y' : 'ies'}
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
          <Plus size={16} /> New article
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 56, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState title="No help articles yet" subtitle="Create the first article to populate the help centre." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {categoryKeys.map((cat) => (
            <section key={cat}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 1.4, color: t.inkMuted, marginBottom: 8, paddingLeft: 4,
              }}>
                {cat}
              </div>
              <div style={{
                background: t.surface, border: `1px solid ${t.line}`,
                borderRadius: t.radius.lg, overflow: 'hidden',
              }}>
                {grouped[cat].map((a, i) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      borderTop: i === 0 ? 'none' : `1px solid ${t.line}`,
                    }}
                  >
                    <div style={{
                      minWidth: 32, fontSize: 12, fontWeight: 700, color: t.inkFaint,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      #{a.sort_order}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, lineHeight: 1.3 }}>
                        {a.question}
                      </div>
                      <div style={{
                        fontSize: 12, color: t.inkMuted, marginTop: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {a.answer}
                      </div>
                    </div>
                    <StatusPill tone={a.is_published ? 'ok' : 'neutral'}>
                      {a.is_published ? 'Published' : 'Draft'}
                    </StatusPill>
                    <button
                      onClick={() => handleTogglePublish(a)}
                      title={a.is_published ? 'Unpublish' : 'Publish'}
                      style={iconBtnStyle}
                    >
                      {a.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => setEditing(a)} title="Edit" style={iconBtnStyle}>
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(a)}
                      title="Delete"
                      style={{ ...iconBtnStyle, color: t.danger }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ArticleEditor
        open={creating}
        initial={null}
        onClose={() => setCreating(false)}
        onSave={(input) => handleSave(input)}
        busy={create.isPending}
      />
      <ArticleEditor
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
        title="Delete article?"
        description={deleteTarget ? `"${deleteTarget.question}" will be permanently removed.` : undefined}
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
  border: `1px solid ${adminTheme_line()}`,
  background: '#FFFFFF', color: '#0F172A',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
};
function adminTheme_line() { return '#E2E8F0'; }

/* --------------------------- Editor sheet --------------------------- */

function ArticleEditor({
  open, initial, onClose, onSave, busy,
}: {
  open: boolean;
  initial: AdminHelpArticle | null;
  onClose: () => void;
  onSave: (input: HelpArticleInput) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState<HelpArticleInput>(EMPTY_INPUT);
  const [customCategory, setCustomCategory] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        category: initial.category,
        question: initial.question,
        answer: initial.answer,
        sort_order: initial.sort_order,
        is_published: initial.is_published,
      });
      setCustomCategory(!KNOWN_CATEGORIES.includes(initial.category));
    } else {
      setForm(EMPTY_INPUT);
      setCustomCategory(false);
    }
  }, [open, initial]);

  const valid = form.question.trim().length > 0 && form.answer.trim().length > 0 && form.category.trim().length > 0;

  const handleSubmit = () => {
    if (!valid) {
      toast.error('Question, answer and category are required');
      return;
    }
    onSave({
      ...form,
      category: form.category.trim(),
      question: form.question.trim(),
      answer: form.answer.trim(),
    });
  };

  return (
    <AdminSheet
      open={open}
      onClose={onClose}
      title={initial ? 'Edit article' : 'New article'}
      subtitle={initial ? initial.question : 'Publish to the help centre'}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} disabled={!valid || busy} style={{ ...btnPrimary, opacity: !valid || busy ? 0.55 : 1 }}>
            {busy ? 'Saving...' : initial ? 'Save changes' : 'Create article'}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Category">
          {customCategory ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="New category"
                style={inputStyle}
              />
              <button onClick={() => { setCustomCategory(false); setForm({ ...form, category: 'General' }); }} style={btnSecondary}>
                Preset
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ ...inputStyle, flex: 1 }}
              >
                {KNOWN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {!KNOWN_CATEGORIES.includes(form.category) && (
                  <option value={form.category}>{form.category}</option>
                )}
              </select>
              <button onClick={() => setCustomCategory(true)} style={btnSecondary}>
                Custom
              </button>
            </div>
          )}
        </Field>

        <Field label="Question">
          <input
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            maxLength={200}
            placeholder="e.g. How do I connect my WHS handicap?"
            style={inputStyle}
          />
        </Field>

        <Field label="Answer" hint="Line breaks are preserved in the help centre.">
          <textarea
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            maxLength={4000}
            rows={8}
            placeholder="Write a clear, plain-English answer."
            style={{ ...inputStyle, resize: 'vertical', minHeight: 140, fontFamily: 'inherit' }}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Sort order" hint="Lower = higher in category">
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
