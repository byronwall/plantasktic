"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function SimpleMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Open links in new tab
        a: (props) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        // Style code blocks and inline code
        code: (props) => (
          <code
            className="rounded bg-muted px-1 py-0.5 font-mono text-sm"
            {...props}
          />
        ),
        // Style paragraphs to work well in the task list
        p: (props) => <span {...props} className="inline" />,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
