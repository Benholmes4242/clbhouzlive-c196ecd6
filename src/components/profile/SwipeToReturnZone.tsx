import React from 'react';
import { useSwipeable } from 'react-swipeable';

interface SwipeToReturnZoneProps {
  onSwipeDown: () => void;
  children: React.ReactNode;
}

const SwipeToReturnZone: React.FC<SwipeToReturnZoneProps> = ({
  onSwipeDown,
  children
}) => {
  const swipeHandlers = useSwipeable({
    onSwipedDown: (eventData) => {
      // Only trigger if the swipe starts from the very top of the screen
      if (eventData.initial[1] <= 50) {
        onSwipeDown();
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 50
  });

  return (
    <div {...swipeHandlers} className="w-full">
      {children}
    </div>
  );
};

export default SwipeToReturnZone;