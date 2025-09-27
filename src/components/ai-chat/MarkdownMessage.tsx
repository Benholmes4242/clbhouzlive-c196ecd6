import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className }) => {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="underline break-words" />,
          h1: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-0">{children}</h3>,
          h2: ({ children }) => <h4 className="text-sm font-semibold mb-2 mt-2">{children}</h4>,
          h3: ({ children }) => <h4 className="text-sm font-semibold mb-2 mt-2">{children}</h4>,
          p: ({ children }) => <p className="text-sm mb-2 last:mb-0 break-words">{children}</p>,
          ul: ({ children }) => <ul className="text-sm mb-2 ml-4">{children}</ul>,
          ol: ({ children }) => <ol className="text-sm mb-2 ml-4">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        }}
      >
        {content ?? ''}
      </ReactMarkdown>
    </div>
  );
};