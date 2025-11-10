import * as React from 'react';

export function EchoTypingBar() {
  return (
    <div className="w-full mt-2">
      <div
        className="relative w-full rounded-xl"
        style={{
          height: 'var(--typing-height)',
          background: 'rgba(255,255,255,0.10)',
          border: '0',
          boxShadow: '0 8px 18px rgba(0,0,0,0.28)'
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-xl"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.12) 100%)',
            width: '100%',
            backgroundSize: '200% 100%',
            animation: 'echo-drift 1.85s linear infinite'
          }}
        />
      </div>
    </div>
  );
}
