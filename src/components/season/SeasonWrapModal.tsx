import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { useSeasonWrap } from '@/hooks/useSeasonWrap';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SeasonWrapModal: React.FC = () => {
  const { user } = useSupabaseSession();
  const { wrap, hasUnviewedWrap, markAsViewed } = useSeasonWrap(user?.id);
  const [currentCard, setCurrentCard] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    if (hasUnviewedWrap && wrap) {
      setIsOpen(true);
    }
  }, [hasUnviewedWrap, wrap]);

  if (!wrap || !wrap.cards || wrap.cards.length === 0) return null;

  const handleClose = () => {
    if (wrap.id) {
      markAsViewed(wrap.id);
    }
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentCard < wrap.cards.length - 1) {
      setCurrentCard(currentCard + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  const currentCardData = wrap.cards[currentCard];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5" aria-describedby={undefined}>
        <VisuallyHidden.Root><DialogTitle>Season Wrap</DialogTitle></VisuallyHidden.Root>
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">🏌️ Season Wrapped</h2>
            <p className="text-muted-foreground">{wrap.seasonName}</p>
          </div>

          {/* Card Animation */}
          <div className="relative h-96 flex items-center justify-center mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
              >
                <div className="text-6xl mb-6">{currentCardData.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{currentCardData.title}</h3>
                <div className="text-5xl font-bold text-primary mb-2">
                  {currentCardData.value}
                </div>
                {currentCardData.subtitle && (
                  <p className="text-muted-foreground">{currentCardData.subtitle}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {wrap.cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCard(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentCard 
                    ? 'bg-primary w-8' 
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentCard === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>

            {currentCard < wrap.cards.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleClose}>
                Finish
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
