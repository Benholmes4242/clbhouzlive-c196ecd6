import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// FIX_LOCALES_OUT_OF_PUBLIC: before the move, i18next-http-backend could never
// fetch /locales/* under jsdom, so every lazily loaded namespace failed and
// tests saw raw keys (bundled auth English excepted). Reproduce that failed
// fetch here so the app's bundled backend never loads real copy in tests.
vi.mock('@/i18n/localeBackend', () => ({
  bundledBackend: {
    type: 'backend',
    init() {},
    read(lng: string, ns: string, callback: (err: unknown, data: unknown) => void) {
      callback(`failed loading /locales/${lng}/${ns}.json; TypeError: Failed to fetch`, true);
    },
  },
}));
