 /**
  * EchoPendingState - Shows while prompt is captured but hook is initializing
  * Provides immediate visual feedback that the question is being processed
  */
 
 import React from 'react';
 import { motion } from 'framer-motion';
 
 interface EchoPendingStateProps {
   prompt: string;
 }
 
 export function EchoPendingState({ prompt }: EchoPendingStateProps) {
   return (
     <div className="h-full flex flex-col items-center justify-center px-5 pb-20">
       {/* Thinking orb with animated glow */}
       <div className="relative mb-6">
         {/* Pulsing glow layer */}
         <motion.div 
           className="absolute inset-0 rounded-full bg-[#FFBF66] blur-2xl scale-[2]"
           animate={{ 
             opacity: [0.2, 0.4, 0.2],
             scale: [1.8, 2.2, 1.8],
           }}
           transition={{ 
             duration: 1.5, 
             repeat: Infinity,
             ease: 'easeInOut',
           }}
         />
         
         {/* Main orb */}
         <div className="relative w-20 h-20 rounded-full bg-[#FFBF66] flex items-center justify-center shadow-lg">
           {/* Animated thinking dots */}
           <div className="flex items-center gap-1.5">
             {[0, 1, 2].map((i) => (
               <motion.div
                 key={i}
                 className="w-2 h-2 bg-white rounded-full"
                 animate={{ 
                   y: [0, -6, 0],
                   opacity: [0.6, 1, 0.6],
                 }}
                 transition={{
                   duration: 0.8,
                   repeat: Infinity,
                   delay: i * 0.15,
                   ease: 'easeInOut',
                 }}
               />
             ))}
           </div>
         </div>
       </div>
 
       {/* Status text */}
       <motion.p 
         className="text-[15px] text-[#8E8E93] text-center"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.2 }}
       >
         Processing your question...
       </motion.p>
 
       {/* Show the captured prompt */}
       <motion.div 
         className="mt-4 px-4 py-3 bg-white rounded-[18px] shadow-sm max-w-[300px]"
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.3 }}
       >
         <p className="text-[14px] text-[#1D1D1F] text-center line-clamp-2">
           "{prompt}"
         </p>
       </motion.div>
     </div>
   );
 }