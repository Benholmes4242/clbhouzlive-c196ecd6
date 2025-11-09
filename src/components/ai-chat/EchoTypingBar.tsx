import * as React from 'react';

export function EchoTypingBar() {
  return (
    <div
      className="relative w-full rounded-xl overflow-hidden"
      style={{
        height: 12,
        background: 'rgba(0,0,0,0.25)'
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.0) 100%)',
          backgroundSize: '200% 100%',
          animation: 'echo-drift 1.5s linear infinite'
        }}
      />
      <style>{`
        @keyframes echo-drift {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}
