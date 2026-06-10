interface MedianAppleSuccess {
  idToken: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  type: 'apple';
}

interface MedianAppleError {
  error: string;
  type: 'apple';
}

type MedianAppleResponse = MedianAppleSuccess | MedianAppleError;

interface MedianSocialLogin {
  apple: {
    login: (opts: {
      callback: (response: MedianAppleResponse) => void;
      scope?: string;
    }) => void;
  };
}

interface Window {
  median?: {
    socialLogin?: MedianSocialLogin;
    statusbar?: {
      set?: (opts: { style: string; color: string; overlay: boolean; blur: boolean }) => void;
    };
    [key: string]: any;
  };
}
