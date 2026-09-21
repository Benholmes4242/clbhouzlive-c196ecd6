/**
 * THE POST CONTENT GATE, as one function.
 *
 * It lives here rather than inline in StageComposer because it is the rule the
 * whole of phase 3 turns on and it ships in TWO commits: commit A keeps the
 * media requirement, commit B (held until create_post_v2 has been replaced)
 * accepts words alone. One function means the change is one line in one diff
 * rather than a condition to find inside a 1,200-line screen.
 *
 * EDIT IS EXEMT OF BOTH RULES, DELIBERATELY: round posts and everything
 * published before the media rule carry no media and must still be saveable.
 */
export interface PostContentGateInput {
  isEditMode: boolean;
  mediaCount: number;
  caption: string;
}

export function postContentGate({ isEditMode, mediaCount }: PostContentGateInput): boolean {
  // COMMIT A: media is still required. A text-only post against the CURRENT
  // create_post_v2 raises a bare exception, which the member would see as a
  // failure with no explanation, so the client gate holds the line until the
  // server function has been replaced.
  return isEditMode || mediaCount > 0;
}
