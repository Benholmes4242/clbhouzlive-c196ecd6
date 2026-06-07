import React from 'react';
import { UserPlus, UserMinus, LogOut, Shield, ShieldOff, Edit, Camera, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INK_FAINT, INK_MUTE } from './_shared/tokens';

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
        return <UserPlus className={iconClass} style={{ color: 'rgba(15,23,42,0.70)' }} />;
      case 'user_left':
        return <LogOut className={iconClass} style={{ color: INK_FAINT }} />;
      case 'user_ejected':
        return <UserMinus className={cn(iconClass, "text-destructive")} />;
      case 'admin_promoted':
        return <Shield className={iconClass} style={{ color: INK_MUTE }} />;
      case 'admin_demoted':
        return <ShieldOff className={iconClass} style={{ color: INK_FAINT }} />;
      case 'group_created':
        return <Users className={iconClass} style={{ color: INK_MUTE }} />;
      case 'name_changed':
        return <Edit className={iconClass} style={{ color: INK_FAINT }} />;
      case 'photo_changed':
        return <Camera className={iconClass} style={{ color: INK_FAINT }} />;
      default:
        return null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex justify-center my-2">
      <div
        className="flex items-center gap-1.5"
        style={{
          background: 'rgba(15,23,42,0.05)',
          color: INK_MUTE,
          padding: '4px 12px',
          borderRadius: 99,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '-0.005em',
        }}
      >
        {getIcon()}
        <span>{content}</span>
        <span style={{ color: INK_FAINT, marginLeft: 2, fontWeight: 500 }}>
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
};
