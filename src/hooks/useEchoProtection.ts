import { useState } from 'react';

export const useEchoProtection = () => {
  const [isProtectionOpen, setIsProtectionOpen] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<string>('');
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const requestEchoAccess = (operation: string, callback: () => void) => {
    setPendingOperation(operation);
    setPendingCallback(() => callback);
    setIsProtectionOpen(true);
  };

  const handleProtectionSuccess = () => {
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
      setPendingOperation('');
    }
  };

  const handleProtectionClose = () => {
    setIsProtectionOpen(false);
    setPendingCallback(null);
    setPendingOperation('');
  };

  return {
    isProtectionOpen,
    pendingOperation,
    requestEchoAccess,
    handleProtectionSuccess,
    handleProtectionClose
  };
};