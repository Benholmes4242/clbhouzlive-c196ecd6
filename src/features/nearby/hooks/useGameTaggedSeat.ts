import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useGameTaggedSeat() {
  const { toast } = useToast();

  const acceptTaggedSeat = async (gameId: string) => {
    try {
      const { error } = await supabase.rpc('game_tag_accept', {
        p_game_id: gameId,
      });

      if (error) throw error;

      toast({
        title: "Seat confirmed ✓",
        description: "You're in! The host has been notified.",
      });

      return { success: true };
    } catch (error) {
      console.error('Error accepting tagged seat:', error);
      toast({
        title: "Error",
        description: "Failed to accept seat. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const declineTaggedSeat = async (gameId: string) => {
    try {
      const { error } = await supabase.rpc('game_tag_decline', {
        p_game_id: gameId,
      });

      if (error) throw error;

      toast({
        title: "Seat declined",
        description: "The host has been notified and the seat is now available.",
      });

      return { success: true };
    } catch (error) {
      console.error('Error declining tagged seat:', error);
      toast({
        title: "Error",
        description: "Failed to decline seat. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const releaseTaggedSeat = async (gameId: string, userId: string) => {
    try {
      const { error } = await supabase.rpc('game_tag_release', {
        p_game_id: gameId,
        p_user_id: userId,
      });

      if (error) throw error;

      toast({
        title: "Seat released",
        description: "The player has been notified and the seat is now available.",
      });

      return { success: true };
    } catch (error) {
      console.error('Error releasing tagged seat:', error);
      toast({
        title: "Error",
        description: "Failed to release seat. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    acceptTaggedSeat,
    declineTaggedSeat,
    releaseTaggedSeat,
  };
}
