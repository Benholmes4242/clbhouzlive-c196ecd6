// Hook for managing database-backed drafts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchUserDrafts,
  getDraftCount,
  createDraft,
  updateDraft,
  deleteDraft,
  deleteAllDrafts,
  addDraftMedia,
  updateDraftMedia,
  deleteDraftMedia,
  getDraft,
} from '@/services/drafts';
import { MAX_DRAFTS_PER_USER } from '@/services/drafts/types';
import type { DraftSaveInput, DraftWithMedia } from '@/services/drafts';

const DRAFTS_QUERY_KEY = ['drafts'];
const DRAFT_COUNT_QUERY_KEY = ['draft-count'];

export function useDrafts() {
  const queryClient = useQueryClient();

  // Fetch all drafts with media
  const { data: drafts = [], isLoading, refetch } = useQuery({
    queryKey: DRAFTS_QUERY_KEY,
    queryFn: fetchUserDrafts,
    staleTime: 30_000, // 30 seconds
  });

  // Get draft count
  const { data: draftCount = 0 } = useQuery({
    queryKey: DRAFT_COUNT_QUERY_KEY,
    queryFn: getDraftCount,
    staleTime: 30_000,
  });

  // Create draft mutation
  const createDraftMutation = useMutation({
    mutationFn: createDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFT_COUNT_QUERY_KEY });
    },
    onError: () => {
      toast.error('Failed to save draft');
    },
  });

  // Update draft mutation
  const updateDraftMutation = useMutation({
    mutationFn: ({ draftId, input }: { draftId: string; input: Partial<DraftSaveInput> }) =>
      updateDraft(draftId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
    },
    onError: () => {
      toast.error('Failed to update draft');
    },
  });

  // Delete draft mutation
  const deleteDraftMutation = useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFT_COUNT_QUERY_KEY });
      toast.success('Draft deleted');
    },
    onError: () => {
      toast.error('Failed to delete draft');
    },
  });

  // Delete all drafts mutation
  const deleteAllDraftsMutation = useMutation({
    mutationFn: deleteAllDrafts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFT_COUNT_QUERY_KEY });
      toast.success('All drafts deleted');
    },
    onError: () => {
      toast.error('Failed to delete drafts');
    },
  });

  // Add media to draft mutation
  const addMediaMutation = useMutation({
    mutationFn: ({
      draftId,
      mediaUrl,
      mediaType,
      displayOrder,
      options,
    }: {
      draftId: string;
      mediaUrl: string;
      mediaType: 'image' | 'video';
      displayOrder: number;
      options?: Parameters<typeof addDraftMedia>[4];
    }) => addDraftMedia(draftId, mediaUrl, mediaType, displayOrder, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
    },
  });

  // Update media mutation
  const updateMediaMutation = useMutation({
    mutationFn: ({
      mediaId,
      updates,
    }: {
      mediaId: string;
      updates: Parameters<typeof updateDraftMedia>[1];
    }) => updateDraftMedia(mediaId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
    },
  });

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: deleteDraftMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
    },
  });

  // Check if user can create more drafts
  const canCreateDraft = draftCount < MAX_DRAFTS_PER_USER;

  return {
    // Data
    drafts,
    draftCount,
    isLoading,
    canCreateDraft,
    maxDrafts: MAX_DRAFTS_PER_USER,

    // Actions
    refetch,
    createDraft: createDraftMutation.mutateAsync,
    updateDraft: (draftId: string, input: Partial<DraftSaveInput>) =>
      updateDraftMutation.mutateAsync({ draftId, input }),
    deleteDraft: deleteDraftMutation.mutateAsync,
    deleteAllDrafts: deleteAllDraftsMutation.mutateAsync,
    addMedia: addMediaMutation.mutateAsync,
    updateMedia: (mediaId: string, updates: Parameters<typeof updateDraftMedia>[1]) =>
      updateMediaMutation.mutateAsync({ mediaId, updates }),
    deleteMedia: deleteMediaMutation.mutateAsync,
    getDraft,

    // Loading states
    isCreating: createDraftMutation.isPending,
    isUpdating: updateDraftMutation.isPending,
    isDeleting: deleteDraftMutation.isPending || deleteAllDraftsMutation.isPending,
  };
}
