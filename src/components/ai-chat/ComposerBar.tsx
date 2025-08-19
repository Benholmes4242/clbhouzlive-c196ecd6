import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mic, MicOff, Send } from 'lucide-react';

interface ComposerBarProps {
  activeTab: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  userLocation: string;
  requestLocation: () => void;
}

const ComposerBar: React.FC<ComposerBarProps> = ({
  activeTab,
  inputValue,
  setInputValue,
  handleSendMessage,
  isRecording,
  isProcessing,
  startRecording,
  stopRecording,
  userLocation,
  requestLocation
}) => {
  const getPlaceholder = () => {
    switch (activeTab) {
      case 'chat':
        return 'Ask about your swing, clubs, courses...';
      case 'logs':
        return 'Record course notes and tips...';
      case 'proai':
        return 'Ask about your swing analysis...';
      default:
        return 'Type your message...';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {/* Location and status indicators */}
      <div className="flex items-center gap-2">
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

      {/* Input area */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            disabled={isRecording || isProcessing}
            className="w-full"
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
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>

        <Button
          onClick={handleSendMessage}
          disabled={isRecording || isProcessing || !inputValue.trim()}
          size="sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ComposerBar;