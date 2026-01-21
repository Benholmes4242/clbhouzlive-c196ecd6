// PostSuccessScreen - Success confirmation after posting
import { motion } from 'framer-motion';
import { CheckCircle, PartyPopper, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      {/* Success icon with animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1 
        }}
        className="mb-6"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -top-2 -right-2"
          >
            <PartyPopper className="h-6 w-6 text-amber-500" />
          </motion.div>
        </div>
      </motion.div>
      
      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isScheduled ? 'Scheduled!' : 'Posted!'}
        </h2>
        <p className="text-muted-foreground">
          {isScheduled && scheduledAt
            ? `Your post will go live on ${formatScheduledTime(scheduledAt)}`
            : 'Your moment is now live for everyone to see'
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
        {/* View Post button - only for immediate posts */}
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
