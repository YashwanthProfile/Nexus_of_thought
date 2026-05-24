import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeRaw, rehypeHighlight]}
        components={{
          img: ({ node, ...props }) => (
            <img 
              {...props} 
              loading="lazy" 
              className="rounded-xl shadow-lg border border-gray-100 my-8 mx-auto block max-w-full h-auto"
              decoding="async"
            />
          ),
          a: ({ node, ...props }) => (
            <a {...props} className="text-orange-600 hover:text-orange-700 underline underline-offset-4 decoration-orange-200" />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
