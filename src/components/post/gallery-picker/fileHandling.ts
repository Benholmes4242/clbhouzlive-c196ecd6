export const createFileInput = (accept: string, multiple: boolean = true, capture?: string, isMobile?: boolean) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.multiple = multiple;
  if (capture && isMobile) {
    input.setAttribute('capture', capture);
  }
  return input;
};

export const handleFileSelection = (
  files: FileList | null,
  onFileSelected: (file: File) => void,
  onMultipleFiles: (files: File[], urls: string[]) => void,
  onClose: () => void
) => {
  if (!files || files.length === 0) {
    console.log('No files selected');
    return;
  }

  const fileArray = Array.from(files);
  console.log(`GalleryPicker handleFileSelection: ${fileArray.length} files selected`, {
    files: fileArray.map(f => ({ name: f.name, type: f.type, size: f.size }))
  });
  
  if (fileArray.length === 1) {
    console.log('Single file selected, calling onFileSelected');
    onFileSelected(fileArray[0]);
    // Don't close immediately - let the parent component handle closing after composer opens
  } else {
    console.log('Multiple files selected, entering multi-select mode');
    const urls = fileArray.map(file => URL.createObjectURL(file));
    onMultipleFiles(fileArray, urls);
  }
};