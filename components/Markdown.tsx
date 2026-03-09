import ReactMarkdown from "react-markdown";

const components = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-base font-bold text-white mt-4 mb-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-bold text-white mt-3 mb-1.5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-slate-200 mt-2 mb-1 first:mt-0">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-slate-300">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-2 space-y-1 pl-4">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-2 space-y-1 pl-4 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm leading-relaxed relative before:content-['•'] before:absolute before:-left-3.5 before:text-slate-500 [ol_&]:before:content-none [ol_&]:list-item">
      {children}
    </li>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 overflow-x-auto my-2">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-slate-200">
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="my-2">{children}</pre>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-slate-600 pl-3 my-2 text-slate-400 italic text-sm">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-white/10 my-3" />,
};

export default function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown components={components as never}>{children}</ReactMarkdown>
    </div>
  );
}
