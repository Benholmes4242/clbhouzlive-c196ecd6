/**
 * The block list, AFTER parsing. This is the CORRECTION pass, not the authoring
 * pass — Ben authors in the paste box and comes here to fix the one image url
 * the parser read wrongly or to move a quote up two places.
 *
 * Every block therefore gets the same four controls in the same place: move up,
 * move down, insert below, delete. Consistency beats cleverness when the tool is
 * used three times a week under time pressure.
 */
import React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { StoryBlock } from '@/features/tourhub/news/blocks';
import { adminTheme as t } from '../../theme';

const TYPE_LABEL: Record<StoryBlock['type'], string> = {
  paragraph: 'Paragraph',
  heading: 'Heading',
  image: 'Image',
  quote: 'Quote',
  leaderboard: 'Leaderboard',
  player: 'Player',
  stat: 'Season stats',
  round: 'Tournament week',
};

const INSERTABLE: StoryBlock['type'][] = [
  'paragraph', 'heading', 'image', 'quote', 'leaderboard', 'player', 'stat', 'round',
];

function blankBlock(type: StoryBlock['type']): StoryBlock {
  switch (type) {
    case 'heading': return { type: 'heading', text: '' };
    case 'image': return { type: 'image', url: '', caption: null, credit: null };
    case 'quote': return { type: 'quote', text: '', attribution: null };
    case 'leaderboard': return { type: 'leaderboard', tournament_id: '' };
    case 'player': return { type: 'player', player_id: '' };
    case 'stat': return { type: 'stat', player_id: '' };
    case 'round': return { type: 'round', player_id: '', tournament_id: '' };
    default: return { type: 'paragraph', text: '' };
  }
}


const input: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: `1px solid ${t.line}`, background: t.canvas, color: t.ink,
  fontSize: 13, outline: 'none', fontFamily: 'inherit',
};

const iconBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7, border: `1px solid ${t.line}`,
  background: t.surface, color: t.inkMuted,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

export function WireBlockEditor({
  blocks,
  onChange,
}: {
  blocks: StoryBlock[];
  onChange: (next: StoryBlock[]) => void;
}) {
  const replace = (i: number, b: StoryBlock) => {
    const next = blocks.slice();
    next[i] = b;
    onChange(next);
  };
  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(blocks.filter((_, k) => k !== i));
  const insertAfter = (i: number, type: StoryBlock['type']) => {
    const next = blocks.slice();
    next.splice(i + 1, 0, blankBlock(type));
    onChange(next);
  };

  if (blocks.length === 0) {
    return (
      <div style={{ fontSize: 13, color: t.inkFaint, padding: '10px 2px' }}>
        No blocks yet. Paste the story above and press Parse, or add a block.
        <div style={{ marginTop: 8 }}>
          <InsertRow onInsert={(type) => onChange([blankBlock(type)])} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {blocks.map((b, i) => (
        <div
          key={i}
          style={{
            background: t.surface, border: `1px solid ${t.line}`,
            borderRadius: t.radius.md, padding: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: t.inkFaint,
            }}>
              {i + 1} · {TYPE_LABEL[b.type]}
            </span>
            <div style={{ flex: 1 }} />
            <button type="button" title="Move up" onClick={() => move(i, -1)} style={iconBtn}><ArrowUp size={14} /></button>
            <button type="button" title="Move down" onClick={() => move(i, 1)} style={iconBtn}><ArrowDown size={14} /></button>
            <button type="button" title="Delete block" onClick={() => remove(i)} style={{ ...iconBtn, color: t.danger }}>
              <Trash2 size={14} />
            </button>
          </div>

          {(b.type === 'paragraph' || b.type === 'heading') && (
            <textarea
              value={b.text}
              onChange={(e) => replace(i, { ...b, text: e.target.value })}
              rows={b.type === 'heading' ? 1 : 3}
              style={{ ...input, resize: 'vertical', lineHeight: 1.5 }}
            />
          )}

          {b.type === 'image' && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <ImageThumb url={b.url} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <input value={b.url} placeholder="Image URL" onChange={(e) => replace(i, { ...b, url: e.target.value })} style={input} />
                <input value={b.caption ?? ''} placeholder="Caption" onChange={(e) => replace(i, { ...b, caption: e.target.value || null })} style={input} />
                <input value={b.credit ?? ''} placeholder="Credit" onChange={(e) => replace(i, { ...b, credit: e.target.value || null })} style={input} />
              </div>
            </div>
          )}

          {b.type === 'quote' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea value={b.text} rows={2} onChange={(e) => replace(i, { ...b, text: e.target.value })} style={{ ...input, resize: 'vertical' }} />
              <input value={b.attribution ?? ''} placeholder="Attribution" onChange={(e) => replace(i, { ...b, attribution: e.target.value || null })} style={input} />
            </div>
          )}

          {b.type === 'leaderboard' && (
            <input
              value={b.tournament_id}
              placeholder="Tournament id"
              onChange={(e) => replace(i, { ...b, tournament_id: e.target.value.trim() })}
              style={{ ...input, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            />
          )}

          {(b.type === 'player' || b.type === 'stat') && (
            <input
              value={b.player_id}
              placeholder="Player id"
              onChange={(e) => replace(i, { ...b, player_id: e.target.value.trim() })}
              style={{ ...input, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            />
          )}

          {b.type === 'round' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                value={b.player_id}
                placeholder="Player id"
                onChange={(e) => replace(i, { ...b, player_id: e.target.value.trim() })}
                style={{ ...input, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
              />
              <input
                value={b.tournament_id}
                placeholder="Tournament id"
                onChange={(e) => replace(i, { ...b, tournament_id: e.target.value.trim() })}
                style={{ ...input, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
              />
            </div>
          )}


          <div style={{ marginTop: 8 }}>
            <InsertRow onInsert={(type) => insertAfter(i, type)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InsertRow({ onInsert }: { onInsert: (type: StoryBlock['type']) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <Plus size={12} color={t.inkFaint} aria-hidden />
      {INSERTABLE.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onInsert(type)}
          style={{
            padding: '3px 8px', borderRadius: 999, border: `1px solid ${t.line}`,
            background: 'transparent', color: t.inkMuted, cursor: 'pointer',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
        >
          {TYPE_LABEL[type]}
        </button>
      ))}
    </div>
  );
}

/**
 * A url is only an image if it LOADS as one. A 200 that returns HTML is the
 * common failure with a copied page url, and only the browser can tell us.
 */
export function ImageThumb({ url, size = 64 }: { url: string | null; size?: number }) {
  const [state, setState] = React.useState<'idle' | 'ok' | 'bad'>('idle');
  React.useEffect(() => { setState('idle'); }, [url]);

  const box: React.CSSProperties = {
    width: size, height: size, borderRadius: 8, flexShrink: 0,
    border: `1px solid ${state === 'bad' ? t.danger : t.line}`,
    background: t.canvas, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: state === 'bad' ? t.dangerText : t.inkFaint, textAlign: 'center',
  };

  if (!url?.trim()) return <div style={box}>No url</div>;

  return (
    <div style={box}>
      <img
        src={url}
        alt=""
        onLoad={() => setState('ok')}
        onError={() => setState('bad')}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          display: state === 'bad' ? 'none' : 'block',
        }}
      />
      {state === 'bad' && <span>Broken</span>}
    </div>
  );
}
