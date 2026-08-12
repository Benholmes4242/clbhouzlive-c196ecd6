/**
 * VerifiedAccountsNote — informational note explaining who gets verified
 * and how to request a review. Personal users only.
 *
 * Two placement modes:
 *  - variant="profile"  → dismissible card (own profile, unverified viewer)
 *  - variant="settings" → permanent row inside Support & Legal
 *
 * All strings via t(). ASCII only, hyphens not em dashes.
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

const INK = '#0F172A';
const INK_60 = '#64748B';
const HAIRLINE = 'rgba(15,23,42,0.07)';
const AMBER = '#F7931E';
const FONT = 'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const DISMISS_KEY = 'verified_accounts_note_dismissed_v1';
const CONTACT_HREF =
  '/manage/contact?category=account&subject=Verification%20enquiry';

const readDismissed = () => {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
};
const writeDismissed = () => {
  try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* silent */ }
};

interface Props {
  variant: 'profile' | 'settings';
}

export const VerifiedAccountsNote: React.FC<Props> = ({ variant }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => variant === 'profile' && readDismissed(),
  );

  if (dismissed) return null;

  const title = t('verifiedAccounts.title');
  const body = t('verifiedAccounts.body');
  const cta = t('verifiedAccounts.cta');
  const dismissLabel = t('verifiedAccounts.dismissA11y');

  const goToContact = () => navigate(CONTACT_HREF);

  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 18,
        padding: '14px 16px',
        fontFamily: FONT,
      }}
    >
      {variant === 'profile' && (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={() => { writeDismissed(); setDismissed(true); }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: INK_60,
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingRight: variant === 'profile' ? 28 : 0 }}>
        <VerifiedBadge size="sm" className="text-[color:var(--brand-amber,#F7931E)]" />
        <div style={{ fontSize: 15, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
          {title}
        </div>
      </div>

      <p
        style={{
          fontSize: 13.5,
          lineHeight: 1.55,
          color: INK_60,
          margin: 0,
          marginBottom: 10,
        }}
      >
        {body}
      </p>

      <button
        type="button"
        onClick={goToContact}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'transparent',
          border: 'none',
          padding: 0,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 700,
          color: AMBER,
          cursor: 'pointer',
        }}
      >
        {cta}
      </button>
    </div>
  );
};

export default VerifiedAccountsNote;
