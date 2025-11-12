import React from 'react';

export const ThreadDivider: React.FC = () => (
  <div 
    className="my-3 mx-auto" 
    style={{ 
      width: '70%', 
      height: '1px', 
      background: 'rgba(255,255,255,0.12)' 
    }} 
    role="separator" 
    aria-hidden="true" 
  />
);

export default ThreadDivider;
