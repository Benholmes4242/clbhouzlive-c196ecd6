import * as React from 'react';

export function EchoTypingBar() {
  return (
    <div className="w-full mt-2">
      <div
        className="w-full rounded-full"
        style={{
          height: 'var(--typing-height)',
          background: 'var(--typing-track)'
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: 'var(--typing-fill)',
            width: '100%',
            backgroundSize: '200% 100%',
            animation: 'echo-drift 1.6s linear infinite'
          }}
        />
      </div>
    </div>
  );
}
