
import { useState, useRef } from 'react';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

export const useSnapModal = () => {
  const captionInputRef = useRef<HTMLDivElement>(null);
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<TaggableEntity[]>([]);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const openSnapModal = () => {
    setIsSnapModalOpen(true);
  };

  const closeSnapModal = () => {
    setIsSnapModalOpen(false);
  };

  const openComposer = (file: File) => {
    console.log('Opening composer with file:', file.name, file.type);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsSnapModalOpen(false);
    setIsComposerOpen(true);
  };

  const closeComposer = () => {
    console.log('Closing composer');
    setIsComposerOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setSelectedTags([]);
    setShowSuggestions(false);
    setIsSubmitting(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const showConfirmationToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
    setToastMessage('');
  };

  return {
    captionInputRef,
    isSnapModalOpen,
    isComposerOpen,
    selectedFile,
    previewUrl,
    caption,
    setCaption,
    isSubmitting,
    setIsSubmitting,
    showSuggestions,
    setShowSuggestions,
    mentionSuggestions,
    setMentionSuggestions,
    selectedTags,
    setSelectedTags,
    cursorPosition,
    setCursorPosition,
    showToast,
    toastMessage,
    openSnapModal,
    closeSnapModal,
    openComposer,
    closeComposer,
    showConfirmationToast,
    hideToast
  };
};
