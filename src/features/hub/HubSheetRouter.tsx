import { useLocation, useNavigate } from 'react-router-dom';
import { BottomSheet } from './components/BottomSheet';
import { GolfersScreen } from './sheets/GolfersScreen';
import { GamesNearYouScreen } from './sheets/GamesNearYouScreen';
import { YourGamesScreen } from './sheets/YourGamesScreen';
import { CreateGameScreen } from './sheets/CreateGameScreen';
import { EchoChatScreen } from './sheets/EchoChatScreen';
import { SwingCoachScreen } from './sheets/SwingCoachScreen';
import { RecentEchoScreen } from './sheets/RecentEchoScreen';

const SHEETS = {
  golfers: GolfersScreen,
  games: GamesNearYouScreen,
  'your-games': YourGamesScreen,
  'create-game': CreateGameScreen,
  echo: EchoChatScreen,
  swing: SwingCoachScreen,
  'recent-echo': RecentEchoScreen,
} as const;

export function HubSheetRouter() {
  const nav = useNavigate();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);
  const key = qs.get('sheet') as keyof typeof SHEETS | null;

  const open = Boolean(key);
  const close = () => {
    qs.delete('sheet');
    nav({ search: qs.toString() ? `?${qs}` : '' }, { replace: true });
  };

  const SheetComp = key ? SHEETS[key] : null;

  return (
    <BottomSheet open={open} onClose={close} ariaLabel={key ?? undefined}>
      {SheetComp ? <SheetComp onClose={close} /> : null}
    </BottomSheet>
  );
}
