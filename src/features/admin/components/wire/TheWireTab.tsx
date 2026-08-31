/**
 * The Wire — admin list.
 *
 * DRAFTS SIT AT THE TOP with the live stories rather than in a separate bucket:
 * a two-list layout hides the unfinished work, and unfinished work is exactly
 * what needs to be seen on opening the tab.
 *
 * Each row states the ONE thing that matters about a story — whether a reader
 * can see it — as a pill, and everything else is secondary.
 */
import React from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/lib/toast';
import { adminTheme as t } from '../../theme';
import StatusPill from '../StatusPill';
import EmptyState from '../EmptyState';
import WireStoryEditor from './WireStoryEditor';
import {
  storyState,
  useTourStoriesAdmin,
  type AdminStory,
  type StoryInput,
} from '../../hooks/useTourStoriesAdmin';

const KICKER_STYLE: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
  textTransform: 'uppercase', color: t.inkFaint,
};

function when(s: AdminStory): string {
  const at = s.published_at ?? s.created_at;
  try {
    return formatDistanceToNow(new Date(at), { addSuffix: true });
  } catch {
    return '';
  }
}

export default function TheWireTab() {
  const { stories, isLoading, create, update, setPublishedAt, remove } = useTourStoriesAdmin();
  /** null = list, 'new' = a story not yet created, otherwise an id. */
  const [editing, setEditing] = React.useState<string | null>(null);

  const current = editing && editing !== 'new' ? stories.find((s) => s.id === editing) ?? null : null;

  if (editing) {
    const saving = create.isPending || update.isPending;
    return (
      <WireStoryEditor
        story={current}
        saving={saving}
        onBack={() => setEditing(null)}
        onSave={async (input: StoryInput) => {
          try {
            if (current) {
              await update.mutateAsync({ id: current.id, patch: input });
              toast.success('Story saved');
            } else {
              const made = await create.mutateAsync(input);
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
            toast.success(publishedAt ? 'On the wire' : 'Back to draft');
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
        <div style={KICKER_STYLE}>{stories.length} stories</div>
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
        <EmptyState title="Nothing on the wire" body="Write the first story and it appears on every member’s Tour Hub." />
      )}

      {stories.length > 0 && (
        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius.lg, overflow: 'hidden' }}>
          {stories.map((s, i) => {
            const state = storyState(s);
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
                  </div>
                </button>
                <StatusPill tone={state === 'published' ? 'ok' : state === 'scheduled' ? 'brand' : 'neutral'}>
                  {state === 'published' ? 'Live' : state === 'scheduled' ? 'Scheduled' : 'Draft'}
                </StatusPill>
                {state === 'published' && (
                  <a
                    href={`/tour/news/${s.slug}`}
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
