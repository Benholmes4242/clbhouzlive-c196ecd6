'use client';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReviewPanel } from './panel';

export function initDesignReviewIsland() {
  const id = '__drm_root__';
  let mount = document.getElementById(id);
  if (!mount) {
    mount = document.createElement('div');
    mount.id = id;
    document.body.appendChild(mount);
  }
  const root = createRoot(mount);
  root.render(<ReviewPanel />);
}
