
// Utility function to show a center-screen toast
export function showToast(message: string, emoji = '', duration = 2000) {
  const toast = document.createElement('div');
  toast.innerText = `${message} ${emoji}`;
  Object.assign(toast.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: '16px',
    borderRadius: '12px',
    fontWeight: '500',
    fontSize: '18px',
    zIndex: '9999',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    opacity: '1',
    transition: 'opacity 0.3s ease-out',
  });

  document.body.appendChild(toast);

  // Fade out animation
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, duration - 300);
}
