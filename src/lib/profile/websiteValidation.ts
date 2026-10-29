/** Existing personal-profile URL validation; shared by legacy form and EP4. */
export const PERSONAL_WEBSITE_LIMIT = 3;
export const PERSONAL_WEBSITE_ERROR = 'URLs must start with http:// or https://';
export const personalWebsiteValid = (url: string) => !url || /^https?:\/\/.+/.test(url);