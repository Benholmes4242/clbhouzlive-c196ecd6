/**
 * ConsoleLogCapture — direct instrumentation log store.
 * Any module can import devLog/devWarn/devError to write directly
 * to the in-memory buffer. No console interception needed.
 * Works in all environments including WKWebView native bridges.
 */
import { useEffect, useState, useRef } from 'react';

interface LogEntry {
  id: number;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  time: string;
}

let _logId = 0;
const _buffer: LogEntry[] = [];
const _subscribers = new Set<(logs: LogEntry[]) => void>();
const MAX_BUFFER = 300;

export function captureLog(level: LogEntry['level'], ...args: any[]): void {
  const message = args.map(a => {
    try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
    catch { return String(a); }
  }).join(' ');
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;
  const entry: LogEntry = { id: _logId++, level, message, time };
  _buffer.push(entry);
  if (_buffer.length > MAX_BUFFER) _buffer.shift();
  _subscribers.forEach(fn => fn([..._buffer]));
}

// Convenience exports for direct instrumentation
export const devLog = (...args: any[]) => captureLog('log', ...args);
export const devWarn = (...args: any[]) => captureLog('warn', ...args);
export const devError = (...args: any[]) => captureLog('error', ...args);

export function ConsoleLogCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const logsRef = useRef<LogEntry[]>([]);

  useEffect(() => {
    const handler = (allLogs: LogEntry[]) => {
      logsRef.current = [...allLogs].reverse().slice(0, 300);
      setLogs([...logsRef.current]);
    };
    // Replay any logs that fired before this component subscribed
    if (_buffer.length > 0) {
      logsRef.current = [..._buffer].reverse().slice(0, 300);
      setLogs([...logsRef.current]);
    }
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

  // Production gate — only render when debug mode is enabled
  const debugEnabled = (() => { try { return localStorage.getItem('clbhouz-video-debug') === 'true'; } catch { return false; } })();
  if (!debugEnabled) return null;

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
