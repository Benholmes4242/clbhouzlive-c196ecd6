import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, History, Bookmark, MapPin, Mic, MicOff, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}

const suggestedPrompts = [
  "Is my grip too strong?",
  "Where should my ball position be?",
  "Best golf clubs near me",
  "Which driver loft should I use at 95 mph swing speed?",
  "Plan me a 5 course USA golf trip"
];

const AIChatOverlay: React.FC<AIChatOverlayProps> = ({ isOpen, onClose, onHistoryStateChange }) => {
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

      // Switch to logs tab if we're in the chat
      if (activeTab === 'chat') {
        setActiveTab('logs');
      }

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

  // Ensure fresh start when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInputValue('');
      setActiveTab('chat');
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInputValue('');
      setActiveTab('chat');
    }
  }, [isOpen]);

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
          isEcho: false
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessageData = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
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
        width="w-full sm:w-[90vw] sm:max-w-[860px]"
        zIndex="z-[1100]"
        ariaLabel="Echo AI chat interface"
      >
      <div 
        className="w-full h-full flex flex-col overflow-hidden rounded-l-2xl"
        style={{
          background: 'rgba(246, 247, 246, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
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
        {/* Header - Fixed at top (UI only change) */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{
            height: window.innerWidth <= 768 ? '56px' : '64px',
            // Use same gradient as EchoAvatar
            background: 'linear-gradient(135deg, #1D3557, #2A9D8F)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)'
          }}
        >
          <div className="flex items-center gap-3">
            <EchoAvatar state={getAvatarState()} size={window.innerWidth <= 768 ? 40 : 44} />
            <div>
              <h2 className="text-xl font-semibold text-white">Echo</h2>
              <p className="text-sm text-white/90">I'm your personal tour caddie</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHistory(true)}
              className="h-8 w-8 p-0 hover:bg-white/15 transition-colors duration-120"
            >
              <History className="h-4 w-4 text-white" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-white/15 transition-colors duration-120"
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Tabs - Fixed header */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 bg-[rgba(110,146,119,0.06)]">
          <div className="px-6 pt-4 pb-2 flex-shrink-0">
            <TabsList
              className="
                w-full h-11 rounded-full
                bg-white/85 backdrop-blur-sm border border-white/50
                shadow-sm flex items-center justify-between px-1
              "
            >
              <TabsTrigger
                value="chat"
                className="
                  flex-1 rounded-full mx-1 px-4 py-2 text-sm font-medium
                  text-gray-800 data-[state=active]:bg-white data-[state=active]:text-gray-900
                  data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-black/5
                  transition-all
                "
              >
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="
                  flex-1 rounded-full mx-1 px-4 py-2 text-sm font-medium
                  text-gray-800 data-[state=active]:bg-white data-[state=active]:text-gray-900
                  data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-black/5
                  transition-all
                "
              >
                Caddie Logs
              </TabsTrigger>
              <TabsTrigger
                value="swing-coach"
                className="
                  flex-1 rounded-full mx-1 px-4 py-2 text-sm font-medium
                  text-gray-800 data-[state=active]:bg-white data-[state=active]:text-gray-900
                  data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-black/5
                  transition-all
                "
              >
                Swing Coach
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Per-tab scrollable content areas */}
            <TabsContent value="chat" className="h-full m-0">
              <ScrollArea 
                ref={chatAutoScroll.scrollAreaRef}
                className="h-full min-h-0"
                style={{ overscrollBehavior: 'contain' }}
              >
                <div className="h-full min-h-0">
                  <div className="px-6 py-5">
                    {messages.length === 0 ? (
                      <div className="text-left">
                        <p className="text-gray-800/80 text-base mb-5">
                          I'm your personal tour caddie.<br />
                          Ask me anything, anytime—I've got you.
                        </p>

                        <div className="space-y-3">
                          {suggestedPrompts.map((prompt, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestedPrompt(prompt)}
                              className="
                                w-full text-left rounded-2xl
                                bg-white/90 backdrop-blur shadow
                                px-4 py-4
                                hover:-translate-y-0.5 active:translate-y-0 transition-transform
                              "
                            >
                              <div className="flex items-center gap-3">
                                {/* If you already store icons per prompt, render them here. Otherwise keep a generic icon. */}
                                <span className="text-xl">⛳</span>
                                <span className="text-lg font-medium text-gray-900">{prompt}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <ChatMessageComponent
                            key={message.id}
                            message={message}
                            onSaveToInsights={saveToInsights}
                            onRequestDetail={requestMoreDetail}
                          />
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                              <div className="flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                                <span className="text-sm">Echo is thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="logs" className="h-full m-0">
              <ScrollArea 
                ref={logsAutoScroll.scrollAreaRef}
                className="h-full min-h-0"
                style={{ overscrollBehavior: 'contain' }}
              >
                <CaddieLogs 
                  onClose={() => setActiveTab('chat')}
                  isRecording={isRecording}
                  isProcessing={isProcessing}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  userLocation={userLocation}
                  requestLocation={requestLocation}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="swing-coach" className="h-full m-0 flex flex-col justify-start items-stretch overflow-y-auto">
              <div className="w-full px-6 py-3">
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
        
        {/* Shared composer/footer - Fixed at bottom */}
        <div 
          className="flex-shrink-0"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(180deg, rgba(246, 247, 246, 0.85) 0%, rgba(246, 247, 246, 0.95) 100%)'
          }}
        >
          {activeTab === 'chat' && (
            <div className="p-4">
              {/* Floating pill composer */}
              <div className="rounded-[28px] bg-white/92 backdrop-blur shadow-md px-3 py-2 flex items-center">
                {/* Left icons */}
                <div className="flex items-center gap-1 pr-1">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    variant={isRecording ? "destructive" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-full"
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : isProcessing ? (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Camera button – keep if you already have a media picker handler.
                     If not, you can disable it for now (UI only) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    // onClick={openMediaPicker} // only if this exists in your logic
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M4 7h3l2-2h6l2 2h3v12H4z" fill="currentColor"/></svg>
                  </Button>
                </div>

                {/* Input */}
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about your swing, clubs, courses…"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                  disabled={isLoading || isRecording || isProcessing}
                  className="border-0 focus-visible:ring-0 bg-transparent mx-2 text-[15px]"
                />

                {/* Send arrow */}
                <Button
                  onClick={() => sendMessage(inputValue)}
                  disabled={isLoading || !inputValue.trim() || isRecording || isProcessing}
                  size="icon"
                  className="h-9 w-9 rounded-full bg-gray-900 text-white hover:bg-black transition"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Recent history peek (opens existing AIChatHistory) */}
              <button
                className="mt-3 w-full rounded-[28px] bg-white/85 backdrop-blur shadow flex items-center justify-between px-4 py-2 text-gray-700"
                onClick={() => setShowHistory(true)}
                aria-label="Open recent history"
              >
                <span className="flex items-center gap-2">
                  <span className="w-10 h-1 rounded-full bg-gray-300 block" />
                  Recent history
                </span>
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}
          {activeTab === 'logs' && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestLocation}
                  className="text-xs"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Use My Location
                </Button>
                {userLocation && (
                  <Badge variant="secondary" className="text-xs">
                    {userLocation}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Record course notes and tips..."
                    disabled={isRecording || isProcessing}
                    readOnly
                  />
                </div>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  className="px-3"
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : isProcessing ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => {
                    if (!isRecording && !isProcessing) {
                      startRecording();
                    }
                  }}
                  disabled={isRecording || isProcessing}
                  size="sm"
                  className="rounded-xl px-3 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'swing-coach' && (
            <div className="p-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={swingCoachAnalysisText}
                    onChange={(e) => setSwingCoachAnalysisText(e.target.value)}
                    placeholder="Describe your swing for analysis..."
                    onKeyPress={(e) => e.key === 'Enter' && swingCoachAnalysisText.trim() && document.getElementById('swing-coach-send-btn')?.click()}
                    disabled={isRecording || isProcessing}
                  />
                </div>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  className="px-3"
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : isProcessing ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  id="swing-coach-send-btn"
                  onClick={() => {
                    // Trigger swing analysis in Swing Coach component
                    const swingCoachEvent = new CustomEvent('triggerSwingAnalysis', { 
                      detail: { analysisText: swingCoachAnalysisText } 
                    });
                    window.dispatchEvent(swingCoachEvent);
                    setSwingCoachAnalysisText('');
                  }}
                  disabled={isRecording || isProcessing}
                  size="sm"
                  className="rounded-xl px-3 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Analyze"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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