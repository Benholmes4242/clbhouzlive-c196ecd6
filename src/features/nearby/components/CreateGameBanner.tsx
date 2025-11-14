/**
 * Create Game Banner
 * Full-width frosted pill CTA for creating a game
 */

import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';

type CreateGameBannerProps = {
  onOpen: () => void;
};

export function CreateGameBanner({ onOpen }: CreateGameBannerProps) {
  const handleClick = () => {
    haptic('light');
    onOpen();
  };

  return (
    <TapButton
      onClick={handleClick}
      className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 text-center text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
    >
      Create a Game
    </TapButton>
  );
}
