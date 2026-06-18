import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROOF_OPTIONS, REGISTRY_OPTIONS, type ProofMethod } from './verificationTypes';

interface Props {
  selectedProof: ProofMethod | '';
  setSelectedProof: (v: ProofMethod | '') => void;
  proofWebsiteUrl: string;
  setProofWebsiteUrl: (v: string) => void;
  proofEmail: string;
  setProofEmail: (v: string) => void;
  proofRegistry: string;
  setProofRegistry: (v: string) => void;
  proofCompanyNumber: string;
  setProofCompanyNumber: (v: string) => void;
  proofRegistryUrl: string;
  setProofRegistryUrl: (v: string) => void;
  creatorContactType: 'email' | 'phone';
  setCreatorContactType: (v: 'email' | 'phone') => void;
  creatorEmail: string;
  setCreatorEmail: (v: string) => void;
  creatorPhone: string;
  setCreatorPhone: (v: string) => void;
  golfCourseWebsite: string;
  setGolfCourseWebsite: (v: string) => void;
  exclusivityError: string;
  clearExclusivityError: () => void;
}

export default function ProofStep(props: Props) {
  const { selectedProof, setSelectedProof, exclusivityError, clearExclusivityError } = props;

  return (
    <motion.div
      key="proof"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">2. Proof of legitimacy</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Choose one method below. This helps us confirm your business is real.
        </p>
      </div>
      <RadioGroup
        value={selectedProof}
        onValueChange={(v) => {
          setSelectedProof(v as ProofMethod);
          clearExclusivityError();
        }}
        className="space-y-3"
      >
        {PROOF_OPTIONS.map((option) => {
          const isSelected = selectedProof === option.id;
          const Icon = option.icon;
          return (
            <div key={option.id}>
              <label
                className="flex items-start gap-3 p-3 rounded-sq-sm border cursor-pointer transition-colors"
                style={
                  isSelected
                    ? { borderColor: '#F7931E', background: 'rgba(247,147,30,0.05)' }
                    : { borderColor: 'rgba(15,23,42,0.10)' }
                }
              >
                <RadioGroupItem
                  value={option.id}
                  className="mt-0.5 [&]:border-[#F7931E] [&]:text-[#F7931E] data-[state=checked]:[&]:border-[#F7931E]"
                />
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.subtitle}</p>
                </div>
              </label>
              {isSelected && <ProofInputs {...props} proof={selectedProof} />}
            </div>
          );
        })}
      </RadioGroup>
      {exclusivityError && (
        <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-sq-sm">{exclusivityError}</p>
      )}
    </motion.div>
  );
}

function ProofInputs(props: Props & { proof: ProofMethod }) {
  switch (props.proof) {
    case 'official_website':
      return (
        <div className="space-y-2 mt-4 pl-7">
          <Label className="text-sm text-foreground">Website URL</Label>
          <Input
            value={props.proofWebsiteUrl}
            onChange={(e) => props.setProofWebsiteUrl(e.target.value)}
            placeholder="https://yourbusiness.com"
            type="url"
          />
        </div>
      );
    case 'business_email':
      return (
        <div className="space-y-2 mt-4 pl-7">
          <Label className="text-sm text-foreground">Business email</Label>
          <Input
            value={props.proofEmail}
            onChange={(e) => props.setProofEmail(e.target.value)}
            placeholder="name@yourbusiness.com"
            type="email"
          />
          <p className="text-[11px] text-muted-foreground">Must use the same domain as your website.</p>
        </div>
      );
    case 'registered_business':
      return (
        <div className="space-y-4 mt-4 pl-7">
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Register</Label>
            <Select value={props.proofRegistry} onValueChange={props.setProofRegistry}>
              <SelectTrigger>
                <SelectValue placeholder="Select register" />
              </SelectTrigger>
              <SelectContent>
                {REGISTRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Company / registration number</Label>
            <Input
              value={props.proofCompanyNumber}
              onChange={(e) => props.setProofCompanyNumber(e.target.value)}
              placeholder="12345678"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-foreground">
              Or registry URL <span className="text-muted-foreground font-normal">(alternative)</span>
            </Label>
            <Input
              value={props.proofRegistryUrl}
              onChange={(e) => props.setProofRegistryUrl(e.target.value)}
              placeholder="https://…"
              type="url"
            />
          </div>
        </div>
      );
    case 'creator_business':
      return (
        <div className="space-y-4 mt-4 pl-7">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => props.setCreatorContactType('email')}
              className="px-4 py-2 text-sm font-medium rounded-xl transition-colors min-h-[44px]"
              style={
                props.creatorContactType === 'email'
                  ? { background: '#F7931E', color: '#ffffff' }
                  : { background: 'rgba(15,23,42,0.05)', color: '#64748B' }
              }
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => props.setCreatorContactType('phone')}
              className="px-4 py-2 text-sm font-medium rounded-xl transition-colors min-h-[44px]"
              style={
                props.creatorContactType === 'phone'
                  ? { background: '#F7931E', color: '#ffffff' }
                  : { background: 'rgba(15,23,42,0.05)', color: '#64748B' }
              }
            >
              Phone
            </button>
          </div>
          {props.creatorContactType === 'email' ? (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Business email</Label>
              <Input
                value={props.creatorEmail}
                onChange={(e) => props.setCreatorEmail(e.target.value)}
                placeholder="creator@brand.com"
                type="email"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Business phone number</Label>
              <Input
                value={props.creatorPhone}
                onChange={(e) => props.setCreatorPhone(e.target.value)}
                placeholder="+44 7xxx xxxxxx"
                type="tel"
              />
            </div>
          )}
        </div>
      );
    case 'golf_course':
      return (
        <div className="space-y-2 mt-4 pl-7">
          <Label className="text-sm text-foreground">Official course / facility website</Label>
          <Input
            value={props.golfCourseWebsite}
            onChange={(e) => props.setGolfCourseWebsite(e.target.value)}
            placeholder="https://yourgolfclub.com"
            type="url"
          />
        </div>
      );
    default:
      return null;
  }
}
