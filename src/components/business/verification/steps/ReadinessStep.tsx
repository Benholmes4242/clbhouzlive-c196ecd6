import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BusinessSlice {
  name?: string | null;
  category?: string | null;
  location?: string | null;
  website?: string | null;
  email?: string | null;
}

interface Props {
  businessId: string;
  business: BusinessSlice | null | undefined;
  missingWebsite: boolean;
  missingEmail: boolean;
  /** Called when the user follows the "Edit business profile" link, so the parent can close the sheet. */
  onLeaveToEdit: () => void;
}

export default function ReadinessStep({ businessId, business, missingWebsite, missingEmail, onLeaveToEdit }: Props) {
  return (
    <motion.div
      key="readiness"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">1. Confirm your business details</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Pulled from your business profile. Update anything that looks wrong before continuing.
        </p>
      </div>
      <div className="space-y-3">
        <DetailRow label="Business name" value={business?.name} />
        <DetailRow label="Category" value={business?.category} />
        <DetailRow label="Location" value={business?.location} />
        <DetailRow
          label="Website"
          value={business?.website}
          missing={missingWebsite}
          missingMessage="Website required — add one to continue."
        />
        <DetailRow
          label="Contact email"
          value={business?.email}
          missing={missingEmail}
          missingMessage="Contact email required — add one to continue."
        />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/business/${businessId}/edit`} onClick={onLeaveToEdit}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Edit business profile
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

function DetailRow({
  label,
  value,
  missing,
  missingMessage,
}: {
  label: string;
  value?: string | null;
  missing?: boolean;
  missingMessage?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2" style={{ borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
      <span className="text-sm text-muted-foreground shrink-0 w-[100px]">{label}</span>
      {missing ? (
        <span className="text-xs text-destructive flex-1 min-w-0 text-right break-words">{missingMessage}</span>
      ) : (
        <span className="text-sm text-foreground flex-1 min-w-0 text-right overflow-hidden text-ellipsis whitespace-nowrap">
          {value || '—'}
        </span>
      )}
    </div>
  );
}
