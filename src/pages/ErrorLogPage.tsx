import React, { useState, useEffect } from 'react';
import { getRecentErrors, clearErrorLog } from '@/utils/errorLogger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Download, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PageRoot } from '@/components/layout/PageRoot';

/**
 * Error Log Diagnostic Page
 * Visit /error-logs to see captured errors for debugging
 */
export default function ErrorLogPage() {
  const [errors, setErrors] = useState<any[]>([]);
  

  const loadErrors = () => {
    const recentErrors = getRecentErrors();
    setErrors(recentErrors);
  };

  useEffect(() => {
    loadErrors();
  }, []);

  const handleClear = () => {
    clearErrorLog();
    setErrors([]);
    toast.success('Error log cleared');
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(errors, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-log-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Log downloaded');
  };

  const handleRefresh = () => {
    loadErrors();
    toast.success('Refreshed');
  };

  return (
    <PageRoot className="min-h-screen bg-background p-4 pb-safe">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Error Log
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Diagnostic information for debugging iOS Safari issues
            </p>
          </div>
          <Button variant="ghost" onClick={() => window.location.href = '/'}>
            Back Home
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Info</CardTitle>
            <CardDescription>
              Current session information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User Agent:</span>
              <span className="font-mono text-xs max-w-md truncate">
                {navigator.userAgent}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Route:</span>
              <span className="font-mono">{window.location.pathname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Errors Captured:</span>
              <span className="font-bold">{errors.length}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleDownload} variant="outline" className="gap-2" disabled={errors.length === 0}>
            <Download className="h-4 w-4" />
            Download Log
          </Button>
          <Button onClick={handleClear} variant="destructive" className="gap-2" disabled={errors.length === 0}>
            <Trash2 className="h-4 w-4" />
            Clear Log
          </Button>
        </div>

        {errors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No errors logged yet. This is good!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {errors.map((error, index) => (
              <Card key={index} className="border-destructive/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        {error.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {new Date(error.context.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-muted">
                      {error.context.type || 'unknown'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Message:</h4>
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                  </div>

                  {error.context.route && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Route:</h4>
                      <p className="text-sm font-mono text-muted-foreground">{error.context.route}</p>
                    </div>
                  )}

                  {error.context.geolocationCode && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Geolocation Code:</h4>
                      <p className="text-sm font-mono text-muted-foreground">
                        {error.context.geolocationCode} 
                        {error.context.geolocationCode === 1 && ' (PERMISSION_DENIED)'}
                        {error.context.geolocationCode === 2 && ' (POSITION_UNAVAILABLE)'}
                        {error.context.geolocationCode === 3 && ' (TIMEOUT)'}
                      </p>
                    </div>
                  )}

                  {error.stack && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Stack Trace:</h4>
                      <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {error.context.componentStack && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Component Stack:</h4>
                      <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                        {error.context.componentStack}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
         )}
      </div>
    </PageRoot>
  );
}
