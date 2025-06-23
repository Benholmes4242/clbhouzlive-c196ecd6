
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
      onClick={handleMessageClick}
      className="flex-1 max-w-32"
    >
      <MessageCircle className="w-4 h-4" />
      <span className="ml-2">Message</span>
    </Button>
  );
};

export default MessageButton;
