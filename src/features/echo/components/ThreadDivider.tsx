import React from 'react';
import clsx from 'clsx';
import './thread-divider.css';

export const ThreadDivider: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={clsx('thread-divider', className)}
      aria-hidden="true"
      role="separator"
    />
  );
};

export default ThreadDivider;
