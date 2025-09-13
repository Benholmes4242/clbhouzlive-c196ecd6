/**
 * Minimal telemetry for video autoplay analytics
 */

interface VideoTelemetryEvent {
  event: string;
  userAgent?: string;
  platform?: string;
  connectionType?: string;
  timestamp: number;
}

let sessionEvents = new Set<string>();

export function logVideoTelemetry(eventName: string, additionalData?: Record<string, any>) {
  // Log once per modal session to avoid spam
  const sessionKey = `${eventName}_${Date.now().toString().slice(-6)}`;
  if (sessionEvents.has(eventName)) return;
  
  sessionEvents.add(eventName);

  const event: VideoTelemetryEvent = {
    event: eventName,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    timestamp: Date.now(),
    ...additionalData
  };

  console.log(`[VideoTelemetry] ${eventName}:`, event);
  
  // Reset session events after 30 seconds to allow re-logging
  setTimeout(() => sessionEvents.delete(eventName), 30000);
}

export function clearTelemetrySession() {
  sessionEvents.clear();
}