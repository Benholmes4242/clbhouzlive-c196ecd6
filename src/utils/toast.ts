
// Utility function to show a center-screen toast
export function showToast(message: string, emoji = '', duration = 2000) {
  const toast = document.createElement('div');
  toast.innerText = `${message} ${emoji}`;
  Object.assign(toast.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#000',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '16px',
    zIndex: '9999',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}
