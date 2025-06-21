
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface MessageButtonProps {
  friendStatus?: 'pending' | 'accepted' | null;
}

const MessageButton: React.FC<MessageButtonProps> = ({
  friendStatus
}) => {
  const handleMessageClick = () => {
    // For now, just show a toast that messaging is coming soon
    console.log('Messaging feature coming soon');
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleMessageClick}
      className="flex-1 max-w-32"
      disabled={friendStatus !== 'accepted'}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Message
    </Button>
  );
};

export default MessageButton;
