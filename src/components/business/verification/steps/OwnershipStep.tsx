import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_OPTIONS } from './verificationTypes';

interface Props {
  contactEmail: string;
  setContactEmail: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}

export default function OwnershipStep({
  contactEmail,
  setContactEmail,
  role,
  setRole,
  notes,
  setNotes,
}: Props) {
  return (
    <motion.div
      key="ownership"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">3. Confirm you represent this business</h3>
        <p className="text-xs text-muted-foreground mt-1">
          This helps us verify you're authorised to manage this account.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm text-foreground">Contact email</Label>
          <Input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="name@yourdomain.com"
            type="email"
          />
          <p className="text-[11px] text-muted-foreground">Use a business email if possible.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-foreground">Your role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {role === 'owner' && (
            <p className="text-[10px] font-medium" style={{ color: '#F7931E' }}>
              Owners are typically verified fastest.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-foreground">
            How are you connected to this business?{' '}
            <span className="text-muted-foreground font-normal">(max 500)</span>
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            placeholder="What does this business do, and what's your role?"
            rows={3}
            className="resize-none text-sm"
          />
        </div>
      </div>
      <p
        className="text-[11px] text-muted-foreground pt-4"
        style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}
      >
        By submitting, you confirm you're authorised to represent this business on Clbhouz.
      </p>
    </motion.div>
  );
}
