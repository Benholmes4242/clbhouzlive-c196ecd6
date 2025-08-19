import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';

interface FloatingAIButtonProps {
  onClick: () => void;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-50 h-14 px-4 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg border-0 transition-all duration-300 hover:scale-105"
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <MessageCircle className="h-5 w-5" />
          <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
        </div>
        <span className="font-medium">clbhouz pro AI</span>
      </div>
    </Button>
  );
};

export default FloatingAIButton;