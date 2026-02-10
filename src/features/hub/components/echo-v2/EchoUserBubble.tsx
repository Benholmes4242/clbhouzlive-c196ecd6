 /**
  * EchoUserBubble - Cleo glass-style right-aligned user message bubble
  * White glass with orange tint on warm gradient canvas
  */
 
 import React from 'react';
 
 interface EchoUserBubbleProps {
   content: string;
 }
 
 export function EchoUserBubble({ content }: EchoUserBubbleProps) {
   return (
     <div className="flex justify-end" role="listitem">
       <div 
         className="max-w-[80%] px-[15px] py-[11px] rounded-[18px_18px_4px_18px] backdrop-blur-[12px]"
         style={{
           background: 'rgba(255,255,255,0.85)',
           border: '1px solid rgba(249,115,22,0.1)',
           boxShadow: '0 1px 5px rgba(249,115,22,0.05)',
         }}
       >
         <p className="text-[14px] leading-relaxed whitespace-pre-wrap select-text" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>
           {content}
         </p>
       </div>
     </div>
   );
 }
