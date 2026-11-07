/** Canonical feed single/double-tap surface shared by single media and grid tiles. */
import React from 'react';
import { createTapHandler } from './mediaTap';
export const SingleMediaTapButton: React.FC<{
  onSingle: () => void;
  onDouble: () => void;
  innerRef: React.RefObject<HTMLButtonElement>;
  postId: string;
  fill?: boolean;
  children: React.ReactNode;
}> = ({ onSingle, onDouble, innerRef, postId, fill = false, children }) => {
  const handleTap = React.useMemo(() => createTapHandler({ onSingle: () => onSingle(), onDouble: () => onDouble() }), [onSingle, onDouble]);
  return <button type="button" ref={innerRef} data-post-id={postId} onClick={handleTap} style={{ display: 'block', width: '100%', ...(fill ? { height: '100%' } : {}), background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>{children}</button>;
};