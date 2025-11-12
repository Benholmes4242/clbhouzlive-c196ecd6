import React from 'react';
import clsx from 'clsx';
import './thread-divider.css';

export const ThreadDivider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('thread-divider', className)} role="separator" aria-hidden="true" />
);

export default ThreadDivider;
