 /**
  * EchoPageComposer - WhatsApp-style pill input bar
  * With voice input, character limit, and full accessibility
  */
 
 import React, { forwardRef, useEffect } from 'react';
 import { ArrowUp, Square, Mic } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useSpeechToText } from '@/hooks/useSpeechToText';
 import { haptic } from '@/utils/haptics';
 import { toast } from 'sonner';
 import { ECHO_LIMITS, ECHO_COLORS } from '@/features/echo/constants/echoTheme';
 
 interface EchoPageComposerProps {
   value: string;
   onChange: (value: string) => void;
   onSend: () => void;
   onAbort: () => void;
   isStreaming: boolean;
   disabled?: boolean;
   cooldown?: number | null;
 }
 
 export const EchoPageComposer = forwardRef<HTMLInputElement, EchoPageComposerProps>(
   function EchoPageComposer(
     { value, onChange, onSend, onAbort, isStreaming, disabled, cooldown },
     ref
   ) {
     const { isListening, transcript, startListening, stopListening, isSupported, error } = useSpeechToText();
 
     // Insert transcript into input when voice recognition produces text
     useEffect(() => {
       if (transcript) {
         onChange(transcript);
       }
     }, [transcript, onChange]);
 
     // Show toast on voice input error
     useEffect(() => {
       if (error) {
         toast.error(error);
       }
     }, [error]);
 
     const handleKeyDown = (e: React.KeyboardEvent) => {
       if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault();
         if (isStreaming) {
           onAbort();
         } else {
           onSend();
         }
       }
     };
 
     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const newValue = e.target.value;
       if (newValue.length <= ECHO_LIMITS.maxInputLength) {
         onChange(newValue);
       }
     };
 
     const handleButtonClick = () => {
       if (isStreaming) {
         haptic('medium');
         onAbort();
       } else if (canSend) {
         haptic('light');
         onSend();
       }
     };
 
     const handleMicClick = () => {
       if (isListening) {
         stopListening();
       } else {
         haptic('light');
         startListening();
       }
     };
 
     const canSend = value.trim().length > 0 && !disabled;
     const charsRemaining = ECHO_LIMITS.maxInputLength - value.length;
     const showCharCount = charsRemaining <= ECHO_LIMITS.warningThreshold;
 
     return (
       <div className="relative flex items-center gap-2 h-[50px] bg-white rounded-full px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
         <input
           ref={ref}
           type="text"
           value={value}
           onChange={handleChange}
           onKeyDown={handleKeyDown}
           placeholder={cooldown ? `Wait ${cooldown}s...` : "Ask Echo..."}
           disabled={disabled}
           aria-label="Type a message to Echo"
           maxLength={ECHO_LIMITS.maxInputLength}
           className="flex-1 bg-transparent outline-none text-[0.9375rem] text-[#1D1D1F] placeholder:text-[#8E8E93] disabled:cursor-not-allowed"
         />
 
         {/* Character count warning */}
         {showCharCount && (
           <span 
             className={cn(
               "absolute right-14 text-[0.6875rem]",
               charsRemaining <= 50 ? "text-red-500" : "text-[#8E8E93]"
             )}
           >
             {charsRemaining}
           </span>
         )}
 
         {/* Send/Stop/Mic button */}
         {isStreaming ? (
           <button
             onClick={handleButtonClick}
             className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FFBF66] transition-all active:scale-95"
             aria-label="Stop generating"
           >
             <Square className="w-4 h-4 text-white fill-white" />
           </button>
         ) : canSend ? (
           <button
             onClick={handleButtonClick}
             className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FFBF66] transition-all active:scale-95"
             aria-label="Send message"
           >
             <ArrowUp className="w-5 h-5 text-white" />
           </button>
         ) : isSupported ? (
           <button
             onClick={handleMicClick}
             className={cn(
               "w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95",
               isListening ? "bg-red-500 animate-pulse" : "bg-transparent"
             )}
             aria-label={isListening ? "Stop listening" : "Voice input"}
           >
             <Mic className={cn("w-5 h-5", isListening ? "text-white" : "text-[#8E8E93]")} />
           </button>
         ) : (
           // If voice not supported, show disabled send button
           <button
             disabled
             className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent opacity-50"
             aria-label="Send message"
           >
             <ArrowUp className="w-5 h-5 text-[#8E8E93]" />
           </button>
         )}
       </div>
     );
   }
 );
