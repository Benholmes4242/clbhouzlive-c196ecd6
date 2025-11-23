/**
 * Enhanced error logging for iOS Safari debugging
 * Captures module import failures and geolocation errors
 */

interface ErrorContext {
  timestamp: number;
  userAgent: string;
  url: string;
  route: string;
  [key: string]: any;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];
  private maxQueueSize = 50;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[ErrorLogger] Unhandled Promise Rejection:', {
        reason: event.reason,
        promise: event.promise,
        stack: event.reason?.stack,
      });

      this.logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          type: 'unhandledRejection',
          route: window.location.pathname,
        }
      );

      // Prevent default to avoid console spam
      event.preventDefault();
    });

    // Catch module import errors specifically
    window.addEventListener('error', (event) => {
      const isModuleError = 
        event.message?.includes('module') ||
        event.message?.includes('import') ||
        event.filename?.includes('vendor') ||
        event.filename?.includes('index');

      if (isModuleError) {
        console.error('[ErrorLogger] Module Import Error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          stack: event.error?.stack,
          route: window.location.pathname,
        });
      }
    }, true);
  }

  logError(error: Error, context: Partial<ErrorContext> = {}) {
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      route: window.location.pathname,
      ...context,
    };

    this.errorQueue.push({ error, context: fullContext });

    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log to console with enhanced details
    console.error('[ErrorLogger]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context: fullContext,
    });

    // Store in sessionStorage for debugging
    try {
      const recentErrors = this.getRecentErrors();
      recentErrors.push({
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines only
        context: fullContext,
      });

      // Keep only last 10 errors
      if (recentErrors.length > 10) {
        recentErrors.shift();
      }

      sessionStorage.setItem('app_error_log', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('[ErrorLogger] Failed to store error in sessionStorage:', e);
    }
  }

  logGeolocationError(error: GeolocationPositionError, context: Record<string, any> = {}) {
    const errorMessages = {
      1: 'PERMISSION_DENIED',
      2: 'POSITION_UNAVAILABLE',
      3: 'TIMEOUT',
    };

    console.error('[ErrorLogger] Geolocation Error:', {
      code: error.code,
      type: errorMessages[error.code as 1 | 2 | 3] || 'UNKNOWN',
      message: error.message,
      context: {
        ...context,
        timestamp: Date.now(),
        route: window.location.pathname,
      },
    });

    // Log to error queue
    this.logError(
      new Error(`Geolocation ${errorMessages[error.code as 1 | 2 | 3]}: ${error.message}`),
      {
        type: 'geolocation',
        geolocationCode: error.code,
        ...context,
      }
    );
  }

  getRecentErrors(): Array<{ name: string; message: string; stack?: string; context: ErrorContext }> {
    try {
      const stored = sessionStorage.getItem('app_error_log');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  clearErrors() {
    this.errorQueue = [];
    try {
      sessionStorage.removeItem('app_error_log');
    } catch (e) {
      console.warn('[ErrorLogger] Failed to clear sessionStorage:', e);
    }
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Export convenience functions
export function logError(error: Error, context?: Partial<ErrorContext>) {
  errorLogger.logError(error, context);
}

export function logGeolocationError(error: GeolocationPositionError, context?: Record<string, any>) {
  errorLogger.logGeolocationError(error, context);
}

export function getRecentErrors() {
  return errorLogger.getRecentErrors();
}

export function clearErrorLog() {
  errorLogger.clearErrors();
}
