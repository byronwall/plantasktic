"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useSearch } from "~/components/SearchContext";

import type { ReactNode } from "react";
import type { Components } from "react-markdown";

function highlightText(text: string | ReactNode, searchQuery: string) {
  if (!searchQuery) {
    return text;
  }

  if (typeof text !== "string") {
    return text;
  }

  const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));

  return parts.map((part, i) =>
    part.toLowerCase() === searchQuery.toLowerCase() ? (
      <span key={i} className="bg-yellow-200 dark:bg-yellow-900">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function getTextFromChildren(children: ReactNode): string | ReactNode {
  if (typeof children === "string") {
    return children;
  }

  if (Array.isArray(children)) {
    throw new Error("Array of children not supported");
  }
  if (children === null || children === undefined) {
    return "";
  }
  if (typeof children === "number") {
    return children.toString();
  }
  if (typeof children === "boolean") {
    return children.toString();
  }

  if (typeof children === "object") {
    if ("props" in children) {
      return children;
    }
  }

  return "";
}

export function SimpleMarkdown({ text }: { text: string }) {
  const { searchQuery } = useSearch();

  const components: Components = {
    // Open links in new tab
    a: (props) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {highlightText(getTextFromChildren(props.children), searchQuery)}
      </a>
    ),
    // Style code blocks and inline code
    code: (props) => (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
        {highlightText(getTextFromChildren(props.children), searchQuery)}
      </code>
    ),
    // Style lists
    ul: (props) => <ul {...props} className="ml-4 list-disc" />,
    ol: (props) => <ol {...props} className="ml-4 list-decimal" />,
    li: (props) => <li {...props} className="my-0.5" />,

    // Style paragraphs to work well in the task list
    p: (props) => {
      const newChildren = Array.isArray(props.children)
        ? props.children.map((child: ReactNode) =>
            highlightText(getTextFromChildren(child), searchQuery),
          )
        : highlightText(getTextFromChildren(props.children), searchQuery);

      return (
        <span {...props} className="inline">
          {newChildren}
        </span>
      );
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  );
}
