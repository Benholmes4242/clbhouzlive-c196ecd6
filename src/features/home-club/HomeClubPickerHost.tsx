import { HomeClubPickerSheet } from './HomeClubPickerSheet';
import { useHomeClubPickerState, closeHomeClubPicker } from './homeClubPickerStore';

/**
 * Singleton host for the home club picker, mounted once at the app root so the
 * sheet survives the surface that opened it (profile prompt, clubs card,
 * onboarding form) unmounting.
 */
export function HomeClubPickerHost() {
  const { open, onSelected } = useHomeClubPickerState();
  return (
    <HomeClubPickerSheet
      open={open}
      onClose={closeHomeClubPicker}
      onSelected={onSelected}
    />
  );
}

export default HomeClubPickerHost;
