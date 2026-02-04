import React from 'react';
import { UserPlus, UserMinus, LogOut, Shield, ShieldOff, Edit, Camera, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SystemEventType = 
  | 'user_added'
  | 'user_left' 
  | 'user_ejected'
  | 'admin_promoted'
  | 'admin_demoted'
  | 'group_created'
  | 'name_changed'
  | 'photo_changed';

export interface SystemMessageMetadata {
  event_type: SystemEventType;
  user_id: string;
  user_name: string;
  actor_id?: string;
  actor_name?: string;
}

interface SystemMessageProps {
  content: string;
  metadata?: SystemMessageMetadata | null;
  timestamp: string;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({
  content,
  metadata,
  timestamp,
}) => {
  const getIcon = () => {
    if (!metadata?.event_type) return null;
    
    const iconClass = "w-3.5 h-3.5";
    
    switch (metadata.event_type) {
      case 'user_added':
        return <UserPlus className={cn(iconClass, "text-[#25D366]")} />;
      case 'user_left':
        return <LogOut className={cn(iconClass, "text-[#8E8E93]")} />;
      case 'user_ejected':
        return <UserMinus className={cn(iconClass, "text-[#FF3B30]")} />;
      case 'admin_promoted':
        return <Shield className={cn(iconClass, "text-[#007AFF]")} />;
      case 'admin_demoted':
        return <ShieldOff className={cn(iconClass, "text-[#8E8E93]")} />;
      case 'group_created':
        return <Users className={cn(iconClass, "text-[#007AFF]")} />;
      case 'name_changed':
        return <Edit className={cn(iconClass, "text-[#8E8E93]")} />;
      case 'photo_changed':
        return <Camera className={cn(iconClass, "text-[#8E8E93]")} />;
      default:
        return null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex justify-center my-3">
      <div className={cn(
        "flex items-center gap-1.5 px-4 py-1.5 rounded-full",
        "bg-white text-[#8E8E93] text-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      )}>
        {getIcon()}
        <span>{content}</span>
        <span className="text-[#8E8E93]/60 ml-1">
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
};
