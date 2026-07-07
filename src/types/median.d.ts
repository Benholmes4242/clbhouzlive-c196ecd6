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
  google: {
    login: (opts: {
      callback: (response: unknown) => void;
    }) => void;
  };
}


interface Window {
  median?: {
    socialLogin?: MedianSocialLogin;
    statusbar?: {
      // overlay/blur are OPTIONAL — after boot they are never re-sent (see
      // ensureStatusBarOverlayBooted). Style/color updates omit them entirely.
      set?: (opts: { style: string; color: string; overlay?: boolean; blur?: boolean }) => void;
    };
    [key: string]: any;
  };
}
