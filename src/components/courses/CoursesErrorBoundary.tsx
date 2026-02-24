import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class CoursesErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Courses page error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Clear any problematic session storage
    try {
      sessionStorage.removeItem('explore-last-filters');
      sessionStorage.removeItem('top100-last-filters');
      sessionStorage.removeItem('explore-scroll');
      sessionStorage.removeItem('top100-scroll');
      sessionStorage.removeItem('championship-leaderboard-filters');
      sessionStorage.removeItem('championship-leaderboard-scroll');
      sessionStorage.removeItem('courses-leaderboard-filters');
      sessionStorage.removeItem('courses-leaderboard-scroll');
      sessionStorage.removeItem('exploration-leaderboard-filters');
      sessionStorage.removeItem('exploration-leaderboard-scroll');
      sessionStorage.removeItem('handicap-leaderboard-filters');
      sessionStorage.removeItem('handicap-leaderboard-scroll');
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            We encountered an error loading the courses page. This might be a temporary issue.
          </p>
          <Button onClick={this.handleReset} variant="outline">
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CoursesErrorBoundary;
