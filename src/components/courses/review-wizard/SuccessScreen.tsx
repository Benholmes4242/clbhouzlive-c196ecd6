/**
 * Success Screen after review submission
 * Aligned with Post Wizard design language
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Eye, Plus, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewWizardCourse } from './types';

interface SuccessScreenProps {
  course: ReviewWizardCourse | null;
  ratingId: string;
  onViewReview: () => void;
  onAddAnother: () => void;
  onClose: () => void;
  onShare: () => void;
}

export function SuccessScreen({
  course,
  ratingId,
  onViewReview,
  onAddAnother,
  onClose,
  onShare,
}: SuccessScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
    >
      {/* Success icon - matching Post Wizard style with bg-primary/10 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-[#e2e8f0] flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
      </motion.div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 mb-8"
      >
        <h2 className="text-xl font-semibold text-foreground">
          Review submitted!
        </h2>
        <p className="text-muted-foreground">
          Thanks for helping other golfers discover great courses
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col w-full gap-3 max-w-xs"
      >
        <Button
          onClick={onViewReview}
          className="w-full gap-2"
        >
          <Eye className="h-4 w-4" />
          View Review
        </Button>

        <Button
          variant="outline"
          onClick={onShare}
          className="w-full gap-2"
        >
          <Megaphone className="h-4 w-4" />
          Share to Clubhouse
        </Button>

        <Button
          variant="ghost"
          onClick={onAddAnother}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Review Another Course
        </Button>

        <Button
          variant="link"
          onClick={onClose}
          className="w-full text-muted-foreground"
        >
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}
