/**
 * Message Grouping Utility
 * Groups consecutive messages from the same sender within a 5-minute window
 */

export interface MessageWithGrouping {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  timestamp?: Date | string;
  firstInGroup: boolean;
  lastInGroup: boolean;
}

const GROUPING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function groupMessages<T extends { 
  id: string;
  role: 'user' | 'assistant' | 'system'; 
  content: string;
  created_at?: string;
  timestamp?: Date | string;
}>(messages: T[]): (T & { firstInGroup: boolean; lastInGroup: boolean })[] {
  if (messages.length === 0) return [];
  
  return messages.map((msg, index) => {
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
    
    // Parse timestamps
    const msgTime = msg.timestamp ? new Date(msg.timestamp).getTime() : 
                    msg.created_at ? new Date(msg.created_at).getTime() : 0;
    const prevTime = prevMsg?.timestamp ? new Date(prevMsg.timestamp).getTime() : 
                     prevMsg?.created_at ? new Date(prevMsg.created_at).getTime() : 0;
    const nextTime = nextMsg?.timestamp ? new Date(nextMsg.timestamp).getTime() : 
                     nextMsg?.created_at ? new Date(nextMsg.created_at).getTime() : 0;
    
    // First in group if: first message OR different sender OR > 5 min gap
    const firstInGroup = 
      index === 0 || 
      prevMsg?.role !== msg.role || 
      (msgTime - prevTime > GROUPING_THRESHOLD_MS);
    
    // Last in group if: last message OR different next sender OR > 5 min gap
    const lastInGroup = 
      index === messages.length - 1 || 
      nextMsg?.role !== msg.role || 
      (nextTime - msgTime > GROUPING_THRESHOLD_MS);
    
    return {
      ...msg,
      firstInGroup,
      lastInGroup
    };
  });
}
