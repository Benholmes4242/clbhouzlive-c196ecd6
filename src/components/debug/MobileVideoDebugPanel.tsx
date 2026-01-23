import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  MOBILE_VIDEO_DEBUG, 
  subscribeToDebugLogs, 
  getDebugLogs, 
  clearDebugLogs, 
  getEnvironmentSummary,
  type DebugLogEntry 
} from '@/media/mobileVideoDebug';
import { X, Trash2, Copy, Pause, Play, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileVideoDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [envSummary, setEnvSummary] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedLogsRef = useRef<DebugLogEntry[]>([]);

  // Get environment summary on mount
  useEffect(() => {
    setEnvSummary(getEnvironmentSummary());
  }, []);

  // Subscribe to log updates
  useEffect(() => {
    const unsubscribe = subscribeToDebugLogs((newLogs) => {
      if (isPaused) {
        pausedLogsRef.current = newLogs;
      } else {
        setLogs(newLogs);
      }
    });
    return unsubscribe;
  }, [isPaused]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  // Resume from paused state
  const handleResume = useCallback(() => {
    setIsPaused(false);
    setLogs(pausedLogsRef.current);
  }, []);

  // Copy all logs to clipboard
  const handleCopyAll = useCallback(async () => {
    const logText = [
      `=== Mobile Video Debug Logs ===`,
      `Environment: ${envSummary}`,
      `Captured: ${new Date().toISOString()}`,
      `Total entries: ${logs.length}`,
      ``,
      ...logs.map(log => 
        `[${log.formattedTime}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${log.data ? '\n  ' + JSON.stringify(log.data, null, 2).split('\n').join('\n  ') : ''}`
      )
    ].join('\n');

    try {
      await navigator.clipboard.writeText(logText);
      // Brief visual feedback
      alert('Logs copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  }, [logs, envSummary]);

  // Handle clear
  const handleClear = useCallback(() => {
    clearDebugLogs();
    pausedLogsRef.current = [];
  }, []);

  // Don't render anything if debug mode is off
  if (!MOBILE_VIDEO_DEBUG) return null;

  // Level color mapping
  const getLevelColor = (level: DebugLogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-blue-300';
    }
  };

  const getLevelBg = (level: DebugLogEntry['level']) => {
    switch (level) {
      case 'success': return 'bg-green-500/10 border-l-green-500';
      case 'error': return 'bg-red-500/10 border-l-red-500';
      case 'warning': return 'bg-yellow-500/10 border-l-yellow-500';
      default: return 'bg-blue-500/10 border-l-blue-500';
    }
  };

  return (
    <>
      {/* Toggle Button - Bottom Left */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 left-4 z-[9999] w-12 h-12 rounded-full bg-black/80 border border-white/20 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          style={{ touchAction: 'manipulation' }}
        >
          <Bug className="w-5 h-5 text-yellow-400" />
          {logs.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
              {logs.length > 99 ? '99+' : logs.length}
            </span>
          )}
        </button>
      )}

      {/* Debug Panel */}
      {isOpen && (
        <div 
          className="fixed inset-x-0 bottom-0 z-[9999] bg-black/95 border-t border-white/10 backdrop-blur-xl"
          style={{ 
            height: '50vh', 
            maxHeight: '400px',
            touchAction: 'none' 
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/50">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm font-medium">Video Debug</span>
              <span className="text-white/50 text-xs">({logs.length})</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Pause/Resume */}
              <button
                onClick={() => isPaused ? handleResume() : setIsPaused(true)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isPaused ? "bg-yellow-500/20 text-yellow-400" : "text-white/60 hover:text-white"
                )}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              {/* Copy */}
              <button
                onClick={handleCopyAll}
                className="p-2 rounded-lg text-white/60 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              {/* Clear */}
              <button
                onClick={handleClear}
                className="p-2 rounded-lg text-white/60 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Environment Info */}
          <div className="px-3 py-1.5 bg-gray-900/50 border-b border-white/5">
            <p className="text-xs text-white/70 font-mono">{envSummary}</p>
          </div>

          {/* Paused Indicator */}
          {isPaused && (
            <div className="px-3 py-1 bg-yellow-500/20 border-b border-yellow-500/30">
              <p className="text-xs text-yellow-400 text-center">⏸ Paused - tap play to resume</p>
            </div>
          )}

          {/* Log Entries */}
          <div 
            ref={scrollRef}
            className="overflow-y-auto overflow-x-hidden"
            style={{ 
              height: 'calc(100% - 80px)',
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                No logs yet. Interact with videos to see events.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {logs.map((log) => (
                  <div 
                    key={log.id}
                    className={cn(
                      "px-3 py-2 border-l-2",
                      getLevelBg(log.level)
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-white/40 font-mono shrink-0 pt-0.5">
                        {log.formattedTime}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                            {log.category}
                          </span>
                          <span className={cn("text-xs font-medium", getLevelColor(log.level))}>
                            {log.message}
                          </span>
                        </div>
                        {log.data && (
                          <pre className="text-[10px] text-white/50 mt-1 overflow-x-auto font-mono whitespace-pre-wrap break-all">
                            {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileVideoDebugPanel;
