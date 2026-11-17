/** Navigation for code mounted outside BrowserRouter (toasts, upload bridge).
 * AppNavigateRegistrar (inside the router) registers react-router's navigate;
 * without it, falls back to a full page load. */
type NavFn = (to: string) => void;
let current: NavFn | null = null;

export function registerAppNavigate(fn: NavFn | null): void { current = fn; }

export function appNavigate(to: string): void {
  if (current) current(to);
  else window.location.assign(to);
}
