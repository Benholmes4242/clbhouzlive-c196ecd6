/**
 * Hub Glass Blank Page
 * 
 * A standalone page that renders only the Smoke/Liquid Glass background
 * with no UI, content, or layout. Uses the exact same glass spec as Hub.
 * 
 * Internal identifier: page.hub.glass.blank
 */

import React from 'react';
import '../home/hubTheme.css';

export default function HubGlassBlankPage() {
  return (
    <div
      className="hub-glass-blank"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
        zIndex: 9999,
        pointerEvents: 'none', // Allow clicking through to test
      }}
    />
  );
}
