import React from 'react';
import ModalHeader from './ModalHeader';
import TabPanels from './TabPanels';
import ComposerBar from './ComposerBar';

interface CaddieModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  messages: any[];
  isLoading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  userLocation: string;
  requestLocation: () => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  scrollAreaRef: React.RefObject<any>;
  suggestedPrompts: string[];
}

const CaddieModal: React.FC<CaddieModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  messages,
  isLoading,
  inputValue,
  setInputValue,
  handleSendMessage,
  isRecording,
  isProcessing,
  startRecording,
  stopRecording,
  userLocation,
  requestLocation,
  showHistory,
  setShowHistory,
  scrollAreaRef,
  suggestedPrompts
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="flex h-[min(90vh,720px)] w-[min(92vw,760px)] flex-col overflow-hidden rounded-2xl bg-background shadow-xl">
        {/* Header / Tabs */}
        <ModalHeader 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={onClose}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
        />

        {/* ---- The ONLY scrollable area ---- */}
        <div 
          id="caddie-content"
          className="flex-1 overflow-y-auto min-h-0"
        >
          <TabPanels 
            activeTab={activeTab}
            messages={messages}
            isLoading={isLoading}
            scrollAreaRef={scrollAreaRef}
            suggestedPrompts={suggestedPrompts}
            isRecording={isRecording}
            isProcessing={isProcessing}
            startRecording={startRecording}
            stopRecording={stopRecording}
            userLocation={userLocation}
            requestLocation={requestLocation}
          />
        </div>

        {/* Divider + Footer (composer) */}
        <div className="shrink-0 border-t">
          <ComposerBar 
            activeTab={activeTab}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSendMessage={handleSendMessage}
            isRecording={isRecording}
            isProcessing={isProcessing}
            startRecording={startRecording}
            stopRecording={stopRecording}
            userLocation={userLocation}
            requestLocation={requestLocation}
          />
        </div>
      </div>
    </div>
  );
};

export default CaddieModal;