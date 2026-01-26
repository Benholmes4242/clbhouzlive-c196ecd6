// PostSuccessScreen - Success confirmation after posting
// Delight without gimmicks - clean, premium feel
import { motion } from 'framer-motion';
import { CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostSuccessScreenProps {
  /** Whether the post was scheduled */
  isScheduled?: boolean;
  /** Scheduled time if applicable */
  scheduledAt?: Date | null;
  /** Callback to view the post */
  onViewPost?: () => void;
  /** Callback to create another post */
  onCreateAnother: () => void;
  /** Callback to close the wizard */
  onDone: () => void;
}

export function PostSuccessScreen({
  isScheduled = false,
  scheduledAt,
  onViewPost,
  onCreateAnother,
  onDone,
}: PostSuccessScreenProps) {
  const formatScheduledTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] bg-[#F8FAFC] flex flex-col items-center justify-center p-6 pt-safe pb-safe"
    >
      {/* Success icon - Apple-level: with pulse animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1 
        }}
        className="relative mb-8"
      >
        {/* Pulse ring animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20"
        />
        {/* Main icon circle */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative z-10">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
      </motion.div>
      
      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-10"
      >
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {isScheduled ? 'Scheduled!' : 'Posted!'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isScheduled && scheduledAt
            ? `Your post will go live on ${formatScheduledTime(scheduledAt)}`
            : 'Your moment has been shared with the community'
          }
        </p>
      </motion.div>
      
      {/* Action buttons - Apple-level: proper 3-tier hierarchy */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        {/* Primary action - View Post */}
        {onViewPost && !isScheduled && (
          <Button
            onClick={onViewPost}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            View Post
          </Button>
        )}
        
        {/* Secondary action - Create Another */}
        <Button
          variant="outline"
          onClick={onCreateAnother}
          className="w-full h-11 rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Another
        </Button>
        
        {/* Tertiary action - Done (still a button, not text link) */}
        <Button
          variant="ghost"
          onClick={onDone}
          className="w-full h-11 rounded-xl text-muted-foreground hover:text-foreground"
        >
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default PostSuccessScreen;
