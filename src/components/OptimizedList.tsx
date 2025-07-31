import React, { memo, useMemo } from 'react';
import { useVirtualizedList } from '@/hooks/useVirtualizedList';
import { deepMemo } from '@/hooks/useComponentMemoization';

interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  className?: string;
  keyExtractor: (item: T, index: number) => string;
  overscan?: number;
  enableVirtualization?: boolean;
}

function OptimizedListComponent<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  className = '',
  keyExtractor,
  overscan = 5,
  enableVirtualization = true,
}: OptimizedListProps<T>) {
  const shouldVirtualize = enableVirtualization && items.length > 20;

  const { visibleItems, containerProps, innerProps } = useVirtualizedList({
    items,
    itemHeight,
    containerHeight,
    overscan,
  });

  const memoizedItems = useMemo(() => {
    const itemsToRender = shouldVirtualize ? visibleItems : items.map((item, index) => ({ item, index }));
    
    return itemsToRender.map(({ item, index, style }) => (
      <div
        key={keyExtractor(item, index)}
        style={style}
        className={shouldVirtualize ? '' : 'w-full'}
      >
        {renderItem(item, index)}
      </div>
    ));
  }, [shouldVirtualize ? visibleItems : items, renderItem, keyExtractor, shouldVirtualize]);

  if (!shouldVirtualize) {
    return (
      <div className={`${className} space-y-1`}>
        {memoizedItems}
      </div>
    );
  }

  return (
    <div {...containerProps} className={className}>
      <div {...innerProps}>
        {memoizedItems}
      </div>
    </div>
  );
}

export const OptimizedList = deepMemo(OptimizedListComponent) as typeof OptimizedListComponent;