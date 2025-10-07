import React from 'react';
import EnhancedSnapModal from './EnhancedSnapModal';

interface SnapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraClick: () => void;
  onImageClick: () => void;
  onVideoClick: () => void; // Keep for backward compatibility
  openComposerWithFiles: (files: File[]) => void;
}

const SnapModal = (props: SnapModalProps) => {
  return <EnhancedSnapModal {...props} />;
};

export default SnapModal;