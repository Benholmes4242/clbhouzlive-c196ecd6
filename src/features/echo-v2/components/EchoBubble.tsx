import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { EchoMessageMeta } from '../hooks/useEchoChatMessages';
import { EchoConsensusLine } from './EchoConsensusLine';

const INK = '#1F2428';
const USER_BG = '#15171F';
const USER_FG = '#F5F6F7';
const CARD_BG = '#FFFFFF';
const HAIRLINE = 'rgba(0,0,0,0.07)';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  meta?: EchoMessageMeta | null;
  streaming?: boolean;
}

export const EchoBubble: React.FC<Props> = ({ role, content, meta, streaming }) => {
  if (role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 12px' }}>
        <div
          style={{
            maxWidth: '80%',
            background: USER_BG,
            color: USER_FG,
            padding: '9px 13px',
            borderRadius: '16px 16px 5px 16px',
            fontSize: 14,
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '4px 12px' }}>
      <div
        style={{
          maxWidth: '92%',
          background: CARD_BG,
          border: `0.5px solid ${HAIRLINE}`,
          padding: '10px 14px',
          borderRadius: '5px 16px 16px 16px',
          fontSize: 14,
          lineHeight: 1.5,
          color: INK,
          wordBreak: 'break-word',
          boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
        }}
        className="echo-v2-markdown"
      >
        {content ? (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
              ul: ({ children }) => <ul style={{ margin: '4px 0 8px 18px', padding: 0 }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ margin: '4px 0 8px 20px', padding: 0 }}>{children}</ol>,
              li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
              strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noreferrer" style={{ color: INK, textDecoration: 'underline' }}>
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code style={{ background: '#EDEFF2', padding: '1px 5px', borderRadius: 4, fontSize: 13 }}>
                  {children}
                </code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <span style={{ opacity: 0.5 }}>&hellip;</span>
        )}
      </div>
      {!streaming && <EchoConsensusLine meta={meta ?? null} />}
    </div>
  );
};

export default EchoBubble;
