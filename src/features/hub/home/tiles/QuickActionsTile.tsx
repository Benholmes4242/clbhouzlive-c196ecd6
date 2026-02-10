import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useHub } from '@/features/hub/useHub';
import { HubEchoSheet } from '../../components/HubEchoSheet';
import { HubCreateGameSheet } from '../../components/HubCreateGameSheet';

/* --- SF-style icons (inline SVGs) --- */
const FlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M6 3.5v17a1 1 0 0 1-2 0v-17a1 1 0 0 1 2 0Zm2 .5h7.2a1 1 0 0 1 .8 1.6L15 8l1.8 2.4A1 1 0 0 1 16 12H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
      transform="translate(7, 0)"
    />
  </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 3 10.5 8.5 5 10 10.5 11.5 12 17l1.5-5.5L19 10l-5.5-1.5L12 3Zm6 10.5.7-2.2.8 2.2 2.2.7-2.2.8-.8 2.2-.7-2.2-2.2-.8 2.2-.7ZM5 11l.5-1.4.5 1.4 1.4.5-1.4.5L5 13l-.5-1.5L3 11.5 4.5 11Z"
    />
  </svg>
);

const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M9 4.5 10.4 3h3.2L15 4.5h3A2.5 2.5 0 0 1 20.5 7v9.5A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5V7A2.5 2.5 0 0 1 6 4.5h3Zm3 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-2.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
    />
  </svg>
);

const PersonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 4.5a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5Zm0 7.75c3.04 0 5.5 2.09 5.5 4.67 0 .86-.7 1.58-1.56 1.58H8.06A1.58 1.58 0 0 1 6.5 16.9c0-2.58 2.46-4.65 5.5-4.65Z"
    />
  </svg>
);

type QuickActionButtonProps = {
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  iconSize?: string;
};

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  Icon,
  onClick,
  iconSize = "h-8 w-8",
}) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="flex flex-col items-center justify-center gap-0.5 focus:outline-none focus-visible:ring-2"
    style={{ color: 'var(--hub-text)' }}
    aria-label={label}
  >
    <Icon className={iconSize} aria-hidden="true" />
    <span className="text-[12px] leading-tight font-medium whitespace-nowrap" style={{ color: 'var(--hub-text-body)' }}>{label}</span>
  </button>
);

export function QuickActionsTile() {
  const navigate = useNavigate();
  const { navigateFromHub } = useHub();
  const [isEchoSheetOpen, setIsEchoSheetOpen] = useState(false);
  const [isCreateGameSheetOpen, setIsCreateGameSheetOpen] = useState(false);

  const openProfile = () => navigate('/profile');
  const openCreateGame = () => setIsCreateGameSheetOpen(true);
  const openEcho = () => setIsEchoSheetOpen(true);

  return (
    <>
      <Tile title="Quick Actions" align="center">
        <div className="h-full flex items-center justify-center">
          <div className="hub-quick-actions grid grid-cols-2 gap-x-6 gap-y-3.5">
            <QuickActionButton
              label="Create Game"
              Icon={FlagIcon}
              onClick={openCreateGame}
            />
            <QuickActionButton
              label="Ask Echo"
              Icon={SparklesIcon}
              onClick={openEcho}
              iconSize="h-10 w-10"
            />
            <QuickActionButton
              label="Your Profile"
              Icon={PersonIcon}
              onClick={openProfile}
              iconSize="h-9 w-9"
            />
          </div>
        </div>
      </Tile>
      
      <HubEchoSheet 
        isOpen={isEchoSheetOpen} 
        onClose={() => setIsEchoSheetOpen(false)} 
      />
      
      <HubCreateGameSheet 
        isOpen={isCreateGameSheetOpen} 
        onClose={() => setIsCreateGameSheetOpen(false)} 
      />
    </>
  );
}
