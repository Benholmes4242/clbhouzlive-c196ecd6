export const createFileInput = (accept: string, multiple: boolean = true, capture?: string, isMobile?: boolean) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.multiple = multiple;
  
  // Add mobile-specific attributes for better compatibility
  if (isMobile) {
    if (capture) {
      input.setAttribute('capture', capture);
    }
    // Add mobile-specific styling to ensure visibility
    input.style.position = 'absolute';
    input.style.visibility = 'hidden';
    input.style.width = '0';
    input.style.height = '0';
  }
  
  console.log('Created file input with:', { accept, multiple, capture, isMobile });
  return input;
};

export const handleFileSelection = (
  files: FileList | null,
  onFileSelected: (file: File) => void,
  onMultipleFiles: (files: File[], urls: string[]) => void,
  onClose: () => void
) => {
  console.log('handleFileSelection called with:', { files, hasFiles: !!files, fileCount: files?.length || 0 });
  
  if (!files || files.length === 0) {
    console.log('No files selected - this might be the issue on mobile');
    return;
  }

  const fileArray = Array.from(files);
  console.log(`GalleryPicker handleFileSelection: ${fileArray.length} files selected`, {
    files: fileArray.map(f => ({ name: f.name, type: f.type, size: f.size }))
  });
  
  if (fileArray.length === 1) {
    console.log('Single file selected, calling onFileSelected');
    onFileSelected(fileArray[0]);
    onClose(); // Close the gallery picker after single file selection
  } else {
    console.log('Multiple files selected, entering multi-select mode');
    const urls = fileArray.map(file => URL.createObjectURL(file));
    onMultipleFiles(fileArray, urls);
  }
};