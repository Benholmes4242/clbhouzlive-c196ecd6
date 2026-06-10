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
  };
}
