 /**
  * EchoThinkingCard - WhatsApp-style "typing" indicator bubble
  * Shows while waiting for first token to arrive
  */
 
 import React from 'react';
 import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
 
 export function EchoThinkingCard() {
   const prefersReduced = usePrefersReducedMotion();
 
   return (
     <div className="flex justify-start" role="status" aria-label="Echo is thinking">
        <div 
          className="px-4 py-3 rounded-[20px_20px_20px_4px] backdrop-blur-[16px]"
          style={{
            background: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
         {/* Animated typing indicator - three bouncing dots */}
         <div className="flex items-center gap-1">
           {[0, 1, 2].map((i) => (
             <span
               key={i}
                className={`w-[7px] h-[7px] rounded-full ${prefersReduced ? '' : 'animate-bounce'}`}
                style={{
                  background: '#FBBF24',
                  ...(prefersReduced ? { opacity: 0.7 } : {
                 opacity: 0.7,
                 animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.8s',
                  }),
                }}
             />
           ))}
         </div>
       </div>
     </div>
   );
 }
