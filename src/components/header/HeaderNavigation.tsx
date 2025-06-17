
import React from 'react';
import { Bell, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from "react-router-dom";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";

const HeaderNavigation = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { unreadCount } = useNotifications();
  const { conversations } = useMessages();

  // Calculate total unread messages
  const unreadMessagesCount = conversations.reduce((total, conv) => total + conv.unread_count, 0);

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  const handleMessagesClick = () => {
    navigate('/messages');
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="relative" onClick={handleNotificationsClick}>
        <Bell className="h-5 w-5" />
        {user && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      <Button variant="ghost" size="icon" className="relative" onClick={handleMessagesClick}>
        <MessageCircle className="h-5 w-5" />
        {user && unreadMessagesCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
          </span>
        )}
      </Button>
    </>
  );
};

export default HeaderNavigation;
