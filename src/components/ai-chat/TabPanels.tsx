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
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  userLocation: string;
  requestLocation: () => void;
}

const TabPanels: React.FC<TabPanelsProps> = ({
  activeTab,
  messages,
  isLoading,
  scrollAreaRef,
  suggestedPrompts,
  isRecording,
  isProcessing,
  startRecording,
  stopRecording,
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
          onPromptClick={() => {}}
        />
      </TabsContent>

      <TabsContent value="logs" className="h-full m-0">
        <CaddieLogsPanel 
          isRecording={isRecording}
          isProcessing={isProcessing}
          startRecording={startRecording}
          stopRecording={stopRecording}
          userLocation={userLocation}
          requestLocation={requestLocation}
        />
      </TabsContent>

      <TabsContent value="proai" className="h-full m-0">
        <ProAiPanel 
          isRecording={isRecording}
          isProcessing={isProcessing}
          startRecording={startRecording}
          stopRecording={stopRecording}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TabPanels;