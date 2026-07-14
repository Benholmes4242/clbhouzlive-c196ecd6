/**
 * FeedErrorBoundary
 *
 * Local safety net around `<CardFeed />`. react-virtuoso occasionally
 * throws "Cannot read properties of undefined (reading 'index')" when a
 * stale StateSnapshot is restored against a shrunk data array. Without a
 * boundary this bubbles to the app-level "Something went wrong" screen on
 * cold open of Clubhouse.
 *
 * On catch we:
 *   1. Notify the parent so it can evict the offending snapshot.
 *   2. Bump an internal `resetKey` to remount our children fresh — CardFeed
 *      is `key={activeTab}`-mounted upstream, so the remount will read the
 *      now-cleared snapshot and start from a clean initialState=undefined.
 */
import React from 'react';

type Props = {
  children: React.ReactNode;
  /** Called once when we catch — parent should clear the stale snapshot. */
  onRecover?: (error: unknown) => void;
  /** External key — when it changes, the boundary resets its error state. */
  resetKey?: string | number;
};

type State = { error: Error | null; resetKey: string | number | undefined };

export class FeedErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.warn('[FeedErrorBoundary] recovered from feed error', error?.message);
    try { this.props.onRecover?.(error); } catch { /* noop */ }
    // Auto-clear next tick so children remount fresh.
    queueMicrotask(() => {
      this.setState({ error: null });
    });
  }

  render() {
    if (this.state.error) {
      // Render nothing for the frame we caught in — parent will have
      // cleared the snapshot and the children remount fresh next tick.
      return null;
    }
    return this.props.children;
  }
}
