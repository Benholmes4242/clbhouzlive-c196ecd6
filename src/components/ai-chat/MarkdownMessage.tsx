import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className }) => {
  return (
    <div className={`text-body-md leading-relaxed font-normal ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-[#2A9D8F] hover:underline break-words" />,
          h1: ({ children }) => <h3 className="text-body-md font-semibold mb-2 mt-0">{children}</h3>,
          h2: ({ children }) => <h4 className="text-body-md font-semibold mb-2 mt-2">{children}</h4>,
          h3: ({ children }) => <h4 className="text-body-md font-semibold mb-2 mt-2">{children}</h4>,
          p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 break-words">{children}</p>,
          ul: ({ children }) => <ul className="my-2 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 pl-5">{children}</ol>,
          li: ({ children }) => <li className="my-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          code: ({ inline, children, ...props }: any) => 
            inline ? (
              <code className="bg-[rgba(2,16,32,0.06)] border border-[rgba(2,16,32,0.05)] rounded-md px-1 py-0.5 text-[.92em]" {...props}>
                {children}
              </code>
            ) : (
              <code {...props}>{children}</code>
            ),
          pre: ({ children }) => (
            <pre className="mt-2 overflow-auto rounded-lg bg-[#0b2537] text-white text-body-sm leading-relaxed p-3 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              {children}
            </pre>
          ),
        }}
      >
        {content ?? ''}
      </ReactMarkdown>
    </div>
  );
};