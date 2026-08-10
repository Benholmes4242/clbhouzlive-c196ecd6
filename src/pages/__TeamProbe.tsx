import { Crown, Eye, EyeOff, MoreHorizontal, Pencil, ChevronRight } from 'lucide-react';
import { A, BIZ_KICKER, BIZ_LABEL, BIZ_BODY, bizFigure } from '@/features/courses/components/holes/analytical/tokens';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';

const Row = ({ name, title, pub, manage }: { name: string; title?: string; pub: boolean; manage: boolean }) => (
  <div className="flex items-start gap-3" style={{ padding: '13px 0' }} data-row={name}>
    <SquircleAvatar alt={name} size={44} hairlineRing ringColor={LIGHT_HAIRLINE} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="truncate" data-name style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK }}>{name}</p>
        <span className="inline-flex items-center gap-1" style={{ ...BIZ_LABEL, fontSize: 7.5 }}><Crown size={9} strokeWidth={2.5} />Owner</span>
      </div>
      <p className="truncate" style={{ fontSize: 11.5, fontWeight: 400, color: A.DIM }}>@longusernamehere</p>
      <div style={{ minHeight: 20, marginTop: 3 }}>
        {title ? (
          <span className="inline-flex items-center gap-1.5"><span style={{ ...BIZ_BODY, fontWeight: 600, color: A.INK, lineHeight: 1.2 }}>{title}</span><Pencil size={11.5} color={A.DIM} /></span>
        ) : (
          <span className="inline-flex items-center gap-1"><span style={{ ...BIZ_LABEL, fontSize: 7.5 }}>Add job title</span><ChevronRight size={9} color={A.DIM} /></span>
        )}
      </div>
    </div>
    <div className="flex flex-col items-end shrink-0" style={{ gap: 4 }} data-ctl>
      {manage && <button className="h-8 w-8 flex items-center justify-center rounded-full"><MoreHorizontal size={16} color={A.MUTE} /></button>}
      <span className="inline-flex items-center gap-1" data-vis style={{ ...BIZ_LABEL, fontSize: 7.5, color: pub ? A.MUTE : A.DIM, minHeight: 20, paddingRight: manage ? 8 : 0 }}>
        {pub ? <Eye size={11} /> : <EyeOff size={11} />}{pub ? 'Public' : 'Hidden'}
      </span>
    </div>
  </div>
);

export default function TeamProbe() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }} className="px-4 pt-4">
      <p className="mb-4" style={BIZ_BODY}>Invite people to help manage this business. Public members appear on your profile's Team tab.</p>
      <div className="mb-6" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 14, padding: '4px 16px' }}>
        <div className="pt-3 pb-1 flex items-center justify-between">
          <span style={BIZ_KICKER}>Members</span><span style={bizFigure(15)}>3</span>
        </div>
        <Row name="Alexandra Fotheringham-Smythe" title="Head Greenkeeper" pub manage={false} />
        <Row name="Ben" pub={false} manage />
        <Row name="Christopher Wainwright" title="Director of Golf" pub={false} manage />
      </div>
    </div>
  );
}
