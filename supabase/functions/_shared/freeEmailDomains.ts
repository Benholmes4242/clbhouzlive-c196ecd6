// MIRROR of src/components/business/verification/signals.ts FREE_EMAIL_DOMAINS.
// Edge functions cannot import from src/, so this is a copy. Keep the two
// byte-identical; the client list is the canonical source.
export const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'outlook.com', 'outlook.co.uk', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'live.co.uk', 'msn.com',
  'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'gmx.com', 'gmx.de', 'gmx.net', 'mail.com', 'zoho.com',
  'proton.me', 'protonmail.com', 'pm.me', 'tutanota.com',
  'yandex.com', 'yandex.ru', 'mail.ru',
  'btinternet.com', 'sky.com', 'talktalk.net', 'virginmedia.com', 'blueyonder.co.uk',
  'comcast.net', 'verizon.net', 'sbcglobal.net', 'cox.net', 'bellsouth.net',
  'web.de', 't-online.de', 'free.fr', 'orange.fr', 'wanadoo.fr',
  'qq.com', '163.com', '126.com', 'naver.com', 'hanmail.net',
  'bigpond.com', 'optusnet.com.au', 'rediffmail.com',
]);
