import React, { memo } from 'react';
import SquareCardMedia from './SquareCardMedia';
import PortraitCardMedia from './PortraitCardMedia';
import HeroCardMedia from './HeroCardMedia';
import { CardMediaProps, CardType } from './CardMediaTypes';

/**
 * Smart Card Media Component
 * 
 * Automatically renders the appropriate media component based on card type:
 * - Square cards: Always static images (even for videos)
 * - Portrait cards: Videos only, autoplay muted and looping
 * - Hero cards: Videos only, autoplay muted and looping, high resolution
 */
const SmartCardMedia: React.FC<CardMediaProps> = memo((props) => {
  const { cardType } = props;

  switch (cardType) {
    case CardType.SQUARE:
      return <SquareCardMedia {...props} shouldAutoplay={false} />;
    
    case CardType.PORTRAIT:
      return <PortraitCardMedia {...props} shouldAutoplay={true} />;
    
    case CardType.HERO:
      return <HeroCardMedia {...props} shouldAutoplay={true} />;
    
    default:
      // Default to square card behavior
      return <SquareCardMedia {...props} shouldAutoplay={false} />;
  }
});

SmartCardMedia.displayName = 'SmartCardMedia';

export default SmartCardMedia;