import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const FriendsCoursesEmpty: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[520px] w-full mx-auto px-6 py-12"
    >
      <div className="flex flex-col items-center text-center gap-5">
        {/* Animated icon disc with pulse effect */}
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10"
        >
          {/* Subtle pulse ring */}
          <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
          <Users className="w-9 h-9 text-primary/70 relative z-10" />
        </motion.div>

        {/* Headline */}
        <motion.h2 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="text-xl font-semibold text-foreground"
        >
          See where your friends play
        </motion.h2>

        {/* Body */}
        <motion.p 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-sm text-muted-foreground leading-relaxed max-w-[360px]"
        >
          Follow golfers to unlock friends' course trails, ratings, and hidden gems.
        </motion.p>

        {/* Primary CTA with gradient */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="w-full"
        >
          <Button
            onClick={() => navigate('/golferstofollow?source=friends_courses_empty')}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
          >
            Find friends
          </Button>
        </motion.div>

        {/* Micro-tip with card background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="bg-muted/50 border border-border/60 rounded-lg px-4 py-2.5"
        >
          <p className="text-xs text-muted-foreground">
            💡 <span className="font-medium">Tip:</span> Following 5 golfers makes this tab come alive.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FriendsCoursesEmpty;
