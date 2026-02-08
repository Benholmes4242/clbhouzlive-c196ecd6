/**
 * Hub Theme - Intentional brand colors only
 * All generic UI colors (text, backgrounds, borders, shadows, dividers)
 * are now handled by semantic tokens in components.
 */

export const HUB_COLORS = {
  // Messages brand accent (intentional WhatsApp-style green)
  messagesIcon: '#25D366',
  unreadGreen: '#2A9D5C',
  onlineGreen: '#34C759',

  // Echo card brand (warm orange tones — intentional)
  echoBgGradient: 'linear-gradient(135deg, #FFF8F0 0%, #FFF4E6 50%, #FFEDD5 100%)',
  echoOrb: '#FFBF66',
  echoInputBorder: 'rgba(255, 191, 102, 0.2)',
  echoAccent: '#FF9500',
} as const;
