/**
 * THE POST CONTENT GATE, as one function.
 *
 * It lives here rather than inline in StageComposer because it is the rule the
 * whole of phase 3 turns on and it ships in TWO commits: commit A keeps the
 * media requirement, commit B (held until create_post_v2 has been replaced)
 * accepts words alone. One function means the change is one line in one diff
 * rather than a condition to find inside a 1,200-line screen.
 *
 * EDIT IS EXEMPT OF BOTH RULES, DELIBERATELY: round posts and everything
 * published before the media rule carry no media and must still be saveable.
 */
export interface PostContentGateInput {
  isEditMode: boolean;
  mediaCount: number;
  caption: string;
}

export function postContentGate({ isEditMode, mediaCount, caption }: PostContentGateInput): boolean {
  // A post needs ONE of the two, not both: 11% of posts carry no caption, and
  // requiring a photograph in front of a member who wants to write two
  // sentences is the wall this phase removes.
  return isEditMode || mediaCount > 0 || caption.trim().length > 0;
}
