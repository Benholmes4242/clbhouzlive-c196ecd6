/**
 * The Amateur News editor.
 *
 * The tour Wire editor's flow exactly — paste, parse, correct, save, publish as
 * a separate confirmed action — with three declared differences:
 *
 *   1. NO EMBEDS. There is no amateur player, tournament or leaderboard table,
 *      so [leaderboard], [player:], [stat:] and [round:] cannot resolve. They
 *      are STRIPPED at parse time and reported, never saved: a story cannot
 *      carry a block the renderer will not draw.
 *   2. CATEGORIES, NOT A TOUR. Many per story on purpose.
 *   3. TOURNAMENT IS FREE TEXT. "Walker Cup", "AIG Senior Cup" — a display
 *      string, because amateur events have nothing to look up.
 *
 * PREVIEW USES THE REAL READER COMPONENTS at a real 390px, so the preview
 * cannot disagree with the published page.
 */
import React from 'react';
import { ChevronLeft, Loader2, Sparkles, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import type { StoryBlock } from '@/features/tourhub/news/blocks';
import { StoryArticle } from '@/features/tourhub/news/StoryPage';
import { LeadStory, StoryRow } from '@/features/tourhub/news/NewsTab';
import { blocksToText, parseStoryText, slugifyHeadline } from '@/features/tourhub/news/parseStoryText';
import { SLATE_50 } from '@/features/tourhub/_shared/tokens';
import { AMATEUR_CATEGORIES, AMATEUR_CATEGORY_LABEL } from '@/features/amateur/news/categories';
import { amateurTag } from '@/features/amateur/news/AmateurStoryPage';
import type { AmateurStory } from '@/features/amateur/news/useAmateurStories';
import { adminTheme as t } from '../../theme';
import StatusPill from '../StatusPill';
import ConfirmDialog from '../ConfirmDialog';
import { ImageThumb, WireBlockEditor } from './WireBlockEditor';
import {
  useAmateurSlugCollision,
  type AdminAmateurStory,
  type AmateurStoryInput,
} from '../../hooks/useAmateurStoriesAdmin';

const RENDERABLE = new Set<StoryBlock['type']>(['paragraph', 'heading', 'image', 'quote']);

const KICKER_STYLE: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
  textTransform: 'uppercase', color: t.inkFaint,
};

const input: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 9,
  border: `1px solid ${t.line}`, background: t.canvas, color: t.ink,
  fontSize: 13, outline: 'none', fontFamily: 'inherit',
};

const panel: React.CSSProperties = {
  background: t.surface, border: `1px solid ${t.line}`,
  borderRadius: t.radius.lg, padding: 14,
};

const btn = (primary?: boolean): React.CSSProperties => ({
  padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
  border: `1px solid ${primary ? t.brand : t.line}`,
  background: primary ? t.brand : 'transparent',
  color: primary ? '#0A0D12' : t.inkMuted,
  fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  display: 'inline-flex', alignItems: 'center', gap: 6,
});

interface Form {
  kicker: string;
  headline: string;
  standfirst: string;
  slug: string;
  slugTouched: boolean;
  imageUrl: string;
  imageCredit: string;
  categories: string[];
  tournamentName: string;
  sourceText: string;
  blocks: StoryBlock[];
}

function formFrom(story: AdminAmateurStory | null): Form {
  return {
    kicker: story?.kicker ?? '',
    headline: story?.headline ?? '',
    standfirst: story?.standfirst ?? '',
    slug: story?.slug ?? '',
    slugTouched: !!story,
    imageUrl: story?.image_url ?? '',
    imageCredit: story?.image_credit ?? '',
    categories: story?.categories ?? [],
    tournamentName: story?.tournament_name ?? '',
    sourceText: story?.source_text ?? (story ? blocksToText(story.body_blocks) : ''),
    blocks: story?.body_blocks ?? [],
  };
}

function toInput(f: Form): AmateurStoryInput {
  return {
    slug: f.slug.trim(),
    kicker: f.kicker.trim() || null,
    headline: f.headline.trim(),
    standfirst: f.standfirst.trim() || null,
    body_blocks: f.blocks.filter((b) => RENDERABLE.has(b.type)),
    source_text: f.sourceText.trim() || null,
    image_url: f.imageUrl.trim() || null,
    image_credit: f.imageCredit.trim() || null,
    categories: f.categories,
    tournament_name: f.tournamentName.trim() || null,
  };
}

function toPreviewStory(f: Form, existing: AdminAmateurStory | null): AmateurStory {
  const i = toInput(f);
  return {
    id: existing?.id ?? 'preview',
    slug: i.slug || 'preview',
    kicker: i.kicker,
    headline: i.headline || 'Untitled story',
    standfirst: i.standfirst,
    body_blocks: i.body_blocks,
    image_url: i.image_url,
    image_credit: i.image_credit,
    tour_slug: null,
    tournament_id: null,
    published_at: existing?.published_at ?? new Date().toISOString(),
    categories: i.categories,
    tournament_name: i.tournament_name,
  };
}

export default function AmateurStoryEditor({
  story,
  onBack,
  onSave,
  onPublish,
  onDelete,
  saving,
}: {
  story: AdminAmateurStory | null;
  onBack: () => void;
  onSave: (input: AmateurStoryInput) => Promise<void>;
  onPublish: (publishedAt: string | null) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving: boolean;
}) {
  const [f, setF] = React.useState<Form>(() => formFrom(story));
  const [stripped, setStripped] = React.useState<string[]>([]);
  const [reclassified, setReclassified] = React.useState<string[]>([]);
  const [confirm, setConfirm] = React.useState<'publish' | 'unpublish' | 'delete' | null>(null);
  const [scheduleAt, setScheduleAt] = React.useState('');

  React.useEffect(() => {
    setF(formFrom(story));
    setStripped([]);
    setReclassified([]);
  }, [story?.id]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const autoSlug = slugifyHeadline(f.headline);
  const slug = f.slugTouched ? f.slug : autoSlug;
  const collision = useAmateurSlugCollision(slug, story?.id);

  const state: 'draft' | 'scheduled' | 'published' = !story?.published_at
    ? 'draft'
    : new Date(story.published_at).getTime() > Date.now()
      ? 'scheduled'
      : 'published';

  const preview = React.useMemo(() => toPreviewStory({ ...f, slug }, story), [f, slug, story]);

  /** Parsing is SYNCHRONOUS here: nothing resolves against a database. */
  const parse = () => {
    const result = parseStoryText(f.sourceText);
    const keep = result.blocks.filter((b) => RENDERABLE.has(b.type));
    const dropped = result.blocks
      .filter((b) => !RENDERABLE.has(b.type))
      .map((b) => `[${b.type}] — amateur golf has no such data, block dropped`);
    setF((p) => ({ ...p, blocks: keep }));
    setStripped(dropped);
    setReclassified(result.reclassified);
    if (keep.length === 0) toast.error('Nothing to parse');
    else toast.success(`${keep.length} blocks parsed`);
  };

  const canSave = f.headline.trim().length > 2 && slug.length > 2 && !saving;

  const save = async () => {
    if (!canSave) { toast.error('A headline and slug are needed'); return; }
    await onSave(toInput({ ...f, slug }));
  };

  const savedBlockCount = story?.body_blocks.length ?? 0;
  const publishBlocked = savedBlockCount === 0;
  const unparsed = f.sourceText.trim().length > 0 && f.blocks.length === 0;

  const toggleCategory = (c: string) =>
    setF((p) => ({
      ...p,
      categories: p.categories.includes(c)
        ? p.categories.filter((x) => x !== c)
        : [...p.categories, c],
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={onBack} style={btn()}>
          <ChevronLeft size={14} /> Amateur news
        </button>
        <StatusPill tone={state === 'published' ? 'ok' : state === 'scheduled' ? 'brand' : 'neutral'}>
          {state === 'published' ? 'Published' : state === 'scheduled' ? 'Scheduled' : 'Draft'}
        </StatusPill>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={save} disabled={!canSave} style={{ ...btn(true), opacity: canSave ? 1 : 0.5 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {story ? 'Save' : 'Create draft'}
        </button>
        {story && state !== 'published' && (
          <>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              title="Leave empty to publish now"
              style={{ ...input, width: 'auto', padding: '7px 9px', fontSize: 12 }}
            />
            <button
              type="button"
              disabled={publishBlocked}
              title={publishBlocked ? 'This story has no body' : undefined}
              onClick={() => {
                if (publishBlocked) {
                  toast.error('This story has no body — press Parse, then Save, before publishing.');
                  return;
                }
                setConfirm('publish');
              }}
              style={{ ...btn(), opacity: publishBlocked ? 0.45 : 1, cursor: publishBlocked ? 'not-allowed' : 'pointer' }}
            >
              {scheduleAt ? 'Schedule' : 'Publish'}
            </button>
          </>
        )}
        {story && state !== 'draft' && (
          <button type="button" onClick={() => setConfirm('unpublish')} style={btn()}>
            <RotateCcw size={14} /> Unpublish
          </button>
        )}
        {story && onDelete && (
          <button type="button" onClick={() => setConfirm('delete')} style={{ ...btn(), color: t.dangerText }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {unparsed && (
        <div style={{
          padding: '11px 13px', borderRadius: t.radius.lg,
          background: t.dangerSoft, color: t.dangerText,
          border: `1px solid ${t.dangerText}44`,
          fontSize: 13, fontWeight: 700, lineHeight: 1.45,
        }}>
          THIS STORY HAS TEXT BUT NO BODY — IT HAS NEVER BEEN PARSED.
          <div style={{ marginTop: 4, fontSize: 12, fontWeight: 500 }}>
            Press Parse to turn the pasted text into blocks, then Save.
          </div>
        </div>
      )}

      <div className="wire-editor-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div style={panel}>
            <div style={{ ...KICKER_STYLE, marginBottom: 10 }}>The story</div>
            <textarea
              value={f.sourceText}
              onChange={(e) => set('sourceText', e.target.value)}
              placeholder={
                'Paste the finished story here.\n\n' +
                '## Subheading\n' +
                'A paragraph.\n\n' +
                '![Caption|Credit](https://…)\n' +
                '> A quote |— Attribution'
              }
              rows={14}
              style={{
                ...input, resize: 'vertical', lineHeight: 1.6,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12.5,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={parse} style={btn(true)}>
                <Sparkles size={14} /> Parse
              </button>
              <button type="button" onClick={() => set('sourceText', blocksToText(f.blocks))} style={btn()}>
                From blocks
              </button>
              <span style={{ fontSize: 11.5, color: t.inkFaint }}>
                Paragraphs, ## subheadings, images and pull quotes. No embeds — amateur golf has no player or leaderboard data.
              </span>
            </div>
            {stripped.length > 0 && (
              <div style={{
                marginTop: 10, padding: '8px 10px', borderRadius: 8,
                background: t.warnSoft, color: t.warnText, fontSize: 12, lineHeight: 1.5,
              }}>
                Embeds removed — they cannot resolve on the amateur side:
                {stripped.slice(0, 5).map((l, i) => (
                  <div key={i} style={{ fontSize: 11.5, marginTop: 4 }}>{l}</div>
                ))}
              </div>
            )}
            {reclassified.length > 0 && (
              <div style={{
                marginTop: 10, padding: '8px 10px', borderRadius: 8,
                background: t.warnSoft, color: t.warnText, fontSize: 12, lineHeight: 1.5,
              }}>
                Read as prose, not as a block — check the syntax:
                {reclassified.slice(0, 4).map((l, i) => (
                  <div key={i} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, marginTop: 4 }}>{l}</div>
                ))}
              </div>
            )}
          </div>

          <div style={panel}>
            <div style={{ ...KICKER_STYLE, marginBottom: 10 }}>Furniture</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field label="Kicker">
                <input value={f.kicker} onChange={(e) => set('kicker', e.target.value)} placeholder="e.g. WALKER CUP" style={input} />
              </Field>
              <Field label="Headline">
                <textarea
                  value={f.headline}
                  onChange={(e) => set('headline', e.target.value)}
                  rows={2}
                  style={{ ...input, resize: 'vertical', fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}
                />
              </Field>
              <Field label="Standfirst">
                <textarea value={f.standfirst} onChange={(e) => set('standfirst', e.target.value)} rows={2} style={{ ...input, resize: 'vertical' }} />
              </Field>
              <Field label="Slug" hint={f.slugTouched ? undefined : 'follows the headline'}>
                <input
                  value={slug}
                  onChange={(e) => setF((p) => ({ ...p, slug: slugifyHeadline(e.target.value), slugTouched: true }))}
                  style={{ ...input, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                />
                {collision.data && (
                  <div style={{ marginTop: 5, fontSize: 11, color: t.warnText }}>
                    Already used by “{collision.data}”
                  </div>
                )}
                <div style={{ marginTop: 5, fontSize: 11, color: t.inkFaint }}>/discover/news/{slug || '…'}</div>
              </Field>
              <Field label="Lead image">
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <ImageThumb url={f.imageUrl} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    <input value={f.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="Image URL" style={input} />
                    <input value={f.imageCredit} onChange={(e) => set('imageCredit', e.target.value)} placeholder="Credit" style={input} />
                  </div>
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: t.inkFaint }}>
                  Without an image the story shows as a row, never as the lead band.
                </div>
              </Field>
              <Field label="Categories" hint="as many as apply">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {AMATEUR_CATEGORIES.map((c) => {
                    const on = f.categories.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCategory(c)}
                        style={{
                          padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                          border: `1px solid ${on ? t.brand : t.line}`,
                          background: on ? t.brand : 'transparent',
                          color: on ? '#0A0D12' : t.inkMuted,
                          fontSize: 11.5, fontWeight: 700,
                        }}
                      >
                        {AMATEUR_CATEGORY_LABEL[c]}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Tournament" hint="free text, e.g. Walker Cup">
                <input
                  value={f.tournamentName}
                  onChange={(e) => set('tournamentName', e.target.value)}
                  placeholder="Walker Cup"
                  style={input}
                />
              </Field>
            </div>
          </div>

          <div style={panel}>
            <div style={{ ...KICKER_STYLE, marginBottom: 10, color: unparsed ? t.dangerText : t.inkFaint }}>
              Blocks · {f.blocks.length}{unparsed ? ' · NOT PARSED' : ''}
            </div>
            <WireBlockEditor blocks={f.blocks} onChange={(next) => set('blocks', next)} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div style={{ ...panel, position: 'sticky', top: 8 }}>
            <div style={{ ...KICKER_STYLE, marginBottom: 10 }}>Article · 390px</div>
            <div
              style={{
                width: 390, maxWidth: '100%', margin: '0 auto',
                border: `1px solid ${t.line}`, borderRadius: 14, overflow: 'hidden',
                background: SLATE_50, maxHeight: '62vh', overflowY: 'auto',
              }}
            >
              <div style={{ paddingBottom: 20 }}>
                <StoryArticle story={preview} tagLabel={amateurTag(preview)} />
              </div>
            </div>

            <div style={{ ...KICKER_STYLE, margin: '16px 0 10px' }}>In the list</div>
            <div
              style={{
                width: 390, maxWidth: '100%', margin: '0 auto',
                border: `1px solid ${t.line}`, borderRadius: 14, overflow: 'hidden',
                background: SLATE_50, padding: '10px 0',
              }}
            >
              <LeadStory story={preview} onOpen={() => {}} />
              <div style={{ height: 10 }} />
              <StoryRow story={preview} onOpen={() => {}} />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'publish'}
        title={scheduleAt ? 'Schedule for Amateur News?' : 'Publish to Amateur News?'}
        description={
          scheduleAt
            ? `This story goes live at ${new Date(scheduleAt).toLocaleString()}. Until then it stays invisible to members.`
            : 'This story goes live immediately, in Discover. Save first if you have unsaved edits.'
        }
        confirmLabel={scheduleAt ? 'Schedule' : 'Publish now'}
        onConfirm={async () => {
          await onPublish(scheduleAt ? new Date(scheduleAt).toISOString() : new Date().toISOString());
          setConfirm(null);
          setScheduleAt('');
        }}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === 'unpublish'}
        title="Return to draft?"
        description="The story disappears from Amateur News and its link stops resolving. Nothing is deleted."
        confirmLabel="Unpublish"
        onConfirm={async () => { await onPublish(null); setConfirm(null); }}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this story?"
        description="This cannot be undone. Unpublish instead if you only want it off the page."
        confirmLabel="Delete"
        tone="danger"
        requireText={story?.headline}
        onConfirm={async () => { await onDelete?.(); setConfirm(null); }}
        onClose={() => setConfirm(null)}
      />

      <style>{`
        .wire-editor-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 1024px) {
          .wire-editor-grid { grid-template-columns: minmax(0, 1fr) 422px; align-items: start; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5 }}>
        <span style={KICKER_STYLE}>{label}</span>
        {hint && <span style={{ fontSize: 10, color: t.inkFaint, letterSpacing: 0, textTransform: 'none' }}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}
