import React from 'react';

interface ExpandableTextProps {
  children: React.ReactNode;
  maxLines?: number;
  moreLabel?: string;
  className?: string;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({
  children,
  maxLines = 2,
  moreLabel = "… more",
  className = ""
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <p className={`${className} ${isOpen ? '' : `line-clamp-${maxLines}`}`}>
      {children}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="ml-1 underline underline-offset-2 decoration-white/50 hover:decoration-white/80 transition-colors"
        >
          {moreLabel}
        </button>
      )}
    </p>
  );
};

export default ExpandableText;