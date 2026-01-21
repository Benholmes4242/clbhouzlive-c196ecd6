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
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 pt-safe pb-safe"
    >
      {/* Success icon - larger, simpler */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1 
        }}
        className="mb-8"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
      </motion.div>
      
      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isScheduled ? 'Scheduled!' : 'Your moment is live'}
        </h2>
        <p className="text-muted-foreground">
          {isScheduled && scheduledAt
            ? `Your post will go live on ${formatScheduledTime(scheduledAt)}`
            : 'Your post has been shared with the community'
          }
        </p>
      </motion.div>
      
      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        {/* View Post button - primary for immediate posts */}
        {onViewPost && !isScheduled && (
          <Button
            variant="default"
            size="lg"
            onClick={onViewPost}
            className="w-full"
          >
            View Post
          </Button>
        )}
        
        {/* Create Another button */}
        <Button
          variant={onViewPost && !isScheduled ? 'outline' : 'default'}
          size="lg"
          onClick={onCreateAnother}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Another
        </Button>
        
        {/* Done button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={onDone}
          className="w-full text-muted-foreground"
        >
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default PostSuccessScreen;
