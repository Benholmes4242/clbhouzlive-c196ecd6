import React from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import ChatPanel from './ChatPanel';
import CaddieLogsPanel from './CaddieLogsPanel';
import ProAiPanel from './ProAiPanel';

interface TabPanelsProps {
  activeTab: string;
  messages: any[];
  isLoading: boolean;
  scrollAreaRef: React.RefObject<any>;
  suggestedPrompts: string[];
  onPromptClick: (prompt: string) => void;
  onSaveToInsights: (message: any) => void;
  onRequestDetail: (content: string) => void;
  userLocation: string;
  requestLocation: () => void;
}

const TabPanels: React.FC<TabPanelsProps> = ({
  activeTab,
  messages,
  isLoading,
  scrollAreaRef,
  suggestedPrompts,
  onPromptClick,
  onSaveToInsights,
  onRequestDetail,
  userLocation,
  requestLocation
}) => {
  return (
    <Tabs value={activeTab} className="h-full">
      <TabsContent value="chat" className="h-full m-0">
        <ChatPanel 
          messages={messages}
          isLoading={isLoading}
          scrollAreaRef={scrollAreaRef}
          suggestedPrompts={suggestedPrompts}
          onPromptClick={onPromptClick}
          onSaveToInsights={onSaveToInsights}
          onRequestDetail={onRequestDetail}
        />
      </TabsContent>

      <TabsContent value="logs" className="h-full m-0">
        <CaddieLogsPanel 
          userLocation={userLocation}
          requestLocation={requestLocation}
        />
      </TabsContent>

      <TabsContent value="proai" className="h-full m-0">
        <ProAiPanel 
          isRecording={false}
          isProcessing={false}
          startRecording={() => {}}
          stopRecording={() => {}}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TabPanels;