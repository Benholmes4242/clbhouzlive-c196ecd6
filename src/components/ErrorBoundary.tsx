import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: any, info: any) {
    console.error('Echo History crashed:', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="text-center py-12 px-4" 
          role="alert"
          style={{ color: 'var(--hub-text)' }}
        >
          <div className="text-[17px] font-semibold mb-2">
            Something went wrong
          </div>
          <div className="text-[15px]" style={{ color: 'var(--hub-text-dim)' }}>
            Try reloading the page.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
