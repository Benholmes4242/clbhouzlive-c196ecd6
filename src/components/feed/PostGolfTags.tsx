/** Feed-card pieces for the golf post page: the "with …" author line, the
 * per-slide course tag chip and a tagged member's "Remove me". Data arrives
 * batched from the host feed (usePostGolfTags); nothing here reads per card,
 * except Remove me's own delete.
 */
import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BottomSheet from '@/features/post-v2/components/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { slideChip, withLine, type SlideTag } from '@/features/post-v2/lib/golfPostRules';
import { removeMeFromPost } from '@/features/post-v2/lib/postWith';
import { toast } from '@/lib/toast';

const WITH_COLOUR = 'rgba(248,250,252,0.62)';

export function PostWithLine({ people }: { people: ReadonlyArray<{ userId: string; name: string; avatarUrl?: string | null }> }) {
  const [open, setOpen] = useState(false);
  const text = withLine(people.map((p) => p.name));
  if (!text) return null;
  const style: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: WITH_COLOUR, whiteSpace: 'nowrap', flexShrink: 0, background: 'transparent', border: 0, padding: 0 };
  if (people.length < 3) return <span data-testid="post-with-line" style={style}>{text}</span>;
  return (
    <>
      <button type="button" data-testid="post-with-line" onClick={(e) => { e.stopPropagation(); setOpen(true); }} style={{ ...style, cursor: 'pointer' }}>{text}</button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Played with">
        <div role="list" style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {people.map((p) => (
            <div role="listitem" key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SquircleAvatar src={p.avatarUrl ?? null} alt={p.name} userId={p.userId} size={32} hairlineRing />
              <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
            </div>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

export function SlideTagChip({ tag }: { tag: SlideTag | null | undefined }) {
  const label = slideChip(tag);
  if (!label) return null;
  return (
    <span
      data-testid="slide-tag-chip"
      style={{
        position: 'absolute', left: 12, bottom: 12, zIndex: 4, height: 28, padding: '0 10px', borderRadius: 999,
        background: 'rgba(10,10,12,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700, color: '#F8FAFC',
        display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none',
      }}
    >{label}</span>
  );
}

export function RemoveMeMenu({ postId, memberId }: { postId: string; memberId: string }) {
  const qc = useQueryClient();
  const remove = async () => {
    try {
      await removeMeFromPost(postId, memberId);
      qc.invalidateQueries({ queryKey: ['post-golf-tags'] });
      toast.success('Removed from this post');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "You couldn't be removed from this post.");
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Post options" onClick={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 0, padding: 0, color: WITH_COLOUR, cursor: 'pointer', display: 'flex' }}>
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => void remove()}>Remove me</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
