/**
 * Amateur News — admin list. The Wire tab's structure against the amateur
 * table: drafts sit at the top with the live stories, and each row states the
 * one thing that matters — whether a reader can see it.
 */
import React from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/lib/toast';
import { adminTheme as t } from '../../theme';
import StatusPill from '../StatusPill';
import EmptyState from '../EmptyState';
import AmateurStoryEditor from './AmateurStoryEditor';
import { categoriesLine } from '@/features/amateur/news/categories';
import {
  useAmateurStoriesAdmin,
  type AdminAmateurStory,
  type AmateurStoryInput,
} from '../../hooks/useAmateurStoriesAdmin';

const KICKER_STYLE: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
  textTransform: 'uppercase', color: t.inkFaint,
};

function stateOf(s: AdminAmateurStory): 'draft' | 'scheduled' | 'published' {
  if (!s.published_at) return 'draft';
  return new Date(s.published_at).getTime() > Date.now() ? 'scheduled' : 'published';
}

function when(s: AdminAmateurStory): string {
  const at = s.published_at ?? s.created_at;
  try {
    return formatDistanceToNow(new Date(at), { addSuffix: true });
  } catch {
    return '';
  }
}

export default function AmateurNewsTab() {
  const { stories, isLoading, create, update, setPublishedAt, remove } = useAmateurStoriesAdmin();
  const [editing, setEditing] = React.useState<string | null>(null);

  const current = editing && editing !== 'new' ? stories.find((s) => s.id === editing) ?? null : null;

  if (editing) {
    const saving = create.isPending || update.isPending;
    return (
      <AmateurStoryEditor
        story={current}
        saving={saving}
        onBack={() => setEditing(null)}
        onSave={async (inputValue: AmateurStoryInput) => {
          try {
            if (current) {
              await update.mutateAsync({ id: current.id, patch: inputValue });
              toast.success('Story saved');
            } else {
              const made = await create.mutateAsync(inputValue);
              setEditing(made.id);
              toast.success('Draft created');
            }
          } catch (e: any) {
            toast.error(e?.message ?? 'Could not save');
          }
        }}
        onPublish={async (publishedAt) => {
          if (!current) { toast.error('Create the draft first'); return; }
          try {
            await setPublishedAt.mutateAsync({ id: current.id, publishedAt });
            toast.success(publishedAt ? 'Published' : 'Back to draft');
          } catch (e: any) {
            toast.error(e?.message ?? 'Could not publish');
          }
        }}
        onDelete={current ? async () => {
          try {
            await remove.mutateAsync(current.id);
            setEditing(null);
            toast.success('Story deleted');
          } catch (e: any) {
            toast.error(e?.message ?? 'Could not delete');
          }
        } : undefined}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={KICKER_STYLE}>{stories.length} amateur stories</div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setEditing('new')}
          style={{
            padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${t.brand}`, background: t.brand, color: '#0A0D12',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={14} /> New story
        </button>
      </div>

      {isLoading && <div style={{ fontSize: 13, color: t.inkFaint }}>Loading…</div>}

      {!isLoading && stories.length === 0 && (
        <EmptyState
          title="No amateur news yet"
          subtitle="Write the first story and it appears in every member’s Discover."
        />
      )}

      {stories.length > 0 && (
        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius.lg, overflow: 'hidden' }}>
          {stories.map((s, i) => {
            const state = stateOf(s);
            const tags = [categoriesLine(s.categories), s.tournament_name ?? ''].filter(Boolean).join(' · ');
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
                  borderTop: i === 0 ? 'none' : `1px solid ${t.hairline}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditing(s.id)}
                  style={{
                    flex: 1, minWidth: 0, textAlign: 'left', background: 'transparent',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  {s.kicker && <div style={{ ...KICKER_STYLE, marginBottom: 3 }}>{s.kicker}</div>}
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: t.ink, lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.headline}
                  </div>
                  <div style={{ marginTop: 3, fontSize: 11, color: t.inkFaint }}>
                    {when(s)} · {s.body_blocks.length} blocks{s.image_url ? '' : ' · no image'}
                    {tags ? ` · ${tags}` : ''}
                  </div>
                  {s.body_blocks.length === 0 && (
                    <div style={{ marginTop: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: t.dangerText }}>
                      {(s.source_text ?? '').trim() ? 'NO BODY — NEVER PARSED' : 'NO BODY'}
                    </div>
                  )}
                </button>
                <StatusPill tone={state === 'published' ? 'ok' : state === 'scheduled' ? 'brand' : 'neutral'}>
                  {state === 'published' ? 'Live' : state === 'scheduled' ? 'Scheduled' : 'Draft'}
                </StatusPill>
                {state === 'published' && (
                  <a
                    href={`/discover/news/${s.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Open on the site"
                    style={{ color: t.inkFaint, display: 'inline-flex', padding: 4 }}
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
