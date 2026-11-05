/** Self-removal uses the authorised no-argument RPC; WHS remains untouched. */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useMyProStatus } from './useMyProStatus';
import { invalidateProMembers } from './proMembersCache';
import { proKindLabel } from './proRules';
import { ProLabel } from './ProLabel';
import './pro-status-controls.css';
export function ProStatusSheet({userId,open,onClose}:{userId:string;open:boolean;onClose:()=>void}) {
  const pro=useMyProStatus(userId);
  const qc=useQueryClient();
  const [confirm,setConfirm]=useState(false);
  const [busy,setBusy]=useState(false);
  const raw=pro.verifiedAt;
  const date=typeof raw==='string' ? new Date(raw) : null;
  const verified=date && Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}) : '–';
  const stop=async()=>{
    if(busy)return;
    setBusy(true);
    try {
      const {error}=await supabase.rpc('remove_own_pro_status');
      if(error)throw error;
      await Promise.all([['profile'],['user-profile'],['my-pro-request',userId],['profile-pro-pending',userId]].map(queryKey=>qc.invalidateQueries({queryKey})));
      invalidateProMembers();
      setConfirm(false);onClose();toast("You're no longer shown as a pro");
    } catch {toast.error('Could not update. Please try again.');} finally {setBusy(false);}
  };
  return <><BottomSheet open={open} onClose={()=>{if(!busy){setConfirm(false);onClose();}}} className="pro-status-sheet" topRadius={22} ariaLabelledBy="pro-status-heading"><div className="pro-status-body"><div className="pro-status-kicker">GOLF PROFESSIONAL</div><h2 id="pro-status-heading" className="pro-status-heading">You're verified as a pro <ProLabel size="large" /></h2><div className="pro-status-facts"><div><span>Kind</span><b>{proKindLabel(pro.kind)}</b></div><div><span>{pro.kind==='tour_pro'?'Tour':'Club'}</span><b>{pro.kind==='tour_pro'?pro.tour:pro.club}</b></div><div><span>Verified</span><b>{verified}</b></div></div><p>Back to amateur status, or no longer a professional? You can take the PRO label off yourself. Your handicap prompts come back.</p><Button variant="ghost" className="pro-status-stop" onClick={()=>setConfirm(true)}>Stop showing me as a pro</Button></div></BottomSheet><AlertDialog open={confirm} onOpenChange={value=>{if(!busy)setConfirm(value);}}><AlertDialogContent className="pro-status-confirm" overlayClassName="pro-status-confirm-overlay"><AlertDialogTitle>Stop showing you as a pro?</AlertDialogTitle><AlertDialogDescription>Your PRO label comes off now. To be shown as a pro again, you'd send a new request for us to check.</AlertDialogDescription><div className="pro-status-confirm-actions"><Button variant="ghost" disabled={busy} onClick={()=>setConfirm(false)}>Keep it</Button><Button variant="ghost" className="pro-status-confirm-stop" disabled={busy} onClick={()=>void stop()}>Stop</Button></div></AlertDialogContent></AlertDialog></>;
}