import { useLocationPermission } from './useLocationPermission';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

// List of authorized tester emails
const AUTHORIZED_TESTERS = [
  'ben@clbhouz.com',
  // Add more authorized emails here
];

export function useNearbyTestTools() {
  const { getCurrentLocation } = useLocationPermission();
  const { user } = useSupabaseSession();

  // Only allow if current user is an authorized tester
  const isAllowedTester = user?.email && AUTHORIZED_TESTERS.includes(user.email);

  const spawnTestGolferNearMe = async () => {
    if (!isAllowedTester) {
      toast.error('Not authorized');
      return;
    }

    const loc = await getCurrentLocation();
    if (!loc) {
      toast.error('Could not get your location');
      return;
    }

    const { error } = await supabase
      .from('user_nearby_status')
      .upsert(
        {
          user_id: TEST_USER_ID,
          lat: loc.lat,
          lng: loc.lng,
          last_location_update: new Date().toISOString(),
          visibility_mode: 'all',
          open_to_play_active: false,
          open_to_play_expires_at: null,
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('[NearbyTestTools] spawnTestGolferNearMe error', error);
      toast.error('Failed to spawn test golfer');
    } else {
      toast.success('Test golfer spawned near you');
    }
  };

  const setTestGolferOpenToPlay = async (active: boolean) => {
    if (!isAllowedTester) {
      toast.error('Not authorized');
      return;
    }

    const { error } = await supabase
      .from('user_nearby_status')
      .update({
        open_to_play_active: active,
        open_to_play_expires_at: active
          ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
          : null,
      })
      .eq('user_id', TEST_USER_ID);

    if (error) {
      console.error('[NearbyTestTools] setOpenToPlay error', error);
      toast.error('Failed to update open to play status');
    } else {
      toast.success(active ? 'Test golfer is now open to play' : 'Open to play cleared');
    }
  };

  const makeTestGolferStale = async () => {
    if (!isAllowedTester) {
      toast.error('Not authorized');
      return;
    }

    const { error } = await supabase
      .from('user_nearby_status')
      .update({
        last_location_update: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
      })
      .eq('user_id', TEST_USER_ID);

    if (error) {
      console.error('[NearbyTestTools] makeTestGolferStale error', error);
      toast.error('Failed to make test golfer stale');
    } else {
      toast.success('Test golfer location is now stale');
    }
  };

  const blockTestGolfer = async () => {
    if (!isAllowedTester || !user?.id) {
      toast.error('Not authorized');
      return;
    }

    const { error } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: user.id,
        blocked_id: TEST_USER_ID,
      });

    if (error) {
      console.error('[NearbyTestTools] blockTestGolfer error', error);
      toast.error('Failed to block test golfer');
    } else {
      toast.success('Test golfer blocked');
    }
  };

  const unblockTestGolfer = async () => {
    if (!isAllowedTester || !user?.id) {
      toast.error('Not authorized');
      return;
    }

    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .match({ blocker_id: user.id, blocked_id: TEST_USER_ID });

    if (error) {
      console.error('[NearbyTestTools] unblockTestGolfer error', error);
      toast.error('Failed to unblock test golfer');
    } else {
      toast.success('Test golfer unblocked');
    }
  };

  return {
    isAllowedTester,
    spawnTestGolferNearMe,
    setTestGolferOpenToPlay,
    makeTestGolferStale,
    blockTestGolfer,
    unblockTestGolfer,
  };
}
