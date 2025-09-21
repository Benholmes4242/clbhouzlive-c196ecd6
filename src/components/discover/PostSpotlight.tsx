import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface PostSpotlightProps {
  children: React.ReactNode;
  isSpotlight?: boolean;
  className?: string;
}

const PostSpotlight: React.FC<PostSpotlightProps> = ({
  children,
  isSpotlight = false,
  className = ''
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (!isSpotlight) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={`relative ${className}`}
      initial={prefersReducedMotion ? { backgroundColor: 'rgba(247, 147, 30, 0.1)' } : {
        backgroundColor: 'rgba(247, 147, 30, 0.1)',
        boxShadow: '0 0 0 2px rgba(247, 147, 30, 0.3)',
        scale: 1.02
      }}
      animate={prefersReducedMotion ? { backgroundColor: 'rgba(247, 147, 30, 0)' } : {
        backgroundColor: 'rgba(247, 147, 30, 0)',
        boxShadow: '0 0 0 0px rgba(247, 147, 30, 0)',
        scale: 1
      }}
      transition={{
        duration: prefersReducedMotion ? 0.2 : 1.2,
        ease: "easeOut",
        boxShadow: { duration: 1.2 },
        scale: { duration: 0.8, ease: "easeOut" }
      }}
    >
      {!prefersReducedMotion && (
        <>
          {/* Liquid glass sheen sweep */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none rounded-lg"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '100%', opacity: [0, 1, 0] }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: "easeInOut"
            }}
          />
          
          {/* Subtle border glow */}
          <motion.div
            className="absolute inset-0 rounded-lg border border-brand-orange/20 pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
          />
        </>
      )}
      
      {children}
    </motion.div>
  );
};

export default PostSpotlight;