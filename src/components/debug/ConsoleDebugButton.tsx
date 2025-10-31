import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X } from 'lucide-react';

interface LogEntry {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: Date;
}

export function ConsoleDebugButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intercept console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (type: LogEntry['type'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev.slice(-99), { type, message, timestamp: new Date() }]);
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const clearLogs = () => setLogs([]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-white/80';
    }
  };

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-[10000] w-12 h-12 rounded-full bg-purple-600 text-white shadow-lg flex items-center justify-center hover:bg-purple-700 transition-all active:scale-95"
        aria-label="Toggle console"
      >
        <Terminal className="w-5 h-5" />
      </button>

      {/* Console Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-end sm:items-center sm:justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full sm:max-w-2xl sm:max-h-[80vh] h-[70vh] bg-black/95 border border-white/10 sm:rounded-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <h3 className="text-white font-semibold text-sm">Console Logs</h3>
                <span className="text-xs text-white/50">({logs.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearLogs}
                  className="text-xs text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/5"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-white/40 text-center py-8">No logs yet</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="mb-2 pb-2 border-b border-white/5">
                    <div className="flex items-start gap-2">
                      <span className="text-white/30 text-[10px] shrink-0">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <pre className={`flex-1 whitespace-pre-wrap break-all ${getLogColor(log.type)}`}>
                        {log.message}
                      </pre>
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
