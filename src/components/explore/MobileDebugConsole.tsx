import React, { useState, useEffect } from 'react';
import { X, Bug, ChevronDown, ChevronUp } from 'lucide-react';

interface DebugLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

interface MobileDebugConsoleProps {
  isVisible: boolean;
  onToggle: () => void;
}

const MobileDebugConsole: React.FC<MobileDebugConsoleProps> = ({ isVisible, onToggle }) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: 'info' | 'warning' | 'error', message: string, data?: any) => {
      const log: DebugLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        data
      };
      
      setLogs(prev => {
        const newLogs = [log, ...prev];
        // Keep only last 50 logs to prevent memory issues
        return newLogs.slice(0, 50);
      });
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      const message = args.join(' ');
      if (message.includes('MediaCard') || message.includes('Image') || message.includes('URL') || message.includes('Invalid')) {
        addLog('info', message, args.length > 1 ? args[1] : undefined);
      }
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addLog('error', args.join(' '), args.length > 1 ? args[1] : undefined);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog('warning', args.join(' '), args.length > 1 ? args[1] : undefined);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-20 right-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg"
      >
        <Bug className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t-2 border-gray-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Debug Console</span>
          <span className="text-xs text-gray-500">({logs.length} logs)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-600 hover:text-gray-800"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={clearLogs}
            className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
          >
            Clear
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-gray-600 hover:text-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className={`overflow-y-auto ${isExpanded ? 'h-80' : 'h-32'}`}>
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No debug logs yet. Start browsing to see thumbnail loading info.
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`text-xs p-2 rounded border-l-2 ${getTypeColor(log.type)}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="font-mono text-xs opacity-60">{log.timestamp}</div>
                  <div className="uppercase text-xs font-bold">{log.type}</div>
                </div>
                <div className="mt-1 break-words">{log.message}</div>
                {log.data && (
                  <div className="mt-1 text-xs opacity-75 font-mono bg-gray-100 p-1 rounded">
                    {JSON.stringify(log.data, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileDebugConsole;
