import { HomeClubPickerSheet } from './HomeClubPickerSheet';
import { KeyboardClubSearchSheet } from './KeyboardClubSearchSheet';
import { useHomeClubPickerState, closeHomeClubPicker } from './homeClubPickerStore';

/**
 * Singleton host for the home club picker, mounted once at the app root so the
 * sheet survives the surface that opened it (profile prompt, clubs card,
 * onboarding form) unmounting.
 */
export function HomeClubPickerHost() {
  const { open, onSelected, keyboardSearch, pendingName } = useHomeClubPickerState();
  if (keyboardSearch) return <KeyboardClubSearchSheet open={open} onClose={closeHomeClubPicker} onSelected={onSelected} pendingName={pendingName} />;
  return (
    <HomeClubPickerSheet
      open={open}
      onClose={closeHomeClubPicker}
      onSelected={onSelected}
    />
  );
}

export default HomeClubPickerHost;
