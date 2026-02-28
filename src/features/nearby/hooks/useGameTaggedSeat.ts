import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useGameTaggedSeat() {
  const acceptTaggedSeat = async (gameId: string) => {
    try {
      const { error } = await supabase.rpc('game_tag_accept', {
        p_game_id: gameId,
      });

      if (error) throw error;

      toast.success("Seat confirmed");

      return { success: true };
    } catch (error) {
      console.error('Error accepting tagged seat:', error);
      toast.error("Couldn't confirm seat", {
        description: "Please try again",
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

      toast.success("Seat declined");

      return { success: true };
    } catch (error) {
      console.error('Error declining tagged seat:', error);
      toast.error("Couldn't decline seat", {
        description: "Please try again",
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

      toast.success("Seat released");

      return { success: true };
    } catch (error) {
      console.error('Error releasing tagged seat:', error);
      toast.error("Couldn't release seat", {
        description: "Please try again",
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
