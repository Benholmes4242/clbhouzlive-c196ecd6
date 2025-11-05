/**
 * Hub Glass Blank Page
 * 
 * Full-screen glass background with header, rendered over origin page.
 * 
 * Internal identifier: page.hub.glass.blank
 */

import React from 'react';
import { HubPageHeader } from '../components/HubPageHeader';
import { Z } from '@/config/zIndex';
import '../home/hubTheme.css';

export default function HubGlassBlankPage() {
  return (
    <>
      {/* Glass background */}
      <div
        className="fixed inset-0 hub-glass-blank"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(120px)',
          WebkitBackdropFilter: 'blur(120px)',
          zIndex: Z.hub,
        }}
      />

      {/* Header */}
      <div
        className="fixed inset-x-0 top-0 flex flex-col"
        style={{
          zIndex: Z.hub,
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <HubPageHeader title="Glass Effect" />
      </div>
    </>
  );
}
