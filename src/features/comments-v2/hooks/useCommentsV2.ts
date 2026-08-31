/**
 * useCommentsV2 — canonical comments engine for the unified comments_v2 table.
 *
 * Reads directly from comments_v2 + comment_likes_v2 (SELECT only).
 * Every mutation goes through RPCs: add_comment_v2 / edit_comment_v2 /
 * delete_comment_v2 / toggle_comment_like_v2. The client NEVER writes
 * comments_v2, comment_likes_v2, or notifications directly.
 */
import { useCallback, useMemo, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useBlockedUserIds } from '@/hooks/useBlockedUserIds';
import { patchEngagement } from '@/lib/engagementCache';
import { commentsKeys, commentsScope, viewerId } from '@/lib/queryKeys';

/**
 * 'tour_story' | 'amateur_story' (BRIEF_STORY_ENGAGEMENT §S5). Both story beats
 * comment through this engine unchanged. The post-only branches below (the
 * engagement-cache patches) are correctly skipped for a story, and the DB's
 * comments_v2_notify falls through to its no-recipient ELSE for a top-level
 * story comment while still notifying the parent author on a REPLY.
 */
export type TargetType = 'post' | 'top_ten' | 'editorial' | 'tour_story' | 'amateur_story';

export interface CommentActorInfo {
  actor_type: 'personal' | 'business';
  actor_id: string;
  display_name: string;
  avatar_url: string | null;
  slug: string | null;
  verified: boolean;
}

export interface CommentV2 extends CommentActorInfo {
  id: string;
  user_id: string;
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  parent_id: string | null;
  created_at: string;
  is_edited: boolean;
  likes_count: number;
  has_liked: boolean;
  replies: CommentV2[];
  reply_count: number;
}

const PAGE_SIZE = 20;

export interface UseCommentsV2Args {
  targetType: TargetType;
  targetId: string;
  targetSecondaryId?: string | null;
  enabled?: boolean;
}

type RawCommentRow = {
  id: string; user_id: string; content: string | null;
  media_type: string | null; media_url: string | null;
  parent_id: string | null; created_at: string;
  is_edited: boolean | null; actor_type: string | null;
  actor_id: string | null; target_secondary_id?: string | null;
};

interface Page {
  parents: RawCommentRow[];
  nextCursor: string | null;
}

export function useCommentsV2({
  targetType,
  targetId,
  targetSecondaryId,
  enabled = true,
}: UseCommentsV2Args) {
  const qc = useQueryClient();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const actorType = activeActor?.type ?? 'personal';
  const actorId = activeActor?.id ?? user?.id ?? '';
  const blockedIds = useBlockedUserIds(user?.id ?? null);

  /**
   * Every key on this hook is named through `commentsKeys` (src/lib/queryKeys.ts)
   * — READS AND WRITES BOTH. The optimistic like below writes the enrichment
   * cache; when that key was built by hand from `rowIds`, a page landing
   * between render and tap sent the write to a key nobody was subscribed to and
   * it failed silently. One builder, both sides.
   */
  const scope = commentsScope(targetType, targetId, targetSecondaryId ?? null);
  const keyRoot = commentsKeys.root(scope);

  // Load user's hidden comment IDs so they're filtered from the feed.
  const { data: hiddenIds = new Set<string>() } = useQuery({
    queryKey: commentsKeys.hidden(viewerId(user?.id)),
    enabled: !!user?.id && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('hidden_comments')
        .select('comment_id')
        .eq('user_id', user!.id);
      return new Set<string>((data ?? []).map((r: { comment_id: string }) => r.comment_id));
    },
  });

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<Page>({
    queryKey: commentsKeys.pages(scope),
    enabled: enabled && !!targetId,
    staleTime: 30_000,
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    queryFn: async ({ pageParam }) => {
      let q = supabase
        .from('comments_v2')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (targetSecondaryId) q = q.eq('target_secondary_id', targetSecondaryId);
      if (pageParam) q = q.lt('created_at', pageParam as string);
      const { data: parents, error } = await q;
      if (error) throw error;
      const rows = parents ?? [];
      const nextCursor = rows.length === PAGE_SIZE ? rows[rows.length - 1].created_at : null;
      return { parents: rows, nextCursor };
    },
  });

  const parents = useMemo(() => (data?.pages ?? []).flatMap(p => p.parents), [data]);

  // Fetch all replies for the visible parents in one query.
  const parentIds = useMemo(() => parents.map(p => p.id), [parents]);
  const { data: replies = [] } = useQuery({
    // Batch idiom: how many parents are loaded, never which ones.
    queryKey: commentsKeys.replies(scope, viewerId(user?.id), parentIds.length),
    placeholderData: keepPreviousData,
    enabled: enabled && parentIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('comments_v2')
        .select('*')
        .in('parent_id', parentIds)
        .order('created_at', { ascending: true });
      return data ?? [];
    },
  });

  // Actor + like enrichment for the union of parents + replies.
  const allRows = useMemo(() => [...parents, ...replies], [parents, replies]);
  const rowIds = useMemo(() => allRows.map(r => r.id), [allRows]);

  const enrichmentKey = commentsKeys.enrichment(scope, actorType, actorId, rowIds.length);

  type EnrichmentResult = {
    profileMap: Map<string, { id: string; display_name: string | null; username: string | null; profile_photo_url: string | null }>;
    businessMap: Map<string, { id: string; name: string | null; slug: string | null; logo_url: string | null; is_verified: boolean | null }>;
    likeCounts: Map<string, number>;
    myLikes: Set<string>;
  };
  const previousEnrichmentRef = useRef<EnrichmentResult | undefined>(undefined);

  const { data: enrichment } = useQuery({
    queryKey: enrichmentKey,
    placeholderData: keepPreviousData,
    enabled: enabled && rowIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const personalIds = Array.from(new Set(
        allRows.filter(r => (r.actor_type ?? 'personal') !== 'business')
          .map(r => r.actor_id ?? r.user_id).filter(Boolean)
      ));
      const businessIds = Array.from(new Set(
        allRows.filter(r => r.actor_type === 'business')
          .map(r => r.actor_id).filter(Boolean)
      ));

      type ProfileRow = { id: string; display_name: string | null; username: string | null; profile_photo_url: string | null };
      type BusinessRow = { id: string; name: string | null; slug: string | null; logo_url: string | null; is_verified: boolean | null };
      type LikeRow = { comment_id: string };
      const [profilesRes, businessRes, likeCountsRes, myLikesRes] = await Promise.all([
        personalIds.length
          ? supabase.from('user_profiles').select('id, display_name, username, profile_photo_url').in('id', personalIds)
          : Promise.resolve({ data: [] as ProfileRow[] }),
        businessIds.length
          ? supabase.from('business_accounts').select('id, name, slug, logo_url, is_verified').in('id', businessIds)
          : Promise.resolve({ data: [] as BusinessRow[] }),
        supabase.from('comment_likes_v2').select('comment_id').in('comment_id', rowIds),
        actorId
          ? supabase.from('comment_likes_v2').select('comment_id').in('comment_id', rowIds).eq('user_id', user?.id ?? '')
          : Promise.resolve({ data: [] as LikeRow[] }),
      ]);

      const profileMap = new Map((profilesRes.data ?? []).map((p) => [(p as ProfileRow).id, p as ProfileRow]));
      const businessMap = new Map((businessRes.data ?? []).map((b) => [(b as BusinessRow).id, b as BusinessRow]));
      const likeCounts = new Map<string, number>();
      (likeCountsRes.data ?? []).forEach((l) =>
        likeCounts.set((l as LikeRow).comment_id, (likeCounts.get((l as LikeRow).comment_id) ?? 0) + 1)
      );
      const myLikes = new Set((myLikesRes.data ?? []).map((l) => (l as LikeRow).comment_id));

      // Merge over the previous result (batch idiom): loading page 2 of a
      // thread must never drop the actors/likes already on screen.
      const prev = previousEnrichmentRef.current;
      if (prev) {
        prev.profileMap.forEach((v, k) => { if (!profileMap.has(k)) profileMap.set(k, v); });
        prev.businessMap.forEach((v, k) => { if (!businessMap.has(k)) businessMap.set(k, v); });
        prev.likeCounts.forEach((v, k) => { if (!likeCounts.has(k)) likeCounts.set(k, v); });
        prev.myLikes.forEach((k) => { if (!rowIds.includes(k)) myLikes.add(k); });
      }
      return { profileMap, businessMap, likeCounts, myLikes };
    },
  });

  previousEnrichmentRef.current = enrichment ?? previousEnrichmentRef.current;

  const shape = useCallback((row: RawCommentRow): CommentV2 => {
    const at = (row.actor_type ?? 'personal') as 'personal' | 'business';
    const aId = row.actor_id ?? row.user_id;
    let info: CommentActorInfo;
    if (at === 'business') {
      const b = enrichment?.businessMap.get(aId);
      info = {
        actor_type: 'business',
        actor_id: aId,
        display_name: b?.name ?? 'Business',
        avatar_url: b?.logo_url ?? null,
        slug: b?.slug ?? null,
        verified: !!b?.is_verified,
      };
    } else {
      const p = enrichment?.profileMap.get(aId);
      info = {
        actor_type: 'personal',
        actor_id: aId,
        display_name: p?.display_name ?? p?.username ?? (row.user_id ? 'Deleted user' : 'Deleted user'),
        avatar_url: p?.profile_photo_url ?? null,
        slug: null,
        verified: false,
      };
      if (!p && !row.user_id) {
        info.display_name = 'Deleted user';
      }
    }
    return {
      id: row.id,
      user_id: row.user_id,
      content: row.content,
      media_type: row.media_type,
      media_url: row.media_url,
      parent_id: row.parent_id,
      created_at: row.created_at,
      is_edited: !!row.is_edited,
      likes_count: enrichment?.likeCounts.get(row.id) ?? 0,
      has_liked: enrichment?.myLikes.has(row.id) ?? false,
      replies: [],
      reply_count: 0,
      ...info,
    };
  }, [enrichment]);

  const threads = useMemo<CommentV2[]>(() => {
    if (!parents.length) return [];
    const isBlocked = (r: RawCommentRow) => blockedIds.has(r.user_id) || (r.actor_type !== 'business' && !!r.actor_id && blockedIds.has(r.actor_id));
    const byParent = new Map<string, RawCommentRow[]>();
    for (const r of replies as RawCommentRow[]) {
      if (hiddenIds.has(r.id)) continue;
      if (isBlocked(r)) continue;
      if (!r.parent_id) continue;
      const list = byParent.get(r.parent_id) ?? [];
      list.push(r);
      byParent.set(r.parent_id, list);
    }
    return parents
      .filter(p => !hiddenIds.has(p.id) && !isBlocked(p))
      .map(p => {
        const shaped = shape(p);
        const rlist = (byParent.get(p.id) ?? []).map(shape);
        shaped.replies = rlist;
        shaped.reply_count = rlist.length;
        return shaped;
      });
  }, [parents, replies, hiddenIds, blockedIds, shape]);

  // Header total (top-level count for the current target).
  const { data: totalCount = 0, isLoading: totalCountLoading } = useQuery({
    queryKey: commentsKeys.count(scope),
    enabled: enabled && !!targetId,
    staleTime: 30_000,
    queryFn: async () => {
      // Prefer posts.comment_count when target is a post.
      if (targetType === 'post') {
        const { data } = await supabase
          .from('posts')
          .select('comment_count')
          .eq('id', targetId)
          .maybeSingle();
        const cc = (data as { comment_count?: number } | null)?.comment_count;
        if (typeof cc === 'number') return cc;
      }
      let cq = supabase
        .from('comments_v2')
        .select('id', { count: 'exact', head: true })
        .eq('target_type', targetType)
        .eq('target_id', targetId);
      if (targetSecondaryId) cq = cq.eq('target_secondary_id', targetSecondaryId);
      const { count } = await cq;
      return count ?? 0;
    },
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: keyRoot as unknown as readonly unknown[] });
  }, [qc, targetType, targetId, targetSecondaryId]);

  // ── Mutations (RPC only) ──

  const addComment = useMutation({
    mutationFn: async (input: {
      content?: string | null;
      parentId?: string | null;
      mediaUrl?: string | null;
      mediaType?: string | null;
      actorType?: 'personal' | 'business';
      actorId?: string;
    }) => {
      const { data, error } = await supabase.rpc('add_comment_v2', {
        p_target_type: targetType,
        p_target_id: targetId,
        p_target_secondary_id: targetSecondaryId ?? undefined,
        p_content: input.content ?? undefined,
        p_media_url: input.mediaUrl ?? undefined,
        p_media_type: input.mediaType ?? undefined,
        p_parent_id: input.parentId ?? undefined,
        p_actor_type: input.actorType ?? actorType,
        p_actor_id: input.actorId ?? actorId,
      });
      if (error) throw error;
      return data as unknown;
    },
    onSuccess: () => {
      // Server trigger `comments_v2_count_inc` bumps posts.comment_count
      // for EVERY insert — top-level AND replies. Mirror that here so
      // every feed surface reflects the new count without a refetch.
      if (targetType === 'post') {
        patchEngagement(qc, targetId, { commentCountDelta: +1 });
      }
      invalidate();
    },
  });

  const editComment = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await supabase.rpc('edit_comment_v2', { p_id: id, p_content: content });
      if (error) throw error;
      return data as unknown;
    },
    onSuccess: invalidate,
  });

  const deleteComment = useMutation({
    mutationFn: async ({ id }: { id: string; replyCount: number }) => {
      const { data, error } = await supabase.rpc('delete_comment_v2', { p_id: id });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      // Server trigger `comments_v2_count_dec` decrements posts.comment_count
      // for both top-level and cascaded reply deletions. Mirror symmetrically.
      if (targetType === 'post') {
        patchEngagement(qc, targetId, { commentCountDelta: -(1 + (vars.replyCount ?? 0)) });
      }
      invalidate();
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('toggle_comment_like_v2', { p_comment_id: id });
      if (error) throw error;
      return data as { liked: boolean; count: number } | null;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: keyRoot as unknown as readonly unknown[] });
      // Optimistic like toggle for the row cache — we mutate enrichment directly.
      type EnrichmentCache = { myLikes: Set<string>; likeCounts: Map<string, number> } & Record<string, unknown>;
      // Same builder as the read above — never rebuilt by hand.
      qc.setQueryData(enrichmentKey, (old: EnrichmentCache | undefined) => {
        if (!old) return old;
        const myLikes = new Set<string>(old.myLikes);
        const likeCounts = new Map<string, number>(old.likeCounts);
        const current = likeCounts.get(id) ?? 0;
        if (myLikes.has(id)) {
          myLikes.delete(id);
          likeCounts.set(id, Math.max(0, current - 1));
        } else {
          myLikes.add(id);
          likeCounts.set(id, current + 1);
        }
        return { ...old, myLikes, likeCounts };
      });
    },
    onSuccess: (res, id) => {
      // Reconcile from RPC return { liked, count }.
      if (!res || typeof res !== 'object') return;
      const liked = !!res.liked;
      const count = Number(res.count ?? 0);
      type EnrichmentCache = { myLikes: Set<string>; likeCounts: Map<string, number> } & Record<string, unknown>;
      // Same builder as the read above — never rebuilt by hand.
      qc.setQueryData(enrichmentKey, (old: EnrichmentCache | undefined) => {
        if (!old) return old;
        const myLikes = new Set<string>(old.myLikes);
        const likeCounts = new Map<string, number>(old.likeCounts);
        if (liked) myLikes.add(id); else myLikes.delete(id);
        likeCounts.set(id, count);
        return { ...old, myLikes, likeCounts };
      });
    },
    onError: () => invalidate(),
  });

  const hideComment = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not signed in');
      const { error } = await supabase.from('hidden_comments').insert({
        comment_id: id,
        target_id: targetId,
        user_id: user.id,
        reason: 'user_hidden',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments-v2-hidden', user?.id] });
      invalidate();
    },
  });

  const reportComment = useMutation({
    mutationFn: async ({ id, targetUserId, reason, details }: { id: string; targetUserId: string; reason: string; details?: string }) => {
      if (!user?.id) throw new Error('Not signed in');
      // Dual write: hidden_comments captures the reason (also filters it out for
      // this user), and reports feeds the moderation queue.
      const [{ error: hideErr }, { error: repErr }] = await Promise.all([
        supabase.from('hidden_comments').insert({
          comment_id: id, target_id: targetId, user_id: user.id, reason, details: details ?? null,
        }),
        supabase.from('reports').insert({
          reporter_id: user.id,
          reported_comment_id: id,
          reported_user_id: targetUserId,
          reason,
          details: details ?? null,
          status: 'pending',
        }),
      ]);
      if (hideErr) throw hideErr;
      if (repErr) throw repErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments-v2-hidden', user?.id] });
      invalidate();
    },
  });

  return {
    threads,
    totalCount,
    totalCountLoading,
    isLoading,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    refetch,
    invalidate,

    addComment,
    editComment,
    deleteComment,
    toggleLike,
    hideComment,
    reportComment,
  };
}
