// Native app bridge (Median) — ambient global types.
// The bridge is injected by the native wrapper at runtime; in the browser
// `window.median` is simply absent, which every caller must handle.

interface MedianAppleSuccess {
  idToken: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  fullName?: string | null;
}

interface MedianAppleError {
  error?: string;
  idToken?: undefined;
}

type MedianAppleResponse = MedianAppleSuccess | MedianAppleError;

interface MedianSocialProvider {
  login?: (opts: { callback: (response: unknown) => void; scope?: string }) => void;
}

interface MedianBridge {
  socialLogin?: {
    apple?: {
      login?: (opts: { callback: (response: MedianAppleResponse) => void; scope?: string }) => void;
    };
    google?: MedianSocialProvider;
  };
  [key: string]: unknown;
}

interface Window {
  median?: MedianBridge;
  gonern?: MedianBridge;
}
