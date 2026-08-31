/**
 * The Wire editor.
 *
 * THE PASTE BOX IS THE PRIMARY INPUT. The story is written elsewhere, finished,
 * and arrives whole; everything else on this screen serves that one textarea.
 * Parse turns it into blocks, the block list corrects the parser's misreads, and
 * source_text is stored so the raw copy survives — a parser improvement six
 * months from now can re-run over every story ever filed.
 *
 * PREVIEW USES THE REAL COMPONENTS, at a real 390px, and the real list rows.
 * A preview that renders its own approximation of the article is a second
 * implementation that will drift and lie.
 *
 * PUBLISHING IS NOT SAVING. Save writes fields and blocks and NEVER touches
 * published_at; publishing is a separate, confirmed action. A misplaced Cmd-S
 * must not put half a story on the wire.
 */
import React from 'react';
import { ChevronLeft, Loader2, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import type { StoryBlock } from '@/features/tourhub/news/blocks';
import { StoryArticle } from '@/features/tourhub/news/StoryPage';
import { LeadStory, StoryRow } from '@/features/tourhub/news/NewsTab';
import type { TourStory } from '@/features/tourhub/news/useTourStories';
import { blocksToText, parseStoryText, slugifyHeadline } from '@/features/tourhub/news/parseStoryText';
import { parseAndResolveStoryText, parseSummary } from '@/features/tourhub/news/resolveStoryMarkers';
import { SLATE_50 } from '@/features/tourhub/_shared/tokens';
import { adminTheme as t } from '../../theme';
import StatusPill from '../StatusPill';
import ConfirmDialog from '../ConfirmDialog';
import { ImageThumb, WireBlockEditor } from './WireBlockEditor';
import {
  storyState,
  useSlugCollision,
  useTournamentOptions,
  type AdminStory,
  type StoryInput,
} from '../../hooks/useTourStoriesAdmin';

const TOURS: { value: string; label: string }[] = [
  { value: '', label: 'All tours' },
  { value: 'pga', label: 'PGA TOUR' },
  { value: 'lpga', label: 'LPGA' },
  { value: 'euro', label: 'DP World Tour' },
  { value: 'pgad', label: 'Korn Ferry' },
  { value: 'champ', label: 'Champions' },
  { value: 'liv', label: 'LIV Golf' },
];

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
  tourSlug: string;
  tournamentId: string;
  sourceText: string;
  blocks: StoryBlock[];
}

function formFrom(story: AdminStory | null): Form {
  return {
    kicker: story?.kicker ?? '',
    headline: story?.headline ?? '',
    standfirst: story?.standfirst ?? '',
    slug: story?.slug ?? '',
    // An existing story's slug is LOCKED to what was shared; auto-slug never
    // touches it again, because changing it breaks every link already out there.
    slugTouched: !!story,
    imageUrl: story?.image_url ?? '',
    imageCredit: story?.image_credit ?? '',
    tourSlug: story?.tour_slug ?? '',
    tournamentId: story?.tournament_id ?? '',
    sourceText: story?.source_text ?? (story ? blocksToText(story.body_blocks) : ''),
    blocks: story?.body_blocks ?? [],
  };
}

function toInput(f: Form): StoryInput {
  return {
    slug: f.slug.trim(),
    kicker: f.kicker.trim() || null,
    headline: f.headline.trim(),
    standfirst: f.standfirst.trim() || null,
    body_blocks: f.blocks,
    source_text: f.sourceText.trim() || null,
    image_url: f.imageUrl.trim() || null,
    image_credit: f.imageCredit.trim() || null,
    tour_slug: f.tourSlug || null,
    tournament_id: f.tournamentId.trim() || null,
  };
}

/** The shape the reader components take, built from the form as it stands. */
function toPreviewStory(f: Form, existing: AdminStory | null): TourStory {
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
    tour_slug: i.tour_slug,
    tournament_id: i.tournament_id,
    // A draft previews as if it went out NOW, so the relative timestamp reads
    // the way a reader will see it rather than showing a blank.
    published_at: existing?.published_at ?? new Date().toISOString(),
  };
}

export default function WireStoryEditor({
  story,
  onBack,
  onSave,
  onPublish,
  onDelete,
  saving,
}: {
  story: AdminStory | null;
  onBack: () => void;
  onSave: (input: StoryInput) => Promise<void>;
  onPublish: (publishedAt: string | null) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving: boolean;
}) {
  const [f, setF] = React.useState<Form>(() => formFrom(story));
  const [parsed, setParsed] = React.useState<ReturnType<typeof parseStoryText> | null>(null);
  const [confirm, setConfirm] = React.useState<'publish' | 'unpublish' | 'delete' | null>(null);
  const [scheduleAt, setScheduleAt] = React.useState('');

  React.useEffect(() => { setF(formFrom(story)); setParsed(null); }, [story?.id]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  // Slug follows the headline only until the author edits it themselves.
  const autoSlug = slugifyHeadline(f.headline);
  const slug = f.slugTouched ? f.slug : autoSlug;
  const collision = useSlugCollision(slug, story?.id);

  const state = story ? storyState(story) : 'draft';
  const preview = React.useMemo(() => toPreviewStory({ ...f, slug }, story), [f, slug, story]);

  // Names resolve against the database, so parsing is async. The story's own
  // tournament is handed in so a bare `[leaderboard]` can land.
  const parse = async () => {
    const result = await parseAndResolveStoryText(f.sourceText, { tournamentId: f.tournamentId });
    setParsed(result);
    setF((p) => ({ ...p, blocks: result.blocks }));
    if (result.blocks.length === 0) toast.error('Nothing to parse');
    else if (result.unresolved.length > 0) toast.error(`${result.unresolved.length} embed(s) could not be resolved`);
    else toast.success(`${result.blocks.length} blocks parsed`);
  };

  const canSave = f.headline.trim().length > 2 && slug.length > 2 && !saving;

  const save = async () => {
    if (!canSave) { toast.error('A headline and slug are needed'); return; }
    await onSave(toInput({ ...f, slug }));
  };

  /* S1 — AN EMPTY BODY CANNOT GO OUT. The reader's article is body_blocks; a
     story published with none of them renders a headline, a standfirst and
     nothing else, which is what happened to the first four. The gate reads the
     SAVED record, not the form: publishing writes published_at against what is
     in the database, so what is in the database is what has to be checked. A
     parse that has not been saved is therefore still blocked — correctly. */
  const savedBlockCount = story?.body_blocks.length ?? 0;
  const publishBlocked = savedBlockCount === 0;
  /* Text that has never been parsed. This is the exact state of the four broken
     stories and it must not read as a quiet zero. */
  const unparsed = f.sourceText.trim().length > 0 && f.blocks.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Action bar. Save on the left with the work, publishing on the right,
          away from it, because they are different decisions. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={onBack} style={btn()}>
          <ChevronLeft size={14} /> The Wire
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
            {/* The schedule field sits BESIDE Publish, not inside the confirm:
                the author decides the time before committing, not after. */}
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

      <div className="wire-editor-grid">
        {/* ── Left: the work ── */}
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
                '> A quote |— Attribution\n' +
                '[leaderboard]\n' +
                '[player:Scottie Scheffler]'
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
              {parsed && (
                <span style={{ fontSize: 12, color: t.inkMuted }}>
                  {parseSummary(parsed)}
                </span>
              )}
            </div>
            {parsed && parsed.unresolved.length > 0 && (
              <div style={{
                marginTop: 10, padding: '8px 10px', borderRadius: 8,
                background: t.dangerSoft, color: t.dangerText, fontSize: 12, lineHeight: 1.5,
              }}>
                Not saved — these embeds did not resolve:
                {parsed.unresolved.slice(0, 5).map((l, i) => (
                  <div key={i} style={{ fontSize: 11.5, marginTop: 4 }}>{l}</div>
                ))}
              </div>
            )}
            {parsed && parsed.reclassified.length > 0 && (
              <div style={{
                marginTop: 10, padding: '8px 10px', borderRadius: 8,
                background: t.warnSoft, color: t.warnText, fontSize: 12, lineHeight: 1.5,
              }}>
                Read as prose, not as a block — check the syntax:
                {parsed.reclassified.slice(0, 4).map((l, i) => (
                  <div key={i} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, marginTop: 4 }}>{l}</div>
                ))}
              </div>
            )}
          </div>

          <div style={panel}>
            <div style={{ ...KICKER_STYLE, marginBottom: 10 }}>Furniture</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field label="Kicker">
                <input value={f.kicker} onChange={(e) => set('kicker', e.target.value)} placeholder="e.g. THE MASTERS" style={input} />
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
                <div style={{ marginTop: 5, fontSize: 11, color: t.inkFaint }}>/tour/news/{slug || '…'}</div>
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
              <Field label="Tour">
                <select value={f.tourSlug} onChange={(e) => set('tourSlug', e.target.value)} style={{ ...input, appearance: 'none' }}>
                  {TOURS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Tournament" hint="drives the live board card">
                <TournamentPicker value={f.tournamentId} onChange={(v) => set('tournamentId', v)} />
              </Field>
            </div>
          </div>

          <div style={panel}>
            <div style={{ ...KICKER_STYLE, marginBottom: 10 }}>Blocks · {f.blocks.length}</div>
            <WireBlockEditor blocks={f.blocks} onChange={(next) => set('blocks', next)} />
          </div>
        </div>

        {/* ── Right: the reader's view ── */}
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
                <StoryArticle story={preview} />
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
        title={scheduleAt ? 'Schedule for The Wire?' : 'Publish to The Wire?'}
        description={
          scheduleAt
            ? `This story goes live at ${new Date(scheduleAt).toLocaleString()}. Until then it stays invisible to members.`
            : 'This story goes live immediately, on every member\u2019s Tour Hub. Save first if you have unsaved edits.'
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
        description="The story disappears from The Wire and its link stops resolving. Nothing is deleted."
        confirmLabel="Unpublish"
        onConfirm={async () => { await onPublish(null); setConfirm(null); }}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this story?"
        description="This cannot be undone. Unpublish instead if you only want it off the wire."
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

/**
 * Tournament picker. It is a SEARCH, not a dropdown of everything: there are
 * thousands of rows and the author knows the name. Live events sit at the top.
 */
function TournamentPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [term, setTerm] = React.useState('');
  const { data } = useTournamentOptions(term);
  const options = [...(data?.live ?? []), ...(data?.recent ?? [])];
  const selected = options.find((o) => o.id === value);

  return (
    <div>
      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: t.ink, fontWeight: 600 }}>
            {selected?.name ?? value}
          </span>
          <button type="button" onClick={() => onChange('')} style={{ ...btn(), padding: '3px 8px', fontSize: 10 }}>
            Clear
          </button>
        </div>
      )}
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search tournaments"
        style={input}
      />
      {term.trim().length > 1 && (
        <div style={{
          marginTop: 6, maxHeight: 180, overflowY: 'auto',
          border: `1px solid ${t.line}`, borderRadius: 8,
        }}>
          {options.length === 0 && (
            <div style={{ padding: 10, fontSize: 12, color: t.inkFaint }}>No tournaments</div>
          )}
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(o.id); setTerm(''); }}
              style={{
                display: 'flex', width: '100%', alignItems: 'center', gap: 8,
                padding: '8px 10px', background: 'transparent', border: 'none',
                borderBottom: `1px solid ${t.hairline}`, cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ flex: 1, fontSize: 12.5, color: t.ink, minWidth: 0 }}>{o.name}</span>
              {(o.status ?? '').toLowerCase() === 'inprogress' && (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: t.brandText }}>LIVE</span>
              )}
              <span style={{ fontSize: 11, color: t.inkFaint }}>{o.start_date?.slice(0, 10) ?? ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
