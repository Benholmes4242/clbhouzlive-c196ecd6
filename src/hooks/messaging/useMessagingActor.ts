import { useActiveActor } from '@/context/ActiveActorContext';
import type { ActorType } from '@/types/messaging';

export interface MessagingActor {
  actorType: ActorType;
  actorId: string;
}

export function useMessagingActor(): MessagingActor | null {
  const { activeActor } = useActiveActor();
  if (!activeActor) return null;
  return {
    actorType: activeActor.type as ActorType,
    actorId: activeActor.id,
  };
}
