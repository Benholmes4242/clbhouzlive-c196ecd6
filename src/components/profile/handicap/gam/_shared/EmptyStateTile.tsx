import React from 'react';

const SQUIRCLE_MASK_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 0h20c22.091 0 40 17.909 40 40v20c0 22.091-17.909 40-40 40H40C17.909 100 0 82.091 0 60V40C0 17.909 17.909 0 40 0z'/%3E%3C/svg%3E\")";

const maskStyle: React.CSSProperties = {
  WebkitMaskImage: SQUIRCLE_MASK_URL,
  maskImage: SQUIRCLE_MASK_URL,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

export const EmptyStateTile: React.FC<{ tint?: 'amber' | 'slate'; children: React.ReactNode }> = ({
  tint = 'amber',
  children,
}) => (
  <div style={{ width: 64, height: 64, position: 'relative', margin: '0 auto 18px' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        ...maskStyle,
        background:
          tint === 'amber'
            ? 'linear-gradient(135deg, rgba(251,188,46,0.18), rgba(247,147,30,0.12))'
            : 'rgba(15,23,42,0.05)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  </div>
);

export default EmptyStateTile;
