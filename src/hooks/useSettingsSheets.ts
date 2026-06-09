import { useState } from 'react';

type SheetKey =
  | 'email' | 'password' | 'blocked' | 'notifications'
  | 'help' | 'contact' | 'legal';

type SheetState = Record<SheetKey, boolean>;

const initial: SheetState = {
  email: false, password: false, blocked: false, notifications: false,
  help: false, contact: false, legal: false,
};

export function useSettingsSheets() {
  const [sheets, setSheets] = useState<SheetState>(initial);

  const open = (key: SheetKey) => setSheets(s => ({ ...s, [key]: true }));
  const close = (key: SheetKey) => setSheets(s => ({ ...s, [key]: false }));

  return { sheets, open, close };
}
