import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatMessageComponent from './ChatMessage';
import AIChatHistory from './AIChatHistory';
import CaddieModal from './CaddieModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { X, Send, Mic, MicOff, MapPin, History } from 'lucide-react';

interface ChatMessageData {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    save_card?: string;
    tags?: string[];
    category?: string;
  };
}

interface AIChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

const AIChatOverlay: React.FC<AIChatOverlayProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'chat' 
}) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showHistory, setShowHistory] = useState(false);
  const [userLocation, setUserLocation] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Voice recording hooks
  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  } = useVoiceRecording();

  const suggestedPrompts = [
    "Why am I hooking my driver?",
    "How do I fix my slice?",
    "Golf courses near me",
    "Can you put together a 5-night golf tour in the USA for 5 friends?"
  ];

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const saveCaddieLog = async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('caddie_logs')
        .insert({
          user_id: user.id,
          content: content,
          transcription: content,
          location_name: userLocation || null,
          course_name: null,
          tags: autoTagGolfTerms(content)
        });

      if (error) throw error;

      toast({
        title: "Log Saved",
        description: "Your caddie note has been recorded",
      });
    } catch (error) {
      console.error('Error saving caddie log:', error);
      toast({
        title: "Error",
        description: "Failed to save log",
        variant: "destructive"
      });
    }
  };

  const autoTagGolfTerms = (content: string): string[] => {
    const golfTerms = [
      'tree', 'bunker', 'green', 'slope', 'yardage', 'carry', 'pin', 'flag',
      'fairway', 'rough', 'water', 'hazard', 'dogleg', 'elevation', 'wind',
      'left', 'right', 'center', 'front', 'back', 'avoid', 'target'
    ];
    
    const foundTerms = golfTerms.filter(term => 
      content.toLowerCase().includes(term)
    );
    
    return [...new Set(foundTerms)];
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.VITE_OPENCAGE_API_KEY}`
            );
            const data = await response.json();
            const location = data.results[0]?.formatted || `${latitude}, ${longitude}`;
            setUserLocation(location);
            
            toast({
              title: "Location Updated",
              description: location,
            });
          } catch (error) {
            setUserLocation(`${latitude}, ${longitude}`);
          }
        },
        () => {
          toast({
            title: "Location Error",
            description: "Unable to get your location",
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state when closing
    setMessages([]);
    setInputValue('');
    setActiveTab('chat');
    setShowHistory(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const conversation = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const finalMessage = userMessage.content;
      const detailMode = finalMessage.toLowerCase().includes('detail') || 
                        finalMessage.toLowerCase().includes('more') ||
                        finalMessage.toLowerCase().includes('explain');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to use AI chat');
      }

      const { data, error } = await supabase.functions.invoke('clbhouz-pro-ai', {
        body: {
          message: finalMessage,
          conversation,
          detailMode,
          isProAI: false
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessageData = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.content || 'I apologize, but I encountered an issue processing your request.',
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto scroll to bottom
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          }
        }
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessageData = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestDetail = (content: string) => {
    setInputValue(`Please provide more detail about: ${content}`);
  };

  const loadConversation = (conversation: any[]) => {
    const formattedMessages = conversation.map((msg, index) => ({
      id: `loaded_${index}`,
      type: msg.role === 'user' ? 'user' as const : 'ai' as const,
      content: msg.content,
      timestamp: new Date()
    }));
    setMessages(formattedMessages);
    setShowHistory(false);
    setActiveTab('chat');
  };

  const sendMessage = (messageContent: string) => {
    setInputValue(messageContent);
    setActiveTab('chat');
    // Auto-send after a brief delay to allow tab switch
    setTimeout(() => {
      if (messageContent.trim()) {
        handleSendMessage();
      }
    }, 100);
  };

  if (!isOpen) return null;

  // Show history if requested
  if (showHistory) {
    return (
      <AIChatHistory 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectMessage={() => {}}
      />
    );
  }

  return (
    <>
      <CaddieModal
        isOpen={isOpen}
        onClose={handleClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        messages={messages}
        isLoading={isLoading}
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSendMessage={handleSendMessage}
        isRecording={isRecording}
        isProcessing={isProcessing}
        startRecording={startRecording}
        stopRecording={stopRecording}
        userLocation={userLocation}
        requestLocation={requestLocation}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        scrollAreaRef={scrollAreaRef}
        suggestedPrompts={suggestedPrompts}
      />

      {/* History overlay */}
      {showHistory && (
        <AIChatHistory 
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onSelectMessage={() => {}}
        />
      )}
    </>
  );
};

export default AIChatOverlay;