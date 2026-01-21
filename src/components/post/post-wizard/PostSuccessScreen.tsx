// PostSuccessScreen - Success confirmation after posting
// Polished UI with larger icon, premium messaging
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Plus } from 'lucide-react';
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
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6"
    >
      {/* Success icon with animation - larger for impact */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1 
        }}
        className="mb-8"
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
        </div>
      </motion.div>
      
      {/* Success message - premium copy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isScheduled ? 'Scheduled!' : 'Your moment is live'}
        </h2>
        <p className="text-muted-foreground max-w-[280px]">
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
            className="w-full gap-2"
          >
            View Post
            <ArrowRight className="h-4 w-4" />
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
