
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
      className="px-2 py-1 text-xs h-7 flex-shrink-0 bg-[#f1f5f9] text-[#1e293b] border-[#e2e8f0] hover:bg-[#e2e8f0]"
    >
      <MessageCircle className="w-3 h-3 mr-1" />
      Message
    </Button>
  );
};

export default MessageButton;
