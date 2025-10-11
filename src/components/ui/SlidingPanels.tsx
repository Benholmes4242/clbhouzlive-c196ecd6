import React from 'react';

type Key = string;

export default function SlidingPanels<T extends Key>({
  activeKey,
  order,
  children,
}: {
  activeKey: T;
  order: readonly T[];
  children: (key: T) => React.ReactNode;
}) {
  const [prevKey, setPrevKey] = React.useState<T>(activeKey);
  const [outgoing, setOutgoing] = React.useState<React.ReactNode | null>(null);

  React.useEffect(() => {
    if (activeKey === prevKey) return;
    setOutgoing(children(prevKey));
    const t = window.setTimeout(() => {
      setOutgoing(null);
      setPrevKey(activeKey);
    }, 300); // match CSS animation duration
    return () => clearTimeout(t);
  }, [activeKey, prevKey, children]);

  const fromIndex = order.indexOf(prevKey);
  const toIndex = order.indexOf(activeKey);
  const direction = toIndex > fromIndex ? 'forward' : 'backward';

  return (
    <div className="relative overflow-hidden">
      {outgoing && (
        <div
          key={`out-${String(prevKey)}`}
          className={`panel absolute inset-0 animate-out-${
            direction === 'forward' ? 'left' : 'right'
          }`}
        >
          {outgoing}
        </div>
      )}
      <div
        key={`in-${String(activeKey)}`}
        className={`panel animate-in-${
          direction === 'forward' ? 'right' : 'left'
        }`}
      >
        {children(activeKey)}
      </div>
    </div>
  );
}
