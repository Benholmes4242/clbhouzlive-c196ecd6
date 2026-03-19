/**
 * ConsoleLogCapture — intercepts console.log/warn/error and displays them
 * in a copyable in-app panel. No Mac/desktop needed for debugging.
 * Toggle via floating button. Auto-captures from mount.
 */
import { useEffect, useState, useRef } from 'react';

interface LogEntry {
  id: number;
  level: 'log' | 'warn' | 'error';
  message: string;
  time: string;
}

let _logId = 0;
const _subscribers = new Set<(entry: LogEntry) => void>();
let _intercepting = false;
const _buffer: LogEntry[] = []; // Buffer logs before any subscriber exists
const MAX_BUFFER = 200;

function startIntercepting() {
  if (_intercepting) return;
  _intercepting = true;
  const orig = { log: console.log, warn: console.warn, error: console.error };
  (['log', 'warn', 'error'] as const).forEach((level) => {
    (console as any)[level] = (...args: any[]) => {
      orig[level](...args);
      const message = args.map(a => {
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
        catch { return String(a); }
      }).join(' ');
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;
      const entry: LogEntry = { id: _logId++, level, message, time };
      _buffer.push(entry);
      if (_buffer.length > MAX_BUFFER) _buffer.shift();
      _subscribers.forEach(fn => fn(entry));
    };
  });
}

// Start intercepting immediately on module load
startIntercepting();

export function ConsoleLogCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('UVP DEBUG');
  const [copied, setCopied] = useState(false);
  const logsRef = useRef<LogEntry[]>([]);

  useEffect(() => {
    const handler = (entry: LogEntry) => {
      logsRef.current = [entry, ...logsRef.current].slice(0, 200);
      setLogs([...logsRef.current]);
    };
    _subscribers.add(handler);
    return () => { _subscribers.delete(handler); };
  }, []);

  const filtered = filter.trim()
    ? logs.filter(l => l.message.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  const handleCopy = async () => {
    const text = filtered
      .slice().reverse()
      .map(l => `[${l.time}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: 160, right: 14, zIndex: 99998,
          width: 42, height: 42, borderRadius: 21,
          background: 'rgba(0,0,0,0.82)',
          border: '1.5px solid rgba(239,68,68,0.6)',
          color: 'rgba(239,68,68,0.9)', fontSize: 10, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace',
          boxShadow: '0 2px 12px rgba(0,0,0,0.40)',
        }}
      >
        LOG
      </button>
    );
  }

  return (
    <div
      onClick={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      style={{
        position: 'fixed', bottom: 90, left: 8, right: 8, zIndex: 99998,
        background: '#0A0A0F',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        maxHeight: '60vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.65)',
        overflow: 'hidden',
        fontFamily: 'monospace',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#E2E8F0', flex: 1 }}>
          CONSOLE CAPTURE ({filtered.length})
        </span>
        <button
          onClick={handleCopy}
          style={{ fontSize: 10, color: copied ? '#22C55E' : '#3B82F6', background: 'none', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}
        >
          {copied ? 'COPIED ✓' : 'COPY'}
        </button>
        <button
          onClick={() => { logsRef.current = []; setLogs([]); }}
          style={{ fontSize: 10, color: '#6B7280', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}
        >
          CLR
        </button>
        <button
          onClick={() => setIsOpen(false)}
          style={{ fontSize: 16, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}
        >
          ✕
        </button>
      </div>

      {/* Filter */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter logs... (empty = show all)"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
            padding: '4px 8px', fontSize: 11, color: '#E2E8F0',
            fontFamily: 'monospace', outline: 'none',
          }}
        />
      </div>

      {/* Logs */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px', maxHeight: '45vh' }}>
        {filtered.length === 0
          ? <div style={{ fontSize: 11, color: '#6B7280', padding: '12px 0', textAlign: 'center' }}>
              {logs.length === 0 ? 'No logs captured yet. Play some videos.' : `No logs matching "${filter}"`}
            </div>
          : filtered.map(log => (
              <div key={log.id} style={{ fontSize: 10, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 6 }}>
                <span style={{ color: '#6B7280', flexShrink: 0 }}>{log.time}</span>
                <span style={{ color: log.level === 'error' ? '#EF4444' : log.level === 'warn' ? '#F59E0B' : '#E2E8F0', wordBreak: 'break-all' }}>{log.message}</span>
              </div>
            ))
        }
      </div>
    </div>
  );
}

export default ConsoleLogCapture;
