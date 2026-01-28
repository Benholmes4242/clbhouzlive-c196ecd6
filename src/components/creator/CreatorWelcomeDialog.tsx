import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  BarChart3, 
  Pin, 
  Video, 
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CreatorWelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToHub: () => void;
}

/**
 * CreatorWelcomeDialog - Onboarding overlay for first-time creators
 * 
 * Shows when a user enables Creator Mode for the first time,
 * explaining features and pointing them to the Hub for insights.
 */
export const CreatorWelcomeDialog: React.FC<CreatorWelcomeDialogProps> = ({
  isOpen,
  onClose,
  onGoToHub,
}) => {
  const features = [
    {
      icon: BarChart3,
      title: 'Creator Insights',
      description: 'Track your impressions, engagement, and audience growth',
    },
    {
      icon: Pin,
      title: 'Pinned Posts',
      description: 'Highlight your best content at the top of your profile',
    },
    {
      icon: Video,
      title: 'Featured Video',
      description: 'Showcase a video prominently on your profile',
    },
  ];

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md p-0 overflow-hidden border-0 bg-background">
        {/* Header with gradient background */}
        <div 
          className="relative px-6 pt-8 pb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(247, 147, 30, 0.15) 0%, rgba(249, 115, 22, 0.08) 50%, rgba(251, 191, 36, 0.12) 100%)',
          }}
        >
          {/* Sparkle decorations */}
          <motion.div 
            className="absolute top-4 right-8"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-4 w-4 text-amber-500/60" />
          </motion.div>

          <motion.div 
            className="absolute top-12 right-4"
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <Sparkles className="h-3 w-3 text-amber-400/50" />
          </motion.div>

          <motion.div 
            className="absolute bottom-6 left-6"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-400/40" />
          </motion.div>
          
          <AlertDialogHeader className="space-y-3 text-center">
            <motion.div 
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F7931E 0%, #f97316 100%)' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Sparkles className="h-7 w-7 text-white" />
            </motion.div>
            
            <AlertDialogTitle className="text-xl font-semibold text-foreground">
              Welcome to Creator Mode!
            </AlertDialogTitle>
            
            <AlertDialogDescription className="text-sm text-muted-foreground">
              You've unlocked powerful tools to grow your presence on Clbhouz
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {/* Features list */}
        <div className="px-6 py-4 space-y-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(247, 147, 30, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%)' }}
              >
                <feature.icon className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {feature.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Hub callout */}
        <motion.div 
          className="mx-6 mb-4 p-3 rounded-xl border border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-500">
              Pro Tip
            </span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
            Head to your <span className="font-semibold">Hub</span> to access Creator Insights and track your content performance!
          </p>
        </motion.div>

        {/* Actions */}
        <AlertDialogFooter className="px-6 pb-6 pt-2 gap-3 flex-col sm:flex-col">
          <Button 
            onClick={onGoToHub}
            className="w-full gap-2 h-11"
            style={{ 
              background: 'linear-gradient(135deg, #F7931E 0%, #f97316 100%)',
            }}
          >
            Go to Hub
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full text-muted-foreground hover:text-foreground h-10"
          >
            Maybe Later
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreatorWelcomeDialog;
