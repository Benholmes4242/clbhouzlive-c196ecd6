import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-background rounded-t-2xl shadow-2xl z-50 max-h-[90vh] overflow-hidden",
          "md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto md:right-auto",
          "md:max-w-2xl md:w-full md:max-h-[80vh] md:rounded-lg",
          "animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:fade-in-0 md:zoom-in-95",
          className
        )}>
          {/* Mobile Handle */}
          <div className="block md:hidden w-12 h-1 bg-muted rounded-full mx-auto mt-3 mb-4" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MobileModal;