/** CB117: qualification/order/count and hidden visibility belong exclusively to
 * get_business_mentions. No client filtering or optimistic mutation. Query keys
 * include viewer and management state to prevent team rows crossing identities.
 * Failed reads suppress even stale payloads; failed writes preserve the rail.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, MoreHorizontal, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { toast } from '@/lib/toast';
import './businessMentions.css';

export interface BusinessMentionPost {
  post_id: string; created_at: string; author_id: string; display_name: string;
  profile_photo_url: string | null; media_type: string; media_url: string | null;
  poster_url: string | null; hidden: boolean;
}
export interface BusinessMentions { count: number; posts: BusinessMentionPost[] }
export function BusinessMentionsRail({ isClub, businessId, viewerId, canManage = false }: {
  isClub: boolean; businessId: string; viewerId?: string; canManage?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<BusinessMentionPost | null>(null);
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ['business-mentions', businessId, viewerId ?? null, canManage],
    enabled: !isClub && !!viewerId, retry: false, staleTime: 60_000,
    queryFn: async (): Promise<BusinessMentions | null> => {
      const { data, error } = await supabase.rpc('get_business_mentions', { p_business_id: businessId });
      if (error) throw error;
      return data as unknown as BusinessMentions | null;
    },
  });
  const toggle = async () => {
    if (!selected || busy || !canManage) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('set_business_mention_hidden', {
        p_business_id: businessId, p_post_id: selected.post_id, p_hidden: !selected.hidden,
      });
      if (error) throw error;
      setSelected(null);
      await q.refetch();
    } catch {
      toast.error(t('business.mentions.error', { defaultValue: 'Something went wrong. Please try again.' }));
    } finally { setBusy(false); }
  };
  if (isClub || !viewerId || q.isPending || q.isError || !q.data?.posts.length) return null;
  return <section data-business-mentions>
    <header className="business-mentions-head">
      <h2>{t('business.mentions.heading', { defaultValue: 'Mentioned by golfers' })}</h2>
      {q.data.count >= 1 && <span className="business-mentions-count" data-mentions-count>{t('business.mentions.posts', { count: q.data.count, defaultValue: q.data.count === 1 ? '1 post' : `${q.data.count} posts` })}</span>}
    </header>
    <div className="business-mentions-rail">
      {q.data.posts.map(post => {
        const video = post.media_type === 'video' || post.media_type === 'clip';
        const image = video ? post.poster_url : post.media_url;
        return <div key={post.post_id} className="business-mention-tile" data-mention-post={post.post_id} data-hidden={post.hidden}>
          <Button variant="ghost" className="business-mention-open" data-mention-open={post.post_id} aria-label={t('business.mentions.open', { name: post.display_name, defaultValue: `Open post by ${post.display_name}` })} onClick={() => navigate(`/post/${post.post_id}`)}>
            {image && <img className="business-mention-image" src={image} alt="" loading="lazy" />}
            <span className="business-mention-gradient" />
            {video && <span className="business-mention-play" data-mention-video aria-hidden><Play /></span>}
            <span className="business-mention-who"><SquircleAvatar size={18} src={post.profile_photo_url} alt={post.display_name} userId={post.author_id} fallback={getInitialsFromName(post.display_name)} hairlineRing /><span className="business-mention-who-name">{post.display_name}</span></span>
          </Button>
          {canManage && <Button variant="ghost" className="business-mention-more" data-mention-menu={post.post_id} title={t('business.mentions.manage', { defaultValue: 'Manage mention' })} aria-label={t('business.mentions.manage', { defaultValue: 'Manage mention' })} onClick={() => setSelected(post)}><MoreHorizontal /></Button>}
          {post.hidden && <span className="business-mention-hidden" data-mention-hidden>{t('business.mentions.hidden', { defaultValue: 'Hidden' })}</span>}
        </div>;
      })}
    </div>
    <BottomSheet open={!!selected && canManage} onClose={() => { if (!busy) setSelected(null); }}>
      <div className="business-mention-sheet" data-mention-sheet>
        <Button variant="ghost" className="business-mention-choice" data-mention-toggle disabled={busy} onClick={() => void toggle()}>
          <span className="business-mention-choice-icon">{selected?.hidden ? <Eye /> : <EyeOff />}</span>
          <span className="business-mention-choice-copy"><b>{t(selected?.hidden ? 'business.mentions.show' : 'business.mentions.hide', { defaultValue: selected?.hidden ? 'Show on our page' : 'Hide from our page' })}</b><small>{t(selected?.hidden ? 'business.mentions.showSub' : 'business.mentions.hideSub', { defaultValue: selected?.hidden ? 'It will show here again.' : "The post stays on clbhouz; it just won't show here." })}</small></span>
        </Button>
        <Button variant="ghost" className="business-mention-cancel" disabled={busy} onClick={() => setSelected(null)}>{t('business.mentions.cancel', { defaultValue: 'Cancel' })}</Button>
      </div>
    </BottomSheet>
  </section>;
}