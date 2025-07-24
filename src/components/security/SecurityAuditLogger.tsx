// Security audit logging for monitoring suspicious activities
interface SecurityEvent {
  type: 'auth_failure' | 'access_denied' | 'rate_limit_exceeded' | 'suspicious_activity';
  details: Record<string, any>;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

class SecurityAuditLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory
  
  log(type: SecurityEvent['type'], details: Record<string, any>) {
    const event: SecurityEvent = {
      type,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      // Note: IP detection would need server-side implementation
    };
    
    this.events.unshift(event);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Security Event [${type}]:`, details);
    }
    
    // In production, you might want to send this to your logging service
    // this.sendToLoggingService(event);
  }
  
  getRecentEvents(type?: SecurityEvent['type'], limit = 50): SecurityEvent[] {
    let filtered = this.events;
    
    if (type) {
      filtered = this.events.filter(event => event.type === type);
    }
    
    return filtered.slice(0, limit);
  }
  
  getFailureCount(type: SecurityEvent['type'], timeWindowMs = 60 * 60 * 1000): number {
    const now = Date.now();
    const cutoff = now - timeWindowMs;
    
    return this.events.filter(
      event => event.type === type && event.timestamp > cutoff
    ).length;
  }
  
  clearEvents() {
    this.events = [];
  }
  
  private async sendToLoggingService(event: SecurityEvent) {
    // Example implementation for sending to a logging service
    // This would be implemented based on your logging infrastructure
    try {
      // await fetch('/api/security-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('Failed to send security event to logging service:', error);
    }
  }
}

export const securityLogger = new SecurityAuditLogger();

// Hook for logging security events in React components
export const useSecurityLogger = () => {
  return {
    logAuthFailure: (reason: string, details?: Record<string, any>) => {
      securityLogger.log('auth_failure', { reason, ...details });
    },
    logAccessDenied: (resource: string, details?: Record<string, any>) => {
      securityLogger.log('access_denied', { resource, ...details });
    },
    logRateLimitExceeded: (action: string, details?: Record<string, any>) => {
      securityLogger.log('rate_limit_exceeded', { action, ...details });
    },
    logSuspiciousActivity: (activity: string, details?: Record<string, any>) => {
      securityLogger.log('suspicious_activity', { activity, ...details });
    },
    getRecentEvents: securityLogger.getRecentEvents.bind(securityLogger),
    getFailureCount: securityLogger.getFailureCount.bind(securityLogger)
  };
};
