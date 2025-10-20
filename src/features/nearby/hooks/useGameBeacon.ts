import { useState } from 'react';
import { GameBeacon, GameBeaconDraft } from '../types';
import { LIVE_CLUBHOUSE_DATA } from '../config';
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

    if (LIVE_CLUBHOUSE_DATA) {
      // TODO: POST /beacons
      console.log('POST /beacons', beacon);
    } else {
      mockBeacons.push(beacon);
      console.log('Mock beacon created:', beacon);
    }

    setActiveBeacon(beacon);
    toast({
      title: 'Game beacon sent',
      description: `${draft.playersNeeded} player${draft.playersNeeded > 1 ? 's' : ''} notified`,
    });

    return beacon;
  };

  const cancelBeacon = async (beaconId: string) => {
    if (LIVE_CLUBHOUSE_DATA) {
      // TODO: POST /beacons/:id/cancel
      console.log('POST /beacons/:id/cancel', beaconId);
    } else {
      mockBeacons = mockBeacons.filter((b) => b.id !== beaconId);
      console.log('Mock beacon cancelled:', beaconId);
    }

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
    
    if (LIVE_CLUBHOUSE_DATA) {
      // TODO: POST /beacons/:id/notify
      console.log('POST quick ping');
    } else {
      console.log('Mock quick ping sent');
    }

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
