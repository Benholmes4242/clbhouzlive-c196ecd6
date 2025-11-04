import { useSearchParams } from 'react-router-dom';
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
  const [qs, setQs] = useSearchParams();
  const key = (qs.get('sheet') as keyof typeof SHEETS | null) ?? null;

  const close = () => {
    // Clear sheet + common extras these sheets might set
    qs.delete('sheet');
    ['id', 'msg', 'tab'].forEach((p) => qs.delete(p));
    setQs(qs, { replace: true });
  };

  const SheetComp = key ? SHEETS[key] : null;

  if (key) console.log('[HubSheetRouter] open sheet =', key);

  return (
    <BottomSheet open={Boolean(SheetComp)} onClose={close} ariaLabel={key ?? undefined}>
      {SheetComp ? <SheetComp onClose={close} /> : null}
    </BottomSheet>
  );
}
