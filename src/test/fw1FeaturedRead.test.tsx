import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
const f=vi.hoisted(() => ({rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',() => ({supabase:{rpc:f.rpc}}));
import { useWatchFeatured } from '@/features/explore-magazine/watch/useWatchFeatured';
import { patchEngagement } from '@/lib/engagementCache';
const clients:QueryClient[]=[];
function setup() {const client=new QueryClient();clients.push(client);const wrapper=({children}:{children:React.ReactNode}) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;return {client,wrapper};}
afterEach(() => {cleanup();clients.splice(0).forEach(c => c.clear());vi.clearAllMocks();});
describe('FW1 featured read',() => {
  it('asks for eight and holds order across remounts in the same session',async () => {const data=[{post_id:'a'},{post_id:'b'},{post_id:'c'}];f.rpc.mockResolvedValue({data,error:null});const {client,wrapper}=setup();const first=renderHook(() => useWatchFeatured('me'),{wrapper});await waitFor(() => expect(first.result.current.isSuccess).toBe(true));first.unmount();const second=renderHook(() => useWatchFeatured('me'),{wrapper});expect(second.result.current.data).toEqual(data);expect(f.rpc).toHaveBeenCalledExactlyOnceWith('get_watch_featured',{p_limit:8});const query=client.getQueryCache().find({queryKey:['watch','featured','me']});expect(query && 'staleTime' in query.options ? query.options.staleTime : undefined).toBe(Infinity);expect(query?.options.gcTime).toBe(Infinity);});
  it('does not grant guests a new read',() => {const {wrapper}=setup();renderHook(() => useWatchFeatured(undefined),{wrapper});expect(f.rpc).not.toHaveBeenCalled();});
  it('throws the read error instead of inventing an empty success',async () => {f.rpc.mockResolvedValue({data:null,error:new Error('featured refused')});const {wrapper}=setup();const hook=renderHook(() => useWatchFeatured('me'),{wrapper});await waitFor(() => expect(hook.result.current.isError).toBe(true));expect(hook.result.current.error?.message).toBe('featured refused');});
  it('patches likes and comments without changing session order',() => {const {client}=setup();const key=['watch','featured','me'];client.setQueryData(key,[{post_id:'a',like_count:12,comment_count:3},{post_id:'b',like_count:7,comment_count:4}]);patchEngagement(client,'a',{isLikedByMe:true,likeCountDelta:1,commentCountDelta:1});expect(client.getQueryData(key)).toEqual([expect.objectContaining({post_id:'a',like_count:13,comment_count:4,is_liked_by_me:true}),expect.objectContaining({post_id:'b',like_count:7,comment_count:4})]);});
  it('starts a fresh featured read in a new app session',async () => {f.rpc.mockResolvedValue({data:[],error:null});const a=setup();const first=renderHook(() => useWatchFeatured('me'),{wrapper:a.wrapper});await waitFor(() => expect(first.result.current.isSuccess).toBe(true));first.unmount();const b=setup();const second=renderHook(() => useWatchFeatured('me'),{wrapper:b.wrapper});await waitFor(() => expect(second.result.current.isSuccess).toBe(true));expect(f.rpc).toHaveBeenCalledTimes(2);});
});