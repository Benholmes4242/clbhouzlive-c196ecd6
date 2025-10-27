import { useState } from 'react';
import { GameBeacon, GameBeaconDraft } from '../types';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';

let mockBeacons: GameBeacon[] = [];

export function useGameBeacon() {
  const [activeBeacon, setActiveBeacon] = useState<GameBeacon | null>(null);
  const [lastQuickPing, setLastQuickPing] = useState<number>(0);
  const { toast } = useToast();

  const createBeacon = async (draft: GameBeaconDraft): Promise<GameBeacon> => {
    const beacon: GameBeacon = {
      ...draft,
      id: nanoid(),
      creatorUserId: 'mock-user',
      createdAtISO: new Date().toISOString(),
      expiresAtISO: new Date(Date.now() + draft.visibilityWindowMin * 60000).toISOString(),
      status: 'active',
    };

    // Nearby features not yet implemented - using mock behavior
    mockBeacons.push(beacon);
    console.log('Mock beacon created:', beacon);

    setActiveBeacon(beacon);
    toast({
      title: 'Game beacon sent',
      description: `${draft.playersNeeded} player${draft.playersNeeded > 1 ? 's' : ''} notified`,
    });

    return beacon;
  };

  const cancelBeacon = async (beaconId: string) => {
    // Nearby features not yet implemented - using mock behavior
    mockBeacons = mockBeacons.filter((b) => b.id !== beaconId);
    console.log('Mock beacon cancelled:', beaconId);

    setActiveBeacon(null);
    toast({
      title: 'Game beacon cancelled',
    });
  };

  const sendQuickPing = async () => {
    const now = Date.now();
    const cooldown = 10 * 60 * 1000; // 10 minutes
    
    if (now - lastQuickPing < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastQuickPing)) / 60000);
      toast({
        title: 'Rate limit',
        description: `You can send another quick ping in ${remaining} minutes`,
        variant: 'destructive',
      });
      return;
    }

    setLastQuickPing(now);
    
    // Nearby features not yet implemented - using mock behavior
    console.log('Mock quick ping sent');

    toast({
      title: 'Quick ping sent',
      description: 'Friends and nearby players notified',
    });
  };

  return {
    activeBeacon,
    createBeacon,
    cancelBeacon,
    sendQuickPing,
  };
}
