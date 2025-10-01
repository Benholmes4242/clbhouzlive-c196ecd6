import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, History, Bookmark, MapPin, Mic, MicOff, BookOpen, Bot, Paperclip, ArrowUpRight, Settings } from 'lucide-react';
import { PiWaveform } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SlideOver } from '@/components/ui/slide-over';
import ChatMessageComponent from './ChatMessage';
import AIChatHistory from './AIChatHistory';
import CaddieLogs from './CaddieLogs';
import SwingCoach from './SwingCoach';
import EchoAvatar from './EchoAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useConversationSession } from '@/hooks/useConversationSession';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import EchoProtection from './EchoProtection';
import { useEchoProtection } from '@/hooks/useEchoProtection';
import { AnimatePresence, motion } from 'framer-motion';
import { subscribeAIOverlay, type AITab } from '@/controllers/aiOverlayController';

interface ChatMessageData {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface AIChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onHistoryStateChange?: (isHistoryOpen: boolean) => void;
  initialTab?: AITab;
}

const suggestedPrompts = [
  { text: "when is the next major?", emoji: "🏆" },
  { text: "Where should my ball position be?", emoji: "💭" },
  { text: "Best golf clubs near me", emoji: "📍" },
  { text: "Which driver loft should I use at 95 mph swing speed?", emoji: "🏌️" },
  { text: "Plan me a 5 course USA golf trip", emoji: "🚩" }
];

const AIChatOverlay: React.FC<AIChatOverlayProps> = ({ isOpen, onClose, onHistoryStateChange, initialTab }) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [activeTab, setActiveTab] = useState('chat');
  const [analysisText, setAnalysisText] = useState('');
  const [swingCoachAnalysisText, setSwingCoachAnalysisText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Echo Protection System
  const {
    isProtectionOpen,
    pendingOperation,
    requestEchoAccess,
    handleProtectionSuccess,
    handleProtectionClose
  } = useEchoProtection();

  // Conversation session management - for history only, don't restore messages in modal
  const conversationSession = useConversationSession({
    storageKey: 'clbhouz_ai_chat',
    isModalOpen: isOpen // Use actual modal state to properly save conversations
  });

  // Auto-scroll for chat messages
  const chatAutoScroll = useAutoScroll({
    dependencies: [messages],
    enabled: true,
    direction: 'bottom' // Chat messages are added at the bottom
  });

  // Auto-scroll for caddie logs (shared with CaddieLogs component)
  const logsAutoScroll = useAutoScroll({
    dependencies: [], // CaddieLogs will manage its own dependencies
    enabled: true,
    direction: 'top' // Latest logs are at the top
  });

  async function handleVoiceNote(transcribedText: string) {
    try {
      // Get current location for the note
      let locationData: { lat?: number; lng?: number; name?: string } = {};
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          
          locationData.lat = position.coords.latitude;
          locationData.lng = position.coords.longitude;
          
          // Get location name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          const data = await response.json();
          locationData.name = `${data.city || data.locality || ''}, ${data.principalSubdivision || ''}`.trim().replace(/^,\s*/, '');
        } catch (error) {
          console.log('Location access denied or failed');
        }
      }

      // Auto-tag golf terms
      const autoTagGolfTerms = (content: string): string[] => {
        const golfTerms = [
          'tree', 'bunker', 'green', 'slope', 'yardage', 'carry', 'pin', 'flag',
          'fairway', 'rough', 'water', 'hazard', 'dogleg', 'elevation', 'wind',
          'left', 'right', 'center', 'front', 'back', 'avoid', 'target'
        ];
        
        const foundTerms = golfTerms.filter(term => 
          content.toLowerCase().includes(term)
        );
        
        return [...new Set(foundTerms)]; // Remove duplicates
      };

      const tags = autoTagGolfTerms(transcribedText);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save to caddie logs
      const { error } = await supabase
        .from('caddie_logs')
        .insert({
          user_id: user.id,
          content: transcribedText,
          transcription: transcribedText,
          location_lat: locationData.lat,
          location_lng: locationData.lng,
          location_name: locationData.name,
          tags: tags.length > 0 ? tags : null
        });

      if (error) throw error;

      toast({
        title: "Caddie note saved",
        description: "Your voice note has been added to your caddie logs",
      });


    } catch (error) {
      console.error('Error saving voice note:', error);
      toast({
        title: "Error saving note",
        description: "Failed to save your caddie note. Please try again.",
        variant: "destructive"
      });
    }
  }

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording({
    onTranscriptionComplete: handleVoiceNote
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Notify parent about history state changes
  useEffect(() => {
    if (onHistoryStateChange) {
      onHistoryStateChange(showHistory);
    }
  }, [showHistory, onHistoryStateChange]);

  // Listen to controller for tab changes
  useEffect(() => {
    return subscribeAIOverlay((shouldOpen, tab) => {
      if (shouldOpen && tab) {
        setActiveTab(tab);
      }
    });
  }, []);

  // Ensure fresh start when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInputValue('');
      // Set initial tab from props or default to chat
      setActiveTab(initialTab || 'chat');
    }
  }, [isOpen, initialTab]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const location = `${data.city || data.locality || ''}, ${data.principalSubdivision || ''}`.trim().replace(/^,\s*/, '');
            setUserLocation(location);
            toast({
              title: "Location detected",
              description: `Using ${location} for location-based queries`,
            });
          } catch (error) {
            console.error('Error getting location name:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location access denied",
            description: "Please enable location access or specify your city manually",
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleClose = () => {
    // The conversation session hook will automatically save when modal closes
    // due to isModalOpen changing from true to false
    
    // Always reset chat for fresh session - don't restore previous messages
    setMessages([]);
    setInputValue('');
    setActiveTab('chat');
    
    // Close modal
    onClose();
  };

  const sendMessage = async (messageText: string, detailMode = false) => {
    if (!messageText.trim()) return;

    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    console.log('🐛 CHAT DEBUG - Creating user message:', {
      id: userMessage.id,
      type: userMessage.type,
      content: userMessage.content.substring(0, 100),
      timestamp: userMessage.timestamp
    });

    setMessages(prev => {
      console.log('🐛 CHAT DEBUG - Adding user message to local state:', {
        previousCount: prev.length,
        newCount: prev.length + 1
      });
      return [...prev, userMessage];
    });
    
    // Add user message to conversation session for history tracking
    console.log('🐛 CHAT DEBUG - Adding user message to conversation session...');
    conversationSession.addMessage(userMessage);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare conversation context (last 6 messages for context)
      const conversation = messages.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add location context if available and message contains "near me"
      let finalMessage = messageText;
      if (messageText.toLowerCase().includes('near me') && userLocation) {
        finalMessage = messageText.replace(/near me/gi, `near ${userLocation}`);
      } else if (messageText.toLowerCase().includes('near me') && !userLocation) {
        // Ask for location if not available
        const aiMessage: ChatMessageData = {
          id: Date.now().toString() + '_ai',
          type: 'ai',
          content: "I'd love to help you find golf options nearby! Could you please share your city or postcode?",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('clbhouz-pro-ai', {
        body: {
          message: finalMessage,
          conversation,
          detailMode,
          isEcho: true // Enable Echo mode for chat
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessageData = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: {
          ...data.metadata,
          modeUsed: data.modeUsed,
          sources: data.sources,
          provider: data.meta?.provider,
          asOf: data.meta?.now,
          latencyMs: data.meta?.latencyMs
        }
      };

      console.log('🐛 CHAT DEBUG - Creating AI message:', {
        id: aiMessage.id,
        type: aiMessage.type,
        content: aiMessage.content.substring(0, 100),
        timestamp: aiMessage.timestamp
      });

      setMessages(prev => {
        console.log('🐛 CHAT DEBUG - Adding AI message to local state:', {
          previousCount: prev.length,
          newCount: prev.length + 1
        });
        return [...prev, aiMessage];
      });
      
      // Add AI response to conversation session for history tracking
      console.log('🐛 CHAT DEBUG - Adding AI message to conversation session...');
      conversationSession.addMessage(aiMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });

      const errorMessage: ChatMessageData = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const saveToInsights = (message: ChatMessageData) => {
    if (!message.metadata) return;
    
    const savedInsights = JSON.parse(localStorage.getItem('clbhouz_ai_saved') || '[]');
    const insight = {
      id: message.id,
      content: message.content,
      summary: message.metadata.save_card,
      tags: message.metadata.tags || [],
      category: message.metadata.category || 'General',
      timestamp: message.timestamp
    };
    
    savedInsights.push(insight);
    localStorage.setItem('clbhouz_ai_saved', JSON.stringify(savedInsights));
    
    toast({
      title: "Saved to Insights",
      description: "This tip has been saved to your AI insights",
    });
  };

  const requestMoreDetail = (originalMessage: string) => {
    sendMessage(originalMessage, true);
  };


  // Handle exit animation cleanup
  const handleExitComplete = useCallback(() => {
    // Cleanup that previously depended on immediate unmount
    console.log('Echo exit animation completed');
  }, []);


  // Determine avatar state based on recording/processing state
  const getAvatarState = () => {
    if (isProcessing) return 'processing';
    if (isRecording) return 'listening';
    return 'idle';
  };

  return (
    <>
      <SlideOver
        open={isOpen}
        onClose={handleClose}
        width="w-full"
        zIndex="z-[1100]"
        ariaLabel="Echo AI chat interface"
        backdrop="none"
      >
      {/* Backdrop with vignette */}
      <div 
        className="fixed inset-0 z-[1099] pointer-events-auto"
        style={{
          background: 'radial-gradient(120% 80% at 50% 0%, rgba(0,0,0,0.28), rgba(0,0,0,0.55))',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          willChange: 'backdrop-filter'
        }}
        onClick={handleClose}
      />
      
      {/* Panel shell */}
      <div 
        className="fixed inset-0 z-[1100] w-full h-full overflow-hidden pointer-events-auto"
        onWheel={(e) => {
          // Allow scrolling within the modal, but prevent it from bubbling up
          const target = e.currentTarget;
          const scrollableElement = target.querySelector('[data-radix-scroll-area-viewport]');
          
          if (scrollableElement) {
            const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
            
            // Only prevent default if we're trying to scroll past boundaries
            if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
              e.preventDefault();
            }
          }
          
          e.stopPropagation();
        }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Safe-area wrapper */}
        <div 
          className="flex h-full flex-col"
          style={{
            paddingTop: 'max(8px, env(safe-area-inset-top))',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
          }}
        >
          {/* Header */}
          <header
            className="sticky top-0 z-[1200] h-14 sm:h-16 border-b border-black/[0.08]"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.55) 80%, rgba(255,255,255,0.00) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
            data-echo-topbar
          >
            {/* Top progress bar when loading */}
            {isLoading && (
              <div 
                className="fixed top-[var(--overlay-top,0px)] left-0 right-0 h-[2px] z-[1300] overflow-hidden"
                role="progressbar"
                aria-label="Generating response"
              >
                <div 
                  className="h-full bg-gradient-to-r from-[#2A9D8F] via-[#79C4BD] to-[#2A9D8F]"
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.6s linear infinite'
                  }}
                />
              </div>
            )}
            
            <div className="mx-auto max-w-[1200px] h-full px-3 sm:px-5">
              <div className="grid h-full grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
                {/* Left cluster */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    aria-label="Close Echo"
                    onClick={handleClose}
                    className="h-9 w-9 rounded-full bg-white/80 border border-black/10 shadow-sm
                               hover:bg-white transition flex items-center justify-center
                               focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/40"
                  >
                    <X className="h-5 w-5 text-gray-700" />
                  </button>
                </div>

                {/* Center cluster */}
                <div className="min-w-0 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="relative">
                      <PiWaveform 
                        className="h-5 w-5 text-[#2A9D8F]" 
                        aria-hidden="true"
                        style={{
                          animation: getAvatarState() === 'processing' 
                            ? 'echoRotate 2s linear infinite'
                            : getAvatarState() === 'listening'
                            ? 'echoBreathing 1.5s ease-in-out infinite'
                            : 'echoBreathing 3s ease-in-out infinite'
                        }}
                      />
                      {getAvatarState() === 'listening' && (
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{
                            animation: 'echoPulse 1.5s ease-in-out infinite'
                          }}
                        />
                      )}
                    </div>
                    <h1 className="truncate text-lg md:text-xl font-semibold tracking-tight text-gray-900">
                      Echo
                    </h1>
                    {isProcessing && (
                      <span className="inline-flex items-center gap-1 rounded-full
                                     bg-[#2A9D8F]/10 text-[#2A9D8F] border border-[#2A9D8F]/20
                                     px-2 py-0.5 text-[12px] font-medium">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2A9D8F]" />
                        Live
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-gray-600 leading-none">
                    {isLoading ? (
                      <span className="truncate">Echo is typing…</span>
                    ) : (
                      <span>AI Chat</span>
                    )}
                  </div>
                </div>

                {/* Right cluster */}
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                  {/* Tab switcher (desktop only) */}
                  <div className="hidden sm:flex items-center h-11 rounded-full
                                 bg-white/80 border border-black/10 backdrop-blur shadow-sm p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className={cn(
                        "h-9 px-4 rounded-full text-sm font-medium transition-all",
                        activeTab === 'chat' 
                          ? "bg-[#2A9D8F] text-white shadow" 
                          : "text-gray-700 hover:bg-white"
                      )}
                    >
                      Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('swing')}
                      className={cn(
                        "h-9 px-4 rounded-full text-sm font-medium transition-all",
                        activeTab === 'swing' 
                          ? "bg-[#2A9D8F] text-white shadow" 
                          : "text-gray-700 hover:bg-white"
                      )}
                    >
                      Swing Coach
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Segmented Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            {/* Top bar container (sticky) */}
            <div
              className="sticky top-[var(--echo-top,56px)] z-[2] px-3 sm:px-4 py-3 bg-white/55 backdrop-blur-md border-b border-white/30"
              data-echo-topbar
            >
              {/* Tabs rail */}
              <div className="w-full max-w-[720px] mx-auto" data-echo-tabs-rail>
                <TabsList className="w-full h-11 rounded-full bg-white/80 backdrop-blur border border-black/10 shadow-sm grid grid-cols-2 gap-1 p-1">
                  <TabsTrigger
                    value="chat"
                    className="rounded-full px-4 text-sm font-medium 
                               data-[state=active]:bg-[#2A9D8F] data-[state=active]:text-white data-[state=active]:shadow
                               data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-white
                               transition-all"
                  >
                    Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value="swing"
                    className="rounded-full px-4 text-sm font-medium 
                               data-[state=active]:bg-[#2A9D8F] data-[state=active]:text-white data-[state=active]:shadow
                               data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-white
                               transition-all"
                  >
                    Swing Coach
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Scrollable content area */}
            <TabsContent value="chat" className="m-0 flex-1" style={{ minHeight: 0 }}>
              <div 
                className="relative h-full overflow-y-auto overscroll-y-contain scroll-smooth [-webkit-overflow-scrolling:touch] px-3 sm:px-4 pt-10 pb-[64px]"
                data-echo-canvas
                ref={chatAutoScroll.scrollAreaRef}
              >
                {/* Top vignette */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/75 to-transparent" />
                {/* Bottom vignette */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/80 to-transparent" />
                
                <div>
                    {messages.length === 0 ? (
                      <div className="text-left">
                        <p className="text-gray-800/80 text-base mb-5">
                          I'm your personal caddy.<br />
                          Ask me anything, anytime - I've got you.
                        </p>

                        <div className="space-y-3">
                          {suggestedPrompts.map((prompt, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestedPrompt(prompt.text)}
                              className="
                                w-full text-left rounded-2xl
                                bg-white/90 backdrop-blur shadow
                                px-4 py-4
                                hover:-translate-y-0.5 active:translate-y-0 transition-transform
                              "
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{prompt.emoji}</span>
                                <span className="text-lg font-medium text-gray-900">{prompt.text}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mx-auto w-full max-w-[var(--bubble-max-md)]">
                        <div className="flex flex-col space-y-6">
                          {messages.map((message) => (
                            <ChatMessageComponent
                              key={message.id}
                              message={message}
                              onSaveToInsights={saveToInsights}
                              onRequestDetail={requestMoreDetail}
                            />
                          ))}
                           {isLoading && (
                             <div className="px-4 sm:px-6 py-2">
                               <div className="flex gap-2 items-start">
                                 <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-[#2A9D8F]/12 ring-1 ring-[#2A9D8F]/20 animate-[pulse_1.8s_ease-in-out_infinite]">
                                   <Bot className="h-4 w-4 text-[#2A9D8F]" />
                                 </div>
                                 <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 border border-black/5 backdrop-blur px-2.5 py-1">
                                   <span className="inline-flex gap-1">
                                     <i className="w-[6px] h-[6px] rounded-full bg-gray-500/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                                     <i className="w-[6px] h-[6px] rounded-full bg-gray-500/70 animate-bounce" style={{ animationDelay: '200ms' }} />
                                     <i className="w-[6px] h-[6px] rounded-full bg-gray-500/70 animate-bounce" style={{ animationDelay: '400ms' }} />
                                   </span>
                                 </div>
                               </div>
                             </div>
                           )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="swing" className="m-0 flex-1" style={{ minHeight: 0 }}>
              <div 
                className="relative h-full overflow-y-auto overscroll-y-contain scroll-smooth [-webkit-overflow-scrolling:touch] px-3 sm:px-4 pt-10 pb-[64px]"
                data-echo-canvas
              >
                {/* Top vignette */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/75 to-transparent" />
                {/* Bottom vignette */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/80 to-transparent" />
                
                <SwingCoach
                  onClose={() => setActiveTab('chat')}
                  isRecording={isRecording}
                  isProcessing={isProcessing}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  analysisText={swingCoachAnalysisText}
                  onAnalysisTextChange={setSwingCoachAnalysisText}
                />
              </div>
            </TabsContent>
          </Tabs>
        
          {/* Composer footer */}
          <footer 
            className="sticky bottom-0 z-[1]
                       border-t border-black/5
                       bg-gradient-to-b from-white/70 to-white/90
                       backdrop-blur-md"
            data-echo-composer
          >
            <div className="mx-auto w-full max-w-screen-md px-3 sm:px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
              {activeTab === 'chat' && (
                <div>
                  {/* Recording state overlay */}
                  {isRecording && (
                    <div className="
                      mb-2 flex items-center gap-2 rounded-[14px]
                      bg-white/90 backdrop-blur border border-black/10 px-3 py-2
                      shadow-sm
                    ">
                      <div className="h-6 flex-1 bg-gradient-to-r from-[#2A9D8F]/20 to-transparent rounded relative overflow-hidden">
                        <span className="absolute inset-y-0 left-2 flex items-center text-[11px] text-[#2A9D8F] font-medium">
                          Listening…
                        </span>
                      </div>
                      <button 
                        type="button"
                        className="h-8 w-8 grid place-items-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/45" 
                        onClick={stopRecording}
                        aria-label="Cancel recording"
                      >
                        <MicOff className="h-4 w-4 text-red-600" />
                      </button>
                      <button 
                        type="button"
                        className="h-8 px-3 rounded-full bg-[#2A9D8F] text-white text-[13px] hover:brightness-[1.05] active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/45" 
                        onClick={stopRecording}
                        aria-label="Use recording"
                      >
                        Use
                      </button>
                    </div>
                  )}

                  {/* Main composer pill */}
                  <div className="
                    w-full rounded-[28px] min-h-[46px]
                    bg-white/92 backdrop-blur border border-black/8
                    shadow-md
                    px-3 py-2
                    flex items-end gap-2
                    focus-within:ring-2 focus-within:ring-[#2A9D8F]/35 focus-within:border-transparent
                    transition-shadow
                  ">
                    {/* Left buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label="Attach file"
                        className="
                          h-9 w-9 rounded-full
                          text-gray-500 hover:text-gray-700
                          hover:bg-black/5 active:bg-black/10
                          grid place-items-center
                          transition-colors
                          disabled:opacity-50 disabled:cursor-not-allowed
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/45
                        "
                        disabled={isLoading || isRecording || isProcessing}
                      >
                        <Paperclip className="h-[18px] w-[18px]" />
                      </button>

                      <button
                        type="button"
                        aria-label={isRecording ? "Recording" : "Start voice input"}
                        className={cn(
                          "h-9 w-9 rounded-full grid place-items-center transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/45",
                          isRecording
                            ? "bg-[#2A9D8F]/15 border border-[#2A9D8F]/40 ring-4 ring-[#2A9D8F]/20 text-[#2A9D8F]"
                            : "text-gray-500 hover:text-gray-700 hover:bg-black/5 active:bg-black/10"
                        )}
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        disabled={isProcessing || inputValue.trim().length > 0}
                      >
                        <Mic className="h-[18px] w-[18px]" />
                      </button>
                    </div>

                    {/* Textarea */}
                    <div className="flex-1 min-w-0">
                      <Textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Message Echo…"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(inputValue);
                          }
                        }}
                        disabled={isLoading || isRecording || isProcessing}
                        className="
                          flex-1 resize-none bg-transparent outline-none
                          text-[15px] leading-[1.45] text-gray-900
                          placeholder:text-gray-500
                          px-0 py-0 min-h-[24px] max-h-[7.5rem]
                          border-0 focus-visible:ring-0 focus-visible:ring-offset-0
                          overflow-y-auto -webkit-overflow-scrolling-touch
                        "
                        rows={1}
                        style={{ 
                          height: 'auto'
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          const newHeight = Math.min(target.scrollHeight, 120);
                          target.style.height = `${newHeight}px`;
                          target.style.overflowY = target.scrollHeight > 120 ? 'auto' : 'hidden';
                        }}
                      />
                    </div>

                    {/* Right action - Send */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label="Send message"
                        disabled={!inputValue?.trim() || isLoading || isProcessing}
                        className={cn(
                          "h-9 w-9 rounded-full grid place-items-center",
                          "transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/45",
                          (!inputValue?.trim() || isLoading || isProcessing)
                            ? "bg-[#2A9D8F]/15 text-[#2A9D8F]/60 cursor-default"
                            : "bg-[#2A9D8F] text-white shadow-sm hover:brightness-[1.05] active:scale-[0.98]"
                        )}
                        onClick={() => sendMessage(inputValue)}
                      >
                        {isLoading || isProcessing ? (
                          <svg className="h-[16px] w-[16px] animate-spin text-current" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" className="opacity-25" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path d="M4 12a8 8 0 018-8" className="opacity-90" stroke="currentColor" strokeWidth="4" fill="none" />
                          </svg>
                        ) : (
                          <ArrowUpRight className="h-[16px] w-[16px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Recent history peek */}
                  <button
                    className="mt-3 w-full rounded-[28px] bg-[#3da0a9]/15 backdrop-blur shadow flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-[#3da0a9]/20 transition"
                    onClick={() => setShowHistory(true)}
                    aria-label="Open recent history"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-10 h-1 rounded-full block" style={{ background: 'linear-gradient(135deg, #1D3557, #2A9D8F)', opacity: 0.8 }} />
                      Recent history
                    </span>
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                  </button>
                </div>
              )}
            </div>
          </footer>
        </div>
      </div>
      </SlideOver>
        <AIChatHistory 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)}
          onSelectMessage={(message) => {
            setShowHistory(false);
            sendMessage(message);
          }}
          onNewConversation={() => {
            conversationSession.startNewConversationManually();
            setMessages([]);
            setShowHistory(false);
          }}
        />
      </>
    );
};

export default AIChatOverlay;