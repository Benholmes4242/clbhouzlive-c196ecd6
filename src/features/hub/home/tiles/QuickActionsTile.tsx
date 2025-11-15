import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Sparkles, Camera, User, type LucideIcon } from 'lucide-react';
import { Tile } from '../components/Tile';
import { useHub } from '@/features/hub/useHub';

type QuickActionButtonProps = {
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
};

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  Icon,
  onClick,
}) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="flex flex-col items-center justify-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    aria-label={label}
  >
    <Icon className="h-7 w-7 text-white" aria-hidden="true" />
    <span className="text-[12px] leading-tight font-medium text-white/90 whitespace-nowrap">{label}</span>
  </button>
);

export function QuickActionsTile() {
  const navigate = useNavigate();
  const { navigateFromHub } = useHub();

  const openProfile = () => navigate('/profile');
  const openCreateGame = () => navigateFromHub('/hub/create-game');
  const openSwing = () => navigateFromHub('/hub/swing');
  const openEcho = () => navigateFromHub('/hub/echo');

  return (
    <Tile title="Quick Actions" align="center">
      <div className="h-full flex items-center justify-center">
        <div className="hub-quick-actions grid grid-cols-2 gap-x-6 gap-y-4">
          <QuickActionButton
            label="Create Game"
            Icon={Flag}
            onClick={openCreateGame}
          />
          <QuickActionButton
            label="Your Profile"
            Icon={User}
            onClick={openProfile}
          />
          <QuickActionButton
            label="Upload Swing"
            Icon={Camera}
            onClick={openSwing}
          />
          <QuickActionButton
            label="Ask Echo"
            Icon={Sparkles}
            onClick={openEcho}
          />
        </div>
      </div>
    </Tile>
  );
}
