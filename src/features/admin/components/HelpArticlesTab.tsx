import React, { useMemo, useState } from 'react';
import { toast } from '@/lib/toast';
import { adminTheme as t } from '../theme';
import { useHelpInsight, isPermissionError } from '../hooks/useContentDesk';
import { SECTION, LIST_SECTION, H, H_RIGHT, FIG_LABEL, MORE, DOT } from './content/deskTokens';
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

/**
 * BRIEF_CONTENT_DESK Stage 5 (Pages.html) — Help insight + Articles. Rows open
 * the existing editor; publish toggle and delete now live inside it. Save,
 * publish and delete logic is unchanged.
 */
export default function HelpArticlesTab() {
  const { isLoading, articles, grouped, create, update, remove } =
    useHelpArticlesAdmin();
  const help = useHelpInsight(30);
  const [editing, setEditing] = useState<AdminHelpArticle | null>(null);
  const [creating, setCreating] = useState<{ question: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminHelpArticle | null>(null);
  const [allArticles, setAllArticles] = useState(false);
  const [allTerms, setAllTerms] = useState(false);

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
      setCreating(null);
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

  const terms: { q: string; n: number }[] = help.data?.no_answer_terms ?? [];
  const shownTerms = allTerms ? terms : terms.slice(0, 3);

  // Articles: 6 rows total across groups, then reveal all.
  let budget = allArticles ? Infinity : 6;
  const groups = categoryKeys.map((cat) => {
    const rows = grouped[cat].slice(0, Math.max(0, budget));
    budget -= rows.length;
    return { cat, total: grouped[cat].length, rows };
  }).filter((g) => g.rows.length > 0);
  const hiddenArticles = allArticles ? 0 : Math.max(0, articles.length - 6);

  return (
    <>
      <section style={SECTION}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={H}>Help</span>
          <span style={H_RIGHT}>last 30d</span>
        </div>
        {help.isError && isPermissionError(help.error) ? (
          <div style={{ marginTop: 10, fontSize: 12, color: t.inkFaint }}>Full admins only</div>
        ) : (
          <>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              <div><div style={FIG_LABEL}>Visits</div><div style={FIG_18}>{fmt(help.data?.visits)}</div></div>
              <div><div style={FIG_LABEL}>Searches</div><div style={FIG_18}>{fmt(help.data?.searches)}</div></div>
              <div><div style={FIG_LABEL}>No answer</div><div style={{ ...FIG_18, color: t.warnText }}>{fmt(help.data?.no_answer)}</div></div>
            </div>
            <div style={{ ...FIG_LABEL, marginTop: 14 }}>Searched for, nothing found</div>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column' }}>
              {!help.isLoading && terms.length === 0 && (
                <div style={{ padding: '8px 0', borderTop: `1px solid ${t.hairline}`, fontSize: 12, color: t.inkFaint }}>No unanswered searches yet</div>
              )}
              {shownTerms.map((term) => (
                <div key={term.q} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', columnGap: 10, alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${t.hairline}` }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.ink, overflowWrap: 'anywhere' }}>&ldquo;{term.q}&rdquo;</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: t.ink }}>{term.n.toLocaleString('en-GB')}</span>
                  <button type="button" onClick={() => setCreating({ question: term.q })} style={PILL_28}>Write it</button>
                </div>
              ))}
              {!allTerms && terms.length > 3 && (
                <button type="button" onClick={() => setAllTerms(true)} style={{ ...MORE, borderTop: `1px solid ${t.hairline}` }}>{terms.length - 3} more</button>
              )}
            </div>
          </>
        )}
      </section>

      <section style={LIST_SECTION}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 10px' }}>
          <span style={H}>Articles</span>
          <button type="button" onClick={() => setCreating({ question: '' })} style={LINK}>+ New</button>
        </div>
        {isLoading ? (
          <div style={{ padding: '9px 16px', borderTop: `1px solid ${t.hairline}`, fontSize: 12, color: t.inkFaint }}>Loading</div>
        ) : articles.length === 0 ? (
          <div style={{ padding: '9px 16px 12px', borderTop: `1px solid ${t.hairline}`, fontSize: 12, color: t.inkFaint }}>No help articles yet</div>
        ) : groups.map((g) => (
          <React.Fragment key={g.cat}>
            <div style={GROUP_HEAD}>{g.cat}{DOT}{g.total}</div>
            {g.rows.map((a) => (
              <button key={a.id} type="button" onClick={() => setEditing(a)} style={ARTICLE_ROW}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: t.ink }}>{a.question}</span>
                  <span style={{ display: 'block', fontSize: 11, color: t.inkFaint }}>edited {dMon(a.updated_at)}</span>
                </span>
                <span aria-label={a.is_published ? 'Published' : 'Hidden'} style={{ width: 8, height: 8, borderRadius: 4, background: a.is_published ? t.okText : t.inkFaint }} />
              </button>
            ))}
          </React.Fragment>
        ))}
        {hiddenArticles > 0 && (
          <button type="button" onClick={() => setAllArticles(true)} style={MORE}>{hiddenArticles} more articles</button>
        )}
      </section>

      <ArticleEditor
        open={!!creating}
        initial={null}
        prefillQuestion={creating?.question ?? ''}
        onClose={() => setCreating(null)}
        onSave={(input) => handleSave(input)}
        busy={create.isPending}
      />
      <ArticleEditor
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
        title="Delete article?"
        description={deleteTarget ? `"${deleteTarget.question}" will be permanently removed.` : undefined}
        confirmLabel="Delete"
        tone="danger"
        busy={remove.isPending}
      />
    </>
  );
}

const fmt = (n: number | null | undefined) => (n == null ? '-' : n.toLocaleString('en-GB'));
const dMon = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' });
const FIG_18: React.CSSProperties = { marginTop: 2, fontSize: 18, fontWeight: 800, color: t.ink };
const PILL_28: React.CSSProperties = { height: 28, padding: '0 10px', borderRadius: 999, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink, fontSize: 11, fontWeight: 700, cursor: 'pointer' };
const LINK: React.CSSProperties = { border: 0, background: 'transparent', padding: 0, fontSize: 12, fontWeight: 700, color: t.brandText, cursor: 'pointer' };
const GROUP_HEAD: React.CSSProperties = { padding: '8px 16px 6px', borderTop: `1px solid ${t.hairline}`, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkFaint };
const ARTICLE_ROW: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '9px 16px', width: '100%', textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer', font: 'inherit' };

/* --------------------------- Editor sheet --------------------------- */

export function ArticleEditor({
  open, initial, onClose, onSave, onDelete, prefillQuestion = '', busy,
}: {
  open: boolean;
  initial: AdminHelpArticle | null;
  onClose: () => void;
  onSave: (input: HelpArticleInput) => void;
  /** Editing only: opens the existing delete confirm. */
  onDelete?: () => void;
  /** New articles only: "Write it" prefills the searched question. */
  prefillQuestion?: string;
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
      setForm({ ...EMPTY_INPUT, question: prefillQuestion });
      setCustomCategory(false);
    }
  }, [open, initial, prefillQuestion]);

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
          {onDelete && <button onClick={onDelete} style={{ ...btnSecondary, color: t.dangerText, marginRight: 'auto' }}>Delete</button>}
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
