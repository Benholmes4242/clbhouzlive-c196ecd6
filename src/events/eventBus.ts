// Lightweight typed event bus - no dependencies

type Handler<T> = (event: T) => void;

export class SimpleEventBus<EventMap extends Record<string, unknown>> {
  private handlers = new Map<keyof EventMap, Set<Handler<unknown>>>();

  on<K extends keyof EventMap>(type: K, handler: Handler<EventMap[K]>) {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as Handler<unknown>);
    this.handlers.set(type, set);

    // Return unsubscribe function
    return () => {
      set.delete(handler as Handler<unknown>);
      if (set.size === 0) this.handlers.delete(type);
    };
  }

  emit<K extends keyof EventMap>(type: K, event: EventMap[K]) {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const handler of set) {
      handler(event);
    }
  }
}
