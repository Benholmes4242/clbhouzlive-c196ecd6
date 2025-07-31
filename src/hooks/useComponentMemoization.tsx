import { memo, useMemo, useCallback, useRef } from 'react';

// Deep comparison for complex objects
const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  }
  
  return false;
};

// Enhanced memo with deep comparison
export const deepMemo = <T extends React.ComponentType<any>>(
  Component: T,
  compare?: (prevProps: any, nextProps: any) => boolean
): React.MemoExoticComponent<T> => {
  return memo(Component, compare || deepEqual);
};

// Stable callback hook with dependencies comparison
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T => {
  const depsRef = useRef(deps);
  const callbackRef = useRef(callback);

  if (!deepEqual(depsRef.current, deps)) {
    depsRef.current = deps;
    callbackRef.current = callback;
  }

  return useCallback(callbackRef.current, []);
};

// Memoized selector hook for complex state derivations
export const useMemoizedSelector = <T, R>(
  data: T,
  selector: (data: T) => R,
  equalityFn: (a: R, b: R) => boolean = deepEqual
): R => {
  const resultRef = useRef<R>();
  const dataRef = useRef<T>();

  return useMemo(() => {
    if (!deepEqual(dataRef.current, data)) {
      dataRef.current = data;
      const newResult = selector(data);
      
      if (!equalityFn(resultRef.current as R, newResult)) {
        resultRef.current = newResult;
      }
    }
    
    return resultRef.current as R;
  }, [data, selector, equalityFn]);
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>();
  
  // Mark render start
  renderStartTime.current = performance.now();
  
  // Log render time after component updates
  useMemo(() => {
    const renderTime = performance.now() - (renderStartTime.current || 0);
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  }, [componentName]);
};