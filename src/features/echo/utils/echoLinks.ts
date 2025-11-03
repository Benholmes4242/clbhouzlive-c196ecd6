/**
 * Echo Link Helpers
 * Generate shareable URLs for Echo conversations and analyses
 */

interface ChatLinkOptions {
  msgId?: string;
}

interface SwingLinkOptions {
  t?: number;
  commentId?: string;
}

export const echoLinks = {
  chat: (id: string, opts?: ChatLinkOptions) => {
    const base = `/hub/echo/history/chat/${id}`;
    return opts?.msgId ? `${base}#msg=${opts.msgId}` : base;
  },

  swing: (id: string, opts?: SwingLinkOptions) => {
    const base = `/hub/echo/history/swing/${id}`;
    const params = new URLSearchParams();
    
    if (opts?.t != null) {
      params.set('t', String(opts.t));
    }
    
    const query = params.toString();
    const hash = opts?.commentId ? `#comment=${opts.commentId}` : '';
    
    return `${base}${query ? `?${query}` : ''}${hash}`;
  },
};
