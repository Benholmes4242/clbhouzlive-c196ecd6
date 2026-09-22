// Native app bridge (Median) — ambient global types.
// The bridge is injected by the native wrapper at runtime; in the browser
// `window.median` is simply absent, which every caller must handle.

export {};

export interface MedianAppleSuccess {
  idToken: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  fullName?: string | null;
}

export interface MedianAppleError {
  error?: string;
  idToken?: undefined;
}

export type MedianAppleResponse = MedianAppleSuccess | MedianAppleError;

declare global {
  type MedianAppleSuccess = import('./median').MedianAppleSuccess;
  type MedianAppleError = import('./median').MedianAppleError;
  type MedianAppleResponse = import('./median').MedianAppleResponse;

  interface MedianSocialProvider {
    login?: (opts: { callback: (response: unknown) => void; scope?: string }) => void;
  }

  interface MedianBridge {
    socialLogin?: {
      apple?: {
        login?: (opts: {
          callback: (response: MedianAppleResponse) => void;
          scope?: string;
        }) => void;
      };
      google?: MedianSocialProvider;
    };
    [key: string]: unknown;
  }

  interface Window {
    median?: MedianBridge;
    gonern?: MedianBridge;
  }
}
