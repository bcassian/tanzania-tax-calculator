import Link from 'next/link';
import type { NotionBlock } from '@/lib/notion';
import type { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';

/* ------------------------------------------------------------------ */
/*  Colour mapping                                                     */
/* ------------------------------------------------------------------ */

const COLOR_MAP: Record<string, string> = {
  gray: 'text-gray-500',
  brown: 'text-amber-800',
  orange: 'text-orange-600',
  yellow: 'text-yellow-600',
  green: 'text-green-700',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  pink: 'text-pink-600',
  red: 'text-red-600',
  gray_background: 'bg-gray-100',
  brown_background: 'bg-amber-50',
  orange_background: 'bg-orange-50',
  yellow_background: 'bg-yellow-50',
  green_background: 'bg-green-50',
  blue_background: 'bg-blue-50',
  purple_background: 'bg-purple-50',
  pink_background: 'bg-pink-50',
  red_background: 'bg-red-50',
};

/* ------------------------------------------------------------------ */
/*  Rich text renderer                                                 */
/* ------------------------------------------------------------------ */

function RichText({ items }: { items: RichTextItemResponse[] }) {
  return (
    <>
      {items.map((item, i) => {
        if (item.type !== 'text') return <span key={i}>{item.plain_text}</span>;

        let el: React.ReactNode = item.plain_text;
        const a = item.annotations;

        if (a.bold) el = <strong>{el}</strong>;
        if (a.italic) el = <em>{el}</em>;
        if (a.strikethrough) el = <s>{el}</s>;
        if (a.underline) el = <u>{el}</u>;
        if (a.code)
          el = (
            <code className="text-sm bg-gray-100 text-pink-600 px-1 py-0.5 rounded">
              {el}
            </code>
          );

        const colorClass =
          a.color !== 'default' ? COLOR_MAP[a.color] ?? '' : '';

        if (item.text.link) {
          const href = item.text.link.url;
          if (href.startsWith('/')) {
            el = (
              <Link
                key={i}
                href={href}
                className={`text-[#F28500] hover:underline ${colorClass}`}
              >
                {el}
              </Link>
            );
          } else {
            el = (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[#F28500] hover:underline ${colorClass}`}
              >
                {el}
              </a>
            );
          }
          return el;
        }

        return (
          <span key={i} className={colorClass || undefined}>
            {el}
          </span>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Individual block renderers                                         */
/* ------------------------------------------------------------------ */

function getText(block: NotionBlock): RichTextItemResponse[] {
  const b = block as Record<string, unknown>;
  const inner = b[block.type] as { rich_text?: RichTextItemResponse[] } | undefined;
  return inner?.rich_text ?? [];
}

function ParagraphBlock({ block }: { block: NotionBlock }) {
  const text = getText(block);
  if (text.length === 0) return <div className="h-4" />;
  return (
    <p className="text-gray-700 leading-relaxed my-2">
      <RichText items={text} />
    </p>
  );
}

function HeadingBlock({
  block,
  level,
}: {
  block: NotionBlock;
  level: 1 | 2 | 3;
}) {
  const text = getText(block);
  const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
  const styles =
    level === 1
      ? 'text-xl font-bold text-gray-900 mt-8 mb-3'
      : level === 2
        ? 'text-lg font-semibold text-gray-900 mt-6 mb-2'
        : 'text-base font-semibold text-gray-800 mt-5 mb-2';
  return (
    <Tag className={styles}>
      <RichText items={text} />
    </Tag>
  );
}

function ToggleBlock({ block }: { block: NotionBlock }) {
  const text = getText(block);
  return (
    <details className="group my-2">
      <summary className="cursor-pointer text-gray-700 font-medium hover:text-gray-900 transition-colors list-none flex items-center gap-1.5">
        <span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
          ▶
        </span>
        <RichText items={text} />
      </summary>
      {block.children && block.children.length > 0 && (
        <div className="pl-5 mt-2 border-l-2 border-gray-100">
          <NotionBlocks blocks={block.children} />
        </div>
      )}
    </details>
  );
}

function QuoteBlock({ block }: { block: NotionBlock }) {
  const text = getText(block);
  return (
    <blockquote className="border-l-4 border-[#F28500]/40 pl-4 py-1 my-3 italic text-gray-600">
      <RichText items={text} />
    </blockquote>
  );
}

function CalloutBlock({ block }: { block: NotionBlock }) {
  const text = getText(block);
  const b = block as Record<string, unknown>;
  const inner = b[block.type] as { icon?: { type: string; emoji?: string } } | undefined;
  const emoji = inner?.icon?.type === 'emoji' ? inner.icon.emoji : '💡';
  return (
    <div className="flex gap-3 p-4 bg-amber-50/60 border border-amber-200/50 rounded-lg my-3">
      <span className="text-xl leading-none">{emoji}</span>
      <div className="text-gray-700 text-sm leading-relaxed flex-1">
        <RichText items={text} />
      </div>
    </div>
  );
}

function CodeBlock({ block }: { block: NotionBlock }) {
  const text = getText(block);
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 my-3 overflow-x-auto text-sm leading-relaxed">
      <code>
        <RichText items={text} />
      </code>
    </pre>
  );
}

function TableBlock({ block }: { block: NotionBlock }) {
  if (!block.children) return null;
  const b = block as Record<string, unknown>;
  const inner = b[block.type] as { has_column_header?: boolean } | undefined;
  const hasHeader = inner?.has_column_header ?? false;

  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border border-gray-200 rounded-lg">
        <tbody>
          {block.children.map((row, ri) => {
            const rowData = row as Record<string, unknown>;
            const cells = (
              rowData[row.type] as { cells?: RichTextItemResponse[][] }
            )?.cells;
            if (!cells) return null;
            const isHeader = hasHeader && ri === 0;
            return (
              <tr
                key={row.id}
                className={isHeader ? 'bg-gray-50 font-semibold' : 'border-t border-gray-100'}
              >
                {cells.map((cell, ci) => {
                  const Tag = isHeader ? 'th' : 'td';
                  return (
                    <Tag
                      key={ci}
                      className="px-3 py-2 text-left text-gray-700"
                    >
                      <RichText items={cell} />
                    </Tag>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ImageBlock({ block }: { block: NotionBlock }) {
  const b = block as Record<string, unknown>;
  const inner = b[block.type] as {
    type: string;
    file?: { url: string };
    external?: { url: string };
    caption?: RichTextItemResponse[];
  } | undefined;
  if (!inner) return null;
  const url = inner.type === 'file' ? inner.file?.url : inner.external?.url;
  if (!url) return null;
  return (
    <figure className="my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        loading="lazy"
        className="rounded-lg max-w-full"
      />
      {inner.caption && inner.caption.length > 0 && (
        <figcaption className="text-xs text-gray-400 mt-1.5 text-center">
          <RichText items={inner.caption} />
        </figcaption>
      )}
    </figure>
  );
}

function ChildPageBlock({ block }: { block: NotionBlock }) {
  const b = block as Record<string, unknown>;
  const inner = b[block.type] as { title?: string } | undefined;
  return (
    <Link
      href={`/tax-guide/${block.id}`}
      className="block my-2 p-3 rounded-lg border border-gray-100 hover:border-[#006233]/30 hover:shadow-sm transition-all text-sm font-medium text-gray-700 hover:text-[#006233]"
    >
      📄 {inner?.title ?? 'Untitled'}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Block list renderer (groups consecutive list items)                */
/* ------------------------------------------------------------------ */

export function NotionBlocks({ blocks }: { blocks: NotionBlock[] }) {
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    // Group bulleted list items
    if (block.type === 'bulleted_list_item') {
      const items: NotionBlock[] = [];
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        items.push(blocks[i]);
        i++;
      }
      elements.push(
        <ul key={`bl-${items[0].id}`} className="list-disc pl-6 my-2 space-y-1">
          {items.map((item) => (
            <li key={item.id} className="text-gray-700 text-sm leading-relaxed">
              <RichText items={getText(item)} />
              {item.children && item.children.length > 0 && (
                <div className="mt-1">
                  <NotionBlocks blocks={item.children} />
                </div>
              )}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Group numbered list items
    if (block.type === 'numbered_list_item') {
      const items: NotionBlock[] = [];
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        items.push(blocks[i]);
        i++;
      }
      elements.push(
        <ol key={`nl-${items[0].id}`} className="list-decimal pl-6 my-2 space-y-1">
          {items.map((item) => (
            <li key={item.id} className="text-gray-700 text-sm leading-relaxed">
              <RichText items={getText(item)} />
              {item.children && item.children.length > 0 && (
                <div className="mt-1">
                  <NotionBlocks blocks={item.children} />
                </div>
              )}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Single blocks
    elements.push(<NotionBlockItem key={block.id} block={block} />);
    i++;
  }

  return <>{elements}</>;
}

function NotionBlockItem({ block }: { block: NotionBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'heading_1':
      return <HeadingBlock block={block} level={1} />;
    case 'heading_2':
      return <HeadingBlock block={block} level={2} />;
    case 'heading_3':
      return <HeadingBlock block={block} level={3} />;
    case 'toggle':
      return <ToggleBlock block={block} />;
    case 'quote':
      return <QuoteBlock block={block} />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'code':
      return <CodeBlock block={block} />;
    case 'table':
      return <TableBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'child_page':
      return <ChildPageBlock block={block} />;
    case 'divider':
      return <hr className="my-4 border-gray-200" />;
    default:
      return null;
  }
}
