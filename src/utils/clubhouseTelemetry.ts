/**
 * Telemetry for Clubhouse portrait-only filtering
 */

interface ClubhouseTelemetryEvent {
  event: string;
  originalCount: number;
  filteredCount: number;
  filterRatio: number;
  timestamp: number;
}

let sessionEvents = new Set<string>();

export function logClubhouseFiltering(originalCount: number, filteredCount: number) {
  // Log once per session to avoid spam
  const sessionKey = `clubhouse_filtering_${Date.now().toString().slice(-6)}`;
  if (sessionEvents.has('clubhouse_filtering')) return;
  
  sessionEvents.add('clubhouse_filtering');

  const filterRatio = originalCount > 0 ? filteredCount / originalCount : 1;
  
  const event: ClubhouseTelemetryEvent = {
    event: 'clubhouse_portrait_filtering',
    originalCount,
    filteredCount,
    filterRatio,
    timestamp: Date.now(),
  };

  console.log(`[ClubhouseTelemetry] Portrait filtering:`, event);
  
  // Reset session events after 30 seconds to allow re-logging
  setTimeout(() => sessionEvents.delete('clubhouse_filtering'), 30000);
}

export function clearClubhouseTelemetrySession() {
  sessionEvents.clear();
}