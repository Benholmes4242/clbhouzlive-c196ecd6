import React from 'react';

interface GlassContentSectionProps {
  children: React.ReactNode;
  className?: string;
}

const GlassContentSection: React.FC<GlassContentSectionProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`glass-card rounded-2xl p-4 md:p-6 mx-4 md:mx-auto max-w-4xl ${className}`}>
      {children}
    </div>
  );
};

export default GlassContentSection;