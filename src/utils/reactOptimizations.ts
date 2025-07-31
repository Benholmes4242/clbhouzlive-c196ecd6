import React from 'react';

// HOC for automatic memoization of components with shallow comparison
export const withShallowMemo = <P extends object>(
  Component: React.ComponentType<P>
): React.MemoExoticComponent<React.ComponentType<P>> => {
  return React.memo(Component, (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    return prevKeys.every(key => 
      prevProps[key as keyof P] === nextProps[key as keyof P]
    );
  });
};

// HOC for conditional rendering to prevent unnecessary re-renders
export const withConditionalRender = <P extends object>(
  Component: React.ComponentType<P>,
  shouldRender: (props: P) => boolean
) => {
  return React.memo((props: P) => {
    if (!shouldRender(props)) {
      return null;
    }
    return React.createElement(Component, props);
  });
};

// Hook for stable object references
export const useStableObject = <T extends object>(obj: T): T => {
  const ref = React.useRef<T>(obj);
  
  const isEqual = React.useMemo(() => {
    const prevKeys = Object.keys(ref.current);
    const nextKeys = Object.keys(obj);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    return prevKeys.every(key => 
      ref.current[key as keyof T] === obj[key as keyof T]
    );
  }, [obj]);
  
  if (!isEqual) {
    ref.current = obj;
  }
  
  return ref.current;
};

// Hook for stable array references
export const useStableArray = <T>(arr: T[]): T[] => {
  const ref = React.useRef<T[]>(arr);
  
  const isEqual = React.useMemo(() => {
    if (ref.current.length !== arr.length) return false;
    return ref.current.every((item, index) => item === arr[index]);
  }, [arr]);
  
  if (!isEqual) {
    ref.current = arr;
  }
  
  return ref.current;
};

// Optimized list rendering with keys
export const renderOptimizedList = <T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  getKey: (item: T, index: number) => string | number
) => {
  return items.map((item, index) => 
    React.createElement(
      'div',
      { key: getKey(item, index) },
      renderItem(item, index)
    )
  );
};

// Component factory with built-in optimizations
export const createOptimizedComponent = <P extends object>(
  render: (props: P) => React.ReactElement | null,
  displayName?: string
) => {
  const Component = React.memo(render);
  
  if (displayName) {
    Component.displayName = displayName;
  }
  
  return Component;
};