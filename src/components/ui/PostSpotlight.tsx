import React from 'react';
import { motion } from 'framer-motion';

interface PostSpotlightProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

export const PostSpotlight: React.FC<PostSpotlightProps> = ({ 
  isActive, 
  children, 
  className = "" 
}) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <motion.div
      className={`relative ${className}`}
      initial={prefersReducedMotion ? { opacity: 1 } : { scale: 1 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { 
        scale: [1, 1.02, 1],
        transition: {
          duration: 1.2,
          ease: "easeInOut",
          times: [0, 0.3, 1]
        }
      }}
    >
      {/* Gentle glow ring */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-xl ring-2 ring-brand-orange/40 pointer-events-none"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [0.98, 1.01, 1],
          }}
          transition={{
            duration: 1.2,
            ease: "easeInOut",
            times: [0, 0.4, 1]
          }}
        />
      )}
      
      {/* Subtle elevation */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-xl shadow-[0_8px_24px_rgba(255,143,0,0.15)] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 1.2,
            ease: "easeInOut",
            times: [0, 0.35, 1]
          }}
        />
      )}

      {/* Reduced motion: simple tint */}
      {prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-brand-orange/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.4 }}
        />
      )}
      
      {children}
    </motion.div>
  );
};