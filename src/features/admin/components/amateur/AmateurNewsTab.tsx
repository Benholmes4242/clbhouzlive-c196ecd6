/**
 * Amateur News — admin list. The Wire's list, over amateur_stories.
 *
 * Two publish faults are named IN THE ROW, before it is opened: a story with no
 * body and a story with no category can both be saved but neither can go live.
 */
import React from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/lib/toast';

import { categoryLabel } from '@/features/amateur/news/categories';
import { adminTheme as t } from '../../theme';
import StatusPill from '../StatusPill';
import EmptyState from '../EmptyState';
import AmateurStoryEditor from './AmateurStoryEditor';
import {
  amateurStoryState,
  useAmateurStoriesAdmin,
  type AdminAmateurStory,
  type AmateurStoryInput,
} from '../../hooks/useAmateurStoriesAdmin';

const KICKER_STYLE: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
  textTransform: 'uppercase', color: t.inkFaint,
};

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
    return (
      <AmateurStoryEditor
        story={current}
        saving={create.isPending || update.isPending}
        onBack={() => setEditing(null)}
        onSave={async (input: AmateurStoryInput) => {
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
        <EmptyState
          title="No amateur stories yet"
          subtitle="Write the first one and it appears on Discover and on Amateur News."
        />
      )}

      {stories.length > 0 && (
        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius.lg, overflow: 'hidden' }}>
          {stories.map((s, i) => {
            const state = amateurStoryState(s);
            const faults: string[] = [];
            if (s.body_blocks.length === 0) faults.push((s.source_text ?? '').trim() ? 'NO BODY — NEVER PARSED' : 'NO BODY');
            if (s.categories.length === 0) faults.push('NO CATEGORY');
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
                    {s.categories.length > 0 && ` · ${s.categories.map((c) => categoryLabel(c)).join(', ')}`}
                  </div>
                  {faults.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: t.dangerText }}>
                      {faults.join(' · ')}
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
