/**
 * HubEchoCard - Echo section of Hub 2.0
 * Phase 3: Voice input, recent context, Caddie Whisper suggestions
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Mic, MicOff, CloudSun, Users, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import echoMascot from '@/assets/echo-mascot.png';

interface CaddieWhisper {
  id: string;
  icon: React.ReactNode;
  message: string;
  action?: () => void;
}

interface HubEchoCardProps {
  cardStyle: React.CSSProperties;
  onOpenEcho: (initialPrompt?: string) => void;
  recentContext?: string | null;
}

// Golf-specific quick prompts
const QUICK_PROMPTS = [
  "Find a course",
  "Weather check",
  "Trip ideas",
  "Fix my slice",
];

// Dynamic greetings for Echo
const ECHO_GREETINGS = [
  "Ready to plan your next round?",
  "What's on your mind?",
  "Need course recommendations?",
  "Let's find you a tee time",
];

export function HubEchoCard({ cardStyle, onOpenEcho, recentContext }: HubEchoCardProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [caddieWhispers, setCaddieWhispers] = useState<CaddieWhisper[]>([]);
  
  // Rotate greetings every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % ECHO_GREETINGS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Generate contextual Caddie Whispers (proactive suggestions)
  useEffect(() => {
    const whispers: CaddieWhisper[] = [];
    const hour = new Date().getHours();
    
    // Weather-aware whisper (morning/afternoon)
    if (hour >= 6 && hour <= 18) {
      whispers.push({
        id: 'weather',
        icon: <CloudSun className="w-4 h-4 text-amber-500" />,
        message: hour < 12 
          ? "Perfect morning for golf — check today's weather" 
          : "Afternoon tee times looking good",
        action: () => onOpenEcho("What's the golf weather like today?"),
      });
    }
    
    // Social-aware whisper
    whispers.push({
      id: 'social',
      icon: <Users className="w-4 h-4 text-blue-500" />,
      message: "Friends may be looking for a game this weekend",
      action: () => onOpenEcho("Who's playing this weekend?"),
    });
    
    // Discovery whisper
    whispers.push({
      id: 'discovery',
      icon: <Lightbulb className="w-4 h-4 text-green-500" />,
      message: "Discover a new course near you",
      action: () => onOpenEcho("Find me a new course to try"),
    });
    
    setCaddieWhispers(whispers.slice(0, 2)); // Show max 2 whispers
  }, [onOpenEcho]);
  
  // Voice input handler (placeholder - would integrate with speech recognition)
  const handleVoiceInput = useCallback(() => {
    haptic('medium');
    setIsListening((prev) => !prev);
    
    if (!isListening) {
      // Start voice recognition (placeholder)
      // In production, this would use Web Speech API or a service
      setTimeout(() => {
        setIsListening(false);
        // Simulate voice input result
        onOpenEcho("What courses are near me?");
      }, 2000);
    }
  }, [isListening, onOpenEcho]);
  
  const handlePromptClick = (prompt: string) => {
    haptic('light');
    onOpenEcho(prompt);
  };

  return (
    <div
      className="rounded-2xl overflow-visible relative"
      style={{
        ...cardStyle,
        marginTop: '48px',
      }}
    >
      {/* Echo Mascot - Overlapping */}
      <div 
        className="absolute overflow-visible pointer-events-none"
        style={{
          left: '16px',
          top: '-56px',
          width: '100px',
          height: '100px',
        }}
      >
        <motion.img 
          src={echoMascot} 
          alt="Echo" 
          className="w-full h-full object-contain"
          style={{ 
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.12))',
          }}
          animate={{ 
            scale: [1, 1.02, 1],
            y: [0, -2, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      
      {/* Header */}
      <button
        onClick={() => onOpenEcho()}
        className="w-full text-left p-4 pb-3"
      >
        <div className="flex items-start justify-between pl-24">
          <div className="flex-1">
            <span className="text-body-lg font-semibold text-foreground block">Echo</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentPromptIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-body-sm text-secondary block mt-0.5"
              >
                {ECHO_GREETINGS[currentPromptIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
          <ChevronRight className="w-5 h-5 text-tertiary mt-1" />
        </div>
      </button>
      
      {/* Caddie Whisper - Proactive suggestions (Phase 3) */}
      {caddieWhispers.length > 0 && (
        <div className="px-4 pb-3">
          <AnimatePresence>
            {caddieWhispers.slice(0, 1).map((whisper) => (
              <motion.button
                key={whisper.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => {
                  haptic('light');
                  whisper.action?.();
                }}
                className="w-full flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/40 border border-amber-200/50 hover:bg-white/60 transition-colors"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center">
                  {whisper.icon}
                </div>
                <span className="text-body-sm text-foreground/80 text-left flex-1">
                  {whisper.message}
                </span>
                <ChevronRight className="w-4 h-4 text-tertiary" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Recent Context Display (Phase 3) */}
      {recentContext && (
        <div className="px-4 pb-3">
          <button
            onClick={() => onOpenEcho()}
            className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-100/50 hover:bg-amber-100/70 transition-colors"
          >
            <span className="text-meta text-amber-700">Recently:</span>
            <span className="text-body-sm text-amber-800 truncate flex-1 text-left">
              "{recentContext}"
            </span>
          </button>
        </div>
      )}
      
      {/* Quick Prompt Chips */}
      <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {QUICK_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className="flex-shrink-0 py-2 px-3 rounded-full text-body-sm font-medium text-primary-accent bg-primary-accent/10 hover:bg-primary-accent/15 active:bg-primary-accent/20 transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
      
      {/* Input Field with Voice (Phase 3) */}
      <div className="px-4 pb-4">
        <div className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-white/50 border border-black/5">
          <button
            onClick={() => onOpenEcho()}
            className="flex-1 text-left text-body-sm text-tertiary"
          >
            Ask Echo anything golf...
          </button>
          <motion.button
            onClick={handleVoiceInput}
            whileTap={{ scale: 0.95 }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isListening 
                ? 'bg-red-500 text-white' 
                : 'bg-primary-accent/10 text-primary-accent hover:bg-primary-accent/20'
            }`}
          >
            {isListening ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <MicOff className="w-4 h-4" />
              </motion.div>
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </motion.button>
        </div>
        
        {/* Listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center justify-center gap-2"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-red-500"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ 
                      duration: 0.4, 
                      repeat: Infinity, 
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
              <span className="text-meta text-red-500 font-medium">Listening...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
