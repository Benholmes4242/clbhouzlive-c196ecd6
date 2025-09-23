// SwingCoach debugging utilities
// Run in browser console: window.debugSwingCoach()

export const debugSwingCoach = () => {
  console.group('🏌️ SwingCoach Debug Report');
  
  // Check if in SwingCoach
  const isSwingCoachActive = window.location.href.includes('profile') || 
                            document.querySelector('[data-testid="swing-coach"]');
  console.log('SwingCoach Active:', isSwingCoachActive);
  
  // Check SSE connection
  const sseConnections = [];
  const performanceEntries = performance.getEntriesByType('resource');
  performanceEntries.forEach(entry => {
    if (entry.name.includes('swing-stream-proxy') || entry.name.includes('swing-session-stream')) {
      sseConnections.push({
        url: entry.name,
        duration: entry.duration,
        status: (entry as any).responseStatus || 'unknown'
      });
    }
  });
  console.log('SSE Connections:', sseConnections);
  
  // Check phase results in localStorage
  const swingHistory = localStorage.getItem('clbhouz_swingcoach_history');
  if (swingHistory) {
    try {
      const history = JSON.parse(swingHistory);
      console.log('SwingCoach History:', history.length, 'messages');
    } catch (e) {
      console.log('SwingCoach History: Invalid JSON');
    }
  } else {
    console.log('SwingCoach History: None');
  }
  
  // Check for active session state
  const sessionData = (window as any).swingSessionDebugData;
  if (sessionData) {
    console.log('Active Session:', sessionData);
  } else {
    console.log('No active session debug data found');
  }
  
  console.groupEnd();
  
  return {
    message: 'Debug complete - check console for details',
    sseConnections,
    recommendations: [
      sseConnections.length === 0 ? '❌ No SSE connections found - check if analysis started' : '✅ SSE connections detected',
      '💡 Try: Upload a video and watch Network tab for swing-stream-proxy requests',
      '💡 Try: Check Supabase Edge Function logs for any errors',
      '💡 Try: Ensure frames are extracting properly (check console during upload)'
    ]
  };
};

// Quick checklist for manual testing
export const getSwingCoachChecklist = () => {
  return {
    title: "SwingCoach Manual Test Checklist (Post-Fix)",
    steps: [
      {
        step: 1,
        description: "Upload video",
        expected: "Video preview appears, frame extraction logs in console"
      },
      {
        step: 2,
        description: "Start analysis",
        expected: "Phase strip shows, SSE connects (Network tab), analyzing=true"
      },
      {
        step: 3,
        description: "Watch phases progress",
        expected: "Phases change from idle → running → done, frames advance"
      },
      {
        step: 4,
        description: "Verify completion",
        expected: "After complete event: analyzing=false, no more 'Finalizing', thumbnails clickable"
      },
      {
        step: 5,
        description: "Check error resilience",
        expected: "If summarization fails, UI still shows 'Analysis Complete'"
      },
      {
        step: 6,
        description: "Test disconnection",
        expected: "If SSE disconnects, local autoplay starts, thumbnails remain clickable"
      }
    ],
    troubleshooting: [
      "If still hangs on 'Finalizing': Check if complete event fired (Network → EventStream → look for event:complete)",
      "If frames don't advance: Check sanitizeFrameIndex logs, ensure frameIndex is valid",
      "If thumbnails unclickable: Check CSS pointer-events, ensure no overlays blocking",
      "If infinite reconnects: Check if reconnectAttempts maxed out or completedAt set"
    ]
  };
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugSwingCoach = debugSwingCoach;
  (window as any).getSwingCoachChecklist = getSwingCoachChecklist;
}