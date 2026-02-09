/**
 * ProfileSuccessScreen - Success screen after profile save
 * Matches Post/Review wizard success screens
 */
import { motion } from 'framer-motion';
import { Check, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileSuccessScreenProps {
  title: string;
  subtitle: string;
  onViewProfile: () => void;
  onDone: () => void;
}

export function ProfileSuccessScreen({
  title,
  subtitle,
  onViewProfile,
  onDone,
}: ProfileSuccessScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center px-6 pt-safe pb-safe"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6"
      >
        <Check className="w-10 h-10 text-primary" strokeWidth={3} />
      </motion.div>

      {/* Title and subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xs space-y-3"
      >
        <Button
          size="lg"
          onClick={onViewProfile}
          className="w-full rounded-xl font-semibold"
        >
          <User className="w-4 h-4 mr-2" />
          View Profile
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={onDone}
          className="w-full rounded-xl font-medium border-border"
        >
          Done
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default ProfileSuccessScreen;
