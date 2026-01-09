/**
 * useTripNotes - Hook for managing trip timeline notes
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreateNoteParams {
  tripId: string;
  text: string;
  occursAt?: Date | null;
}

export function useTripNotes(tripId: string | undefined) {
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: async ({ tripId, text, occursAt }: CreateNoteParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('trip_timeline_notes')
        .insert({
          trip_id: tripId,
          created_by: user.id,
          text,
          occurs_at: occursAt?.toISOString() ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-timeline', tripId] });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, text, occursAt }: { noteId: string; text: string; occursAt?: Date | null }) => {
      const { data, error } = await supabase
        .from('trip_timeline_notes')
        .update({
          text,
          occurs_at: occursAt?.toISOString() ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-timeline', tripId] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('trip_timeline_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-timeline', tripId] });
    },
  });

  return {
    createNote: (params: CreateNoteParams) => createNoteMutation.mutateAsync(params),
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
}
