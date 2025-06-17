
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageButtonProps {
  friendStatus: 'pending' | 'accepted' | null;
}

const MessageButton: React.FC<MessageButtonProps> = ({ friendStatus }) => {
  const { toast } = useToast();

  const handleMessage = () => {
    if (friendStatus !== 'accepted') {
      toast({
        title: "Cannot send message",
        description: "You can only message friends. Send a friend request first.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Coming soon",
      description: "Messaging functionality will be available soon.",
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleMessage}
      disabled={friendStatus !== 'accepted'}
      className="flex-1 max-w-32"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Message
    </Button>
  );
};

export default MessageButton;
