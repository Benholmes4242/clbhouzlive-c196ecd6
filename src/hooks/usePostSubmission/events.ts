
export const broadcastPostSuccess = (postId: string, optimisticId: string) => {
  window.dispatchEvent(new CustomEvent('postUploadCompleted', { 
    detail: { postId, optimisticId } 
  }));
  
  
};

export const broadcastPostError = (optimisticId: string) => {
  window.dispatchEvent(new CustomEvent('postUploadFailed', { 
    detail: { optimisticId } 
  }));
};
