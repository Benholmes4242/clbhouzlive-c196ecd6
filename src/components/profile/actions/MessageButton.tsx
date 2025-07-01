
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface MessageButtonProps {
  friendStatus: 'pending' | 'accepted' | null;
}

const MessageButton: React.FC<MessageButtonProps> = ({ friendStatus }) => {
  const handleMessageClick = () => {
    // Navigate to messages - this is a placeholder for now
    console.log('Navigate to messages');
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleMessageClick}
      className="px-3 py-1 text-xs"
    >
      <MessageCircle className="w-3 h-3" />
      <span className="ml-1">Message</span>
    </Button>
  );
};

export default MessageButton;
