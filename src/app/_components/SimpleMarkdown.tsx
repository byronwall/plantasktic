"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useSearch } from "~/components/SearchContext";

import type { ReactNode } from "react";

function HighlightedText({ text }: { text: string }) {
  const { searchQuery } = useSearch();

  if (!searchQuery) return <>{text}</>;

  const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-900">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function getTextFromChildren(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children))
    return children.map(getTextFromChildren).join("");
  if (children === null || children === undefined) return "";
  if (typeof children === "number") return children.toString();
  if (typeof children === "boolean") return children.toString();
  // For objects (including React elements), return an empty string to avoid [object Object]
  return "";
}

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
        // Style lists
        ul: (props) => <ul {...props} className="ml-4 list-disc" />,
        ol: (props) => <ol {...props} className="ml-4 list-decimal" />,
        li: (props) => <li {...props} className="my-0.5" />,

        // Style paragraphs to work well in the task list and highlight matching text
        p: (props) => (
          <span {...props} className="inline">
            <HighlightedText text={getTextFromChildren(props.children)} />
          </span>
        ),
        // Add highlighting to text nodes
        text: (props) => (
          <HighlightedText text={getTextFromChildren(props.children)} />
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
