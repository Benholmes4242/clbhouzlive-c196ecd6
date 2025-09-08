import React, { useState, useEffect } from 'react';

interface MountedGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * MountedGuard - Prevents hydration mismatches by only rendering children after mount
 * 
 * Use this component when you need to prevent SSR/CSR differences that could cause
 * hydration mismatches or hook order issues.
 * 
 * @example
 * <MountedGuard fallback={<div className="aspect-square" />}>
 *   <ComponentThatUsesWindow />
 * </MountedGuard>
 */
export const MountedGuard: React.FC<MountedGuardProps> = ({ 
  children, 
  fallback = null,
  className 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <>{children}</>;
};

export default MountedGuard;