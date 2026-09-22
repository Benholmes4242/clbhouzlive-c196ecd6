// Native app bridge (Median) — ambient global types.
// The bridge is injected by the native wrapper at runtime; in the browser
// `window.median` is simply absent, which every caller must handle.

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

export interface MedianSocialProvider {
  login?: (opts: { callback: (response: unknown) => void; scope?: string }) => void;
}

export interface MedianBridge {
  socialLogin?: {
    apple?: {
      login?: (opts: { callback: (response: MedianAppleResponse) => void; scope?: string }) => void;
    };
    google?: MedianSocialProvider;
  };
  statusbar?: {
    set?: (opts: { style?: string; color?: string; overlay?: boolean; blur?: boolean }) => void;
  };
  [key: string]: unknown;
}

declare global {
  interface Window {
    median?: MedianBridge;
    gonern?: MedianBridge;
  }
}

export {};
