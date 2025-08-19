import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, X } from 'lucide-react';

interface ModalHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose: () => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  activeTab,
  setActiveTab,
  onClose,
  showHistory,
  setShowHistory
}) => {
  return (
    <>
      {/* Title Bar */}
      <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">caddie AI . powered by clbhouz AI</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="h-8 w-8 p-0"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-shrink-0">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-2 mb-2 flex-shrink-0">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="logs">Caddie Logs</TabsTrigger>
          <TabsTrigger value="proai">Pro AI</TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
};

export default ModalHeader;