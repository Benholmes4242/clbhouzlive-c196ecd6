/**
 * NineDotsIcon - Grid menu icon for Tour Hub navigation
 * Uses CgMenuGridR from react-icons for a modern rounded grid look
 */

import React from 'react';
import { CgMenuGridR } from 'react-icons/cg';

interface NineDotsIconProps {
  className?: string;
  size?: number;
}

export function NineDotsIcon({ className, size = 20 }: NineDotsIconProps) {
  return (
    <CgMenuGridR 
      size={size} 
      className={className}
    />
  );
}
