import { Shield, CheckCircle2 } from 'lucide-react';
import { BusinessSectionHeader } from '../BusinessSectionHeader';

export function BusinessVerificationInfo() {
  return (
    <div>
      <BusinessSectionHeader
        icon={Shield}
        title="Get Verified"
        description="Show golfers your business is authentic"
      />
      
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/60 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b] mb-1">
              Verification badge
            </h3>
            <p className="text-xs text-[#64748b]">
              Once your profile is live, you can request verification to show golfers your business is authentic and trusted.
            </p>
          </div>
        </div>
        
        <div className="space-y-3 ml-[52px]">
          {[
            'Submit a verification request from your business profile',
            'We\'ll review your details',
            'Approved profiles receive a verified badge',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[#64748b]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
              {step}
            </div>
          ))}
        </div>
        
        <p className="text-xs text-[#94a3b8] mt-4 pt-4 border-t border-[#e2e8f0]">
          Verification is optional and not required to use Clbhouz.
        </p>
      </div>
    </div>
  );
}
