/**
 * Centralized logger with debug flag to reduce console noise in production
 */

const DEBUG_ENABLED = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, tag: string, ...args: unknown[]) {
  // Skip debug logs in production
  if (!DEBUG_ENABLED && level === 'debug') return;
  
  const prefix = `[${tag}]`;
  
  switch (level) {
    case 'debug':
      console.debug(prefix, ...args);
      break;
    case 'info':
      console.info(prefix, ...args);
      break;
    case 'warn':
      console.warn(prefix, ...args);
      break;
    case 'error':
      console.error(prefix, ...args);
      break;
  }
}

export const AppLog = {
  debug: (tag: string, ...args: unknown[]) => log('debug', tag, ...args),
  info: (tag: string, ...args: unknown[]) => log('info', tag, ...args),
  warn: (tag: string, ...args: unknown[]) => log('warn', tag, ...args),
  error: (tag: string, ...args: unknown[]) => log('error', tag, ...args),
};

// Re-export for convenience
export const logger = AppLog;
