import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

/**
 * BRIEF_VERIFICATION_PHASE_2 §3 — the one link to the published criteria.
 *
 * The criteria live as a database-backed legal document at
 * /legal/business-verification, so wording changes need no deploy. This
 * component is the ONLY place the path is written, and the label is always
 * plain guidance ("How verification works"), never "Terms": this is not an
 * agreement the business signs.
 */
interface Props {
  /** Dark ink on light surfaces (default), or muted where it sits under a decision. */
  tone?: 'ink' | 'mute';
  align?: 'left' | 'center';
  className?: string;
  onNavigate?: () => void;
}

export default function VerificationCriteriaLink({
  tone = 'ink',
  align = 'left',
  className,
  onNavigate,
}: Props) {
  return (
    <div
      className={className}
      style={{ textAlign: align, display: align === 'center' ? 'block' : 'flex' }}
    >
      <Link
        to="/legal/business-verification"
        onClick={onNavigate}
        className="inline-flex items-center gap-1.5"
        style={{
          minHeight: 44,
          alignItems: 'center',
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: tone === 'ink' ? '#0F172A' : 'rgba(15,23,42,0.60)',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        <ExternalLink size={11} strokeWidth={2.5} />
        How verification works
      </Link>
    </div>
  );
}
