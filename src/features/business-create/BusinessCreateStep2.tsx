/**
 * BC2 — step 2 dispatcher: the step 1 category chooses the branch.
 * Golf Club → Step2Club (2A–2D), University / College → Step2College (2E),
 * every other category → Step2Other (2F–2G). Each branch renders its own body
 * and footer inside the BC1 frame; Continue/Claim moves to step 3.
 */
import { Step2Club } from './Step2Club';
import { Step2College } from './Step2College';
import { Step2Other } from './Step2Other';
import type { BusinessCreateDraft } from './createRules';

interface Props {
  draft: BusinessCreateDraft;
  setDraft: (fn: (d: BusinessCreateDraft) => BusinessCreateDraft) => void;
  userId: string;
  onContinue: () => void;
}

export function BusinessCreateStep2({ draft, setDraft, userId, onContinue }: Props) {
  if (draft.category === 'Golf Club') return <Step2Club draft={draft} setDraft={setDraft} userId={userId} onContinue={onContinue} />;
  if (draft.category === 'University / College') return <Step2College draft={draft} setDraft={setDraft} userId={userId} onContinue={onContinue} />;
  return <Step2Other draft={draft} setDraft={setDraft} userId={userId} onContinue={onContinue} />;
}
