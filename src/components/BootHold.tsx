import React from 'react';
import wordmark from '@/assets/clbhouz-wordmark.png.asset.json';

const CANVAS = '#15171F';
const MARK = '/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png';

/**
 * Full-viewport dark hold shown while the auth session resolves on cold
 * start. Mirrors the AppDownloadGate frame exactly: fixed inset:0 at the
 * same top zIndex layer, on the splash canvas (#15171F), with the SAME
 * IDENTITY BAND — mark then wordmark, same sizes, same 48px top pad, same
 * 420 max-width column.
 *
 * IDENTITY BAND ONLY. No figures, no headline, no badges: this is a splash
 * inside the app and it must never call an RPC on boot. Match the frame, not
 * the content. Both files must move together or the app flashes on launch.
 */
const BootHold: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: 'fixed',
      inset: 0,
      background: CANVAS,
      zIndex: 2147483000,
    }}
  >
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 420,
        margin: '0 auto',
        padding: '48px 24px calc(env(safe-area-inset-bottom, 0px) + 40px)',
      }}
    >
      <img
        src={MARK}
        alt=""
        width={72}
        height={72}
        style={{ display: 'block', width: 72, height: 72 }}
        draggable={false}
      />
      <img
        src={wordmark.url}
        alt=""
        style={{
          display: 'block',
          marginTop: 18,
          height: 26,
          width: 'auto',
          filter: 'invert(1)',
        }}
        draggable={false}
      />
    </div>
  </div>
);


export default BootHold;
