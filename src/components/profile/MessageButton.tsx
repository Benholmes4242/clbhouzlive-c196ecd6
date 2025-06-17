
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MessageButtonProps {
  friendId: string;
  friendName: string;
}

const MessageButton = ({ friendId, friendName }: MessageButtonProps) => {
  const navigate = useNavigate();

  const handleMessageClick = () => {
    // Navigate to messages page with the friend pre-selected
    navigate(`/messages?friend=${friendId}`);
  };

  return (
    <Button onClick={handleMessageClick} className="flex-1">
      <MessageCircle className="w-4 h-4 mr-2" />
      Message
    </Button>
  );
};

export default MessageButton;
