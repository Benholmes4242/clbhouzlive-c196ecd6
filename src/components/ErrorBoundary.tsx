import React from 'react';
import { logError } from '@/utils/errorLogger';
import { trackError } from '@/lib/errorTracking';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Enhanced Error Boundary with detailed logging for iOS Safari debugging
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // THE ONE CASE WORTH RELOADING WITHOUT ASKING.
    // A failed dynamic import means this bundle is already broken: the member
    // is staring at a blank or half-rendered route, so there is no input to
    // lose. Reload once, guarded by a session flag so a genuinely missing
    // chunk cannot loop.
    try {
      const msg = String(error?.message ?? '');
      const isChunk =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk');
      if (isChunk && sessionStorage.getItem('chunk_reload_done') !== '1') {
        sessionStorage.setItem('chunk_reload_done', '1');
        window.location.reload();
        return;
      }
    } catch { /* never let recovery throw */ }

    console.error('[ErrorBoundary] Caught error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });

    // Log to enhanced error logger
    logError(error, {
      type: 'reactError',
      componentStack: errorInfo.componentStack,
      route: window.location.pathname,
    });
    trackError({ kind: 'react', error });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    const failCount = parseInt(sessionStorage.getItem('eb_fail') || '0');
    if (failCount >= 2) {
      sessionStorage.removeItem('eb_fail');
      window.location.href = '/';
      return;
    }
    sessionStorage.setItem('eb_fail', String(failCount + 1));
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-4 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              We've logged this error and will investigate it.
            </p>
            
            {this.state.error && (
              <div className="bg-muted/50 p-4 rounded-lg text-left">
                <p className="text-xs font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset}>
                Return Home
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
