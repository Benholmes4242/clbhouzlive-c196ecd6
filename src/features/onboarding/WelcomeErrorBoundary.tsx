import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/** OB1.2: no failure inside the first-sign-in flow may leave a blank canvas.
 * A render error shows a message with two ways forward: retry the flow (it
 * resumes from saved progress) or open the app. */
export class WelcomeErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('[Welcome] flow error', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="welcome-shell" data-welcome-error><div className="welcome-body"><h1>Something went wrong.</h1><p className="welcome-sub">Your progress is saved. Try again, or carry on into clbhouz and finish later from your profile.</p></div><footer className="welcome-foot"><Button className="welcome-primary" onClick={() => this.setState({ failed: false })}>Try again</Button><Button variant="ghost" className="welcome-text" onClick={() => window.location.assign('/')}>Open clbhouz</Button></footer></main>;
  }
}
