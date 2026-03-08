import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { useCreatorPostPicker, type PickerPost } from './hooks/useCreatorPostPicker';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDuration } from '@/utils/formatDuration';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CreatorPostPickerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  mode: 'featured' | 'pinned';
  currentFeaturedId?: string;
  currentPinnedIds?: string[];
  onSelectFeatured?: (postId: string) => void;
  onSelectPinned?: (postIds: string[]) => void;
}

export function CreatorPostPicker({
  isOpen,
  onClose,
  userId,
  mode,
  currentFeaturedId,
  currentPinnedIds = [],
  onSelectFeatured,
  onSelectPinned,
}: CreatorPostPickerProps) {
  const { data: posts, isLoading } = useCreatorPostPicker(isOpen ? userId : undefined);
  const queryClient = useQueryClient();

  const [selectedFeatured, setSelectedFeatured] = useState<string | null>(currentFeaturedId ?? null);
  const [selectedPinned, setSelectedPinned] = useState<string[]>(currentPinnedIds);
  const [saving, setSaving] = useState(false);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (mode === 'featured') return posts.filter((p) => p.isVideo);
    return posts;
  }, [posts, mode]);

  if (!isOpen) return null;

  const handleTapPost = (postId: string) => {
    if (mode === 'featured') {
      setSelectedFeatured(postId === selectedFeatured ? null : postId);
    } else {
      setSelectedPinned((prev) => {
        if (prev.includes(postId)) return prev.filter((id) => id !== postId);
        if (prev.length >= 3) return prev;
        return [...prev, postId];
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === 'featured') {
        await supabase
          .from('user_profiles')
          .update({ featured_post_id: selectedFeatured })
          .eq('id', userId);
        onSelectFeatured?.(selectedFeatured!);
      } else {
        await supabase
          .from('user_profiles')
          .update({ pinned_post_ids: selectedPinned } as any)
          .eq('id', userId);
        onSelectPinned?.(selectedPinned);
      }
      queryClient.invalidateQueries({ queryKey: ['creator-profile', userId] });
      onClose();
    } catch (err) {
      console.error('Failed to save creator selection:', err);
    } finally {
      setSaving(false);
    }
  };

  const pinnedIndex = (id: string) => selectedPinned.indexOf(id) + 1;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[200] bg-background rounded-t-[20px] max-h-[85vh] flex flex-col">
        {/* Drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-semibold text-foreground">
            {mode === 'featured' ? 'Select Featured Video' : 'Select Pinned Posts (up to 3)'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-[44px] w-[44px] flex items-center justify-center rounded-full bg-[#F5F5F7]"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-[#7A7A7A]" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-1.5 p-[2px]">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-lg" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {mode === 'featured' ? 'No videos to feature yet. Post a video first!' : 'No posts yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 p-[2px]">
              {filteredPosts.map((post) => {
                const isSelected =
                  mode === 'featured'
                    ? post.id === selectedFeatured
                    : selectedPinned.includes(post.id);

                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => handleTapPost(post.id)}
                    className={cn(
                      'relative aspect-[4/5] rounded-lg overflow-hidden bg-muted',
                      isSelected && 'border-2 border-primary',
                    )}
                  >
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted" />
                    )}

                    {/* Duration */}
                    {post.isVideo && post.duration != null && (
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-white text-[9px] font-medium">
                        {formatDuration(post.duration)}
                      </span>
                    )}

                    {/* Selection indicator */}
                    {isSelected && mode === 'featured' && (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    {mode === 'pinned' && isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary-foreground">
                          {pinnedIndex(post.id)}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Save button — sticky footer */}
        <div className="shrink-0 px-4 pt-2 border-t border-border" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (mode === 'featured' && !selectedFeatured) || (mode === 'pinned' && selectedPinned.length === 0)}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
