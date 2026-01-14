/**
 * Hub Events - Event bridge for instant local UI updates
 * Emits events after mutations so UI updates immediately without waiting for DB round-trip
 */

export type HubEvent = 
  | 'game:created'
  | 'game:updated'
  | 'game:cancelled'
  | 'game:joined'
  | 'game:left'
  | 'trip:created'
  | 'trip:updated'
  | 'trip:cancelled'
  | 'trip:joined'
  | 'trip:left';

export const hubEvents = new EventTarget();

export const emitHub = (name: HubEvent, detail?: any) => {
  hubEvents.dispatchEvent(new CustomEvent(name, { detail }));
};
