import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ExpandableTextProps {
  children: React.ReactNode;
  maxLines?: number;
  moreLabel?: string;
  className?: string;
}

const ExpandableText = ({ 
  children, 
  maxLines = 2, 
  moreLabel = "… more", 
  className = "" 
}: ExpandableTextProps) => {
  const [open, setOpen] = useState(false);

  return (
    <p className={cn(className, !open && `line-clamp-${maxLines}`)}>
      {children} 
      {!open && (
        <button 
          onClick={() => setOpen(true)} 
          className="ml-1 underline underline-offset-2 opacity-75 hover:opacity-100 transition-opacity"
        >
          {moreLabel}
        </button>
      )}
    </p>
  );
};

export default ExpandableText;