import { toast as sonnerToast, ExternalToast } from 'sonner';

// Consistent toast styling
const defaultOptions: ExternalToast = {
  position: 'bottom-center',
  duration: 4000,
  className: 'font-sans',
};

export const toast = {
  success: (message: string, options?: ExternalToast) => 
    sonnerToast.success(message, { ...defaultOptions, ...options }),
  
  error: (message: string, options?: ExternalToast) => 
    sonnerToast.error(message, { ...defaultOptions, duration: 5000, ...options }),
  
  info: (message: string, options?: ExternalToast) => 
    sonnerToast.info(message, { ...defaultOptions, ...options }),
  
  warning: (message: string, options?: ExternalToast) => 
    sonnerToast.warning(message, { ...defaultOptions, ...options }),
  
  loading: (message: string, options?: ExternalToast) => 
    sonnerToast.loading(message, { ...defaultOptions, duration: Infinity, ...options }),
  
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => sonnerToast.promise(promise, messages),
  
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};

// Game-specific toasts
export const gameToast = {
  rsvpUpdated: (status: 'going' | 'maybe' | 'declined') => {
    const messages = {
      going: { title: "You're in! 🏌️", desc: 'See you on the course' },
      maybe: { title: 'Marked as maybe', desc: "We'll keep your spot" },
      declined: { title: 'Not going', desc: 'Maybe next time' },
    };
    const { title, desc } = messages[status];
    toast.success(title, { description: desc });
  },
  
  gameCreated: (courseName: string) => {
    toast.success('Game created!', {
      description: `Your game at ${courseName} is ready`,
    });
  },
  
  gameCancelled: () => {
    toast.info('Game cancelled', {
      description: 'All participants have been notified',
    });
  },
  
  joinRequestSent: () => {
    toast.success('Request sent!', {
      description: "The host will review your request",
    });
  },
  
  inviteSent: (count: number) => {
    toast.success(`Invite${count > 1 ? 's' : ''} sent!`, {
      description: `${count} player${count > 1 ? 's' : ''} invited to join`,
    });
  },
};

// Trip-specific toasts
export const tripToast = {
  tripCreated: (tripName: string) => {
    toast.success('Trip created!', {
      description: `${tripName} is ready for planning`,
    });
  },
  
  roundAdded: (courseName: string) => {
    toast.success('Round added', {
      description: courseName,
    });
  },
};
