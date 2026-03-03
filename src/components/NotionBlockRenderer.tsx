import React, { Fragment } from 'react';
import Link from 'next/link';
import type { NotionBlock, RichTextItemResponse } from '@/lib/notion';

// ── Colour mapping ──────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  // Text colours
  gray: 'text-gray-500',
  brown: 'text-amber-700',
  orange: 'text-orange-600',
  yellow: 'text-yellow-700',
  green: 'text-green-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  pink: 'text-pink-600',
  red: 'text-red-600',
  // Background colours
  gray_background: 'bg-gray-100 px-0.5 rounded',
  brown_background: 'bg-amber-50 px-0.5 rounded',
  orange_background: 'bg-orange-50 px-0.5 rounded',
  yellow_background: 'bg-yellow-100 px-0.5 rounded',
  green_background: 'bg-green-50 px-0.5 rounded',
  blue_background: 'bg-blue-50 px-0.5 rounded',
  purple_background: 'bg-purple-50 px-0.5 rounded',
  pink_background: 'bg-pink-50 px-0.5 rounded',
  red_background: 'bg-red-50 px-0.5 rounded',
};

// ── Rich-text renderer ──────────────────────────────────────────────────────

function RichText({ items }: { items: RichTextItemResponse[] }) {
  if (!items || items.length === 0) return null;

  return (
    <>
      {items.map((item, i) => {
        let node: React.ReactNode = item.plain_text;

        const { bold, italic, strikethrough, underline, code, color } =
          item.annotations;

        if (code) {
          node = (
            <code className="text-sm bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded font-mono">
              {node}
            </code>
          );
        }
        if (bold) node = <strong className="font-semibold">{node}</strong>;
        if (italic) node = <em>{node}</em>;
        if (strikethrough) node = <s>{node}</s>;
        if (underline) node = <u>{node}</u>;

        // Links
        if (item.type === 'text' && item.text.link) {
          const href = item.text.link.url;
          const isInternal = href.startsWith('/');
          node = isInternal ? (
            <Link href={href} className="text-[#F28500] hover:underline">
              {node}
            </Link>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F28500] hover:underline"
            >
              {node}
            </a>
          );
        }

        // Colours
        if (color && color !== 'default') {
          const cls = COLOR_MAP[color] ?? '';
          if (cls) node = <span className={cls}>{node}</span>;
        }

        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

// ── Block-level helpers ─────────────────────────────────────────────────────

/** Safely read the rich_text array from any block type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blockRichText(block: NotionBlock): RichTextItemResponse[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (block as any)[block.type];
  return data?.rich_text ?? [];
}

/** Check if a rich_text array is empty / whitespace only. */
function isEmptyText(items: RichTextItemResponse[]): boolean {
  return items.every((t) => t.plain_text.trim() === '');
}

// ── Individual block renderers ──────────────────────────────────────────────

function ParagraphBlock({ block }: { block: NotionBlock }) {
  const text = blockRichText(block);
  if (isEmptyText(text)) return <div className="h-4" />;
  return (
    <p className="text-gray-700 leading-relaxed">
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
  const text = blockRichText(block);
  const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
  const sizes = {
    1: 'text-xl font-bold text-gray-900 mt-8 mb-3',
    2: 'text-lg font-semibold text-gray-900 mt-6 mb-2',
    3: 'text-base font-semibold text-gray-800 mt-5 mb-2',
  };
  return (
    <Tag className={sizes[level]}>
      <RichText items={text} />
    </Tag>
  );
}

function ListGroup({
  blocks,
  ordered,
}: {
  blocks: NotionBlock[];
  ordered: boolean;
}) {
  const Tag = ordered ? 'ol' : 'ul';
  const listCls = ordered
    ? 'list-decimal pl-6 space-y-1.5 text-gray-700 leading-relaxed'
    : 'list-disc pl-6 space-y-1.5 text-gray-700 leading-relaxed';

  return (
    <Tag className={listCls}>
      {blocks.map((block) => (
        <li key={block.id}>
          <RichText items={blockRichText(block)} />
          {block.children && block.children.length > 0 && (
            <div className="mt-1.5">
              <NotionBlocks blocks={block.children} />
            </div>
          )}
        </li>
      ))}
    </Tag>
  );
}

function ToggleBlock({ block }: { block: NotionBlock }) {
  const text = blockRichText(block);
  return (
    <details className="group my-2">
      <summary className="cursor-pointer text-gray-700 font-medium leading-relaxed hover:text-gray-900 transition-colors">
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
  const text = blockRichText(block);
  return (
    <blockquote className="border-l-4 border-[#F28500]/40 pl-4 py-1 text-gray-600 italic leading-relaxed">
      <RichText items={text} />
    </blockquote>
  );
}

function CalloutBlock({ block }: { block: NotionBlock }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (block as any).callout;
  const text: RichTextItemResponse[] = data?.rich_text ?? [];
  const iconEmoji =
    data?.icon?.type === 'emoji' ? data.icon.emoji : null;
  const color: string = data?.color ?? 'default';
  const bgCls = color.includes('background')
    ? COLOR_MAP[color] ?? 'bg-gray-50'
    : 'bg-gray-50';

  return (
    <div className={`flex gap-3 rounded-lg p-4 my-2 ${bgCls}`}>
      {iconEmoji && <span className="text-xl shrink-0">{iconEmoji}</span>}
      <div className="text-gray-700 leading-relaxed min-w-0">
        <RichText items={text} />
      </div>
    </div>
  );
}

function TableBlock({ block }: { block: NotionBlock }) {
  if (!block.children) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasHeader = (block as any).table?.has_column_header ?? false;

  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          {block.children.map((row, rowIdx) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cells: RichTextItemResponse[][] = (row as any).table_row?.cells ?? [];
            const isHeader = hasHeader && rowIdx === 0;
            return (
              <tr key={row.id} className={isHeader ? 'bg-gray-50' : ''}>
                {cells.map((cell, cellIdx) => {
                  const Cell = isHeader ? 'th' : 'td';
                  return (
                    <Cell
                      key={cellIdx}
                      className={`px-3 py-2 text-left ${
                        isHeader
                          ? 'font-semibold text-gray-700'
                          : 'text-gray-600'
                      }`}
                    >
                      <RichText items={cell} />
                    </Cell>
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

function CodeBlock({ block }: { block: NotionBlock }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (block as any).code;
  const text: RichTextItemResponse[] = data?.rich_text ?? [];
  const plain = text.map((t) => t.plain_text).join('');

  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 my-3 overflow-x-auto text-sm font-mono leading-relaxed">
      <code>{plain}</code>
    </pre>
  );
}

function ChildPageBlock({ block }: { block: NotionBlock }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const title: string = (block as any).child_page?.title ?? 'Untitled';
  return (
    <Link
      href={`/tax-guide/${block.id}`}
      className="block bg-white rounded-lg border border-gray-100 p-3 my-2 hover:border-[#006233]/30 hover:shadow-sm transition-all group"
    >
      <span className="text-sm font-medium text-gray-900 group-hover:text-[#006233] transition-colors">
        📄 {title}
      </span>
    </Link>
  );
}

function ImageBlock({ block }: { block: NotionBlock }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (block as any).image;
  const url =
    data?.type === 'external'
      ? data.external?.url
      : data?.file?.url;
  const caption: RichTextItemResponse[] = data?.caption ?? [];

  if (!url) return null;

  return (
    <figure className="my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={caption.map((c) => c.plain_text).join('') || 'Image'}
        className="rounded-lg max-w-full"
        loading="lazy"
      />
      {caption.length > 0 && (
        <figcaption className="text-xs text-gray-400 mt-2 text-center">
          <RichText items={caption} />
        </figcaption>
      )}
    </figure>
  );
}

function DividerBlock() {
  return <hr className="my-6 border-gray-200" />;
}

// ── Main renderer ───────────────────────────────────────────────────────────

/**
 * Renders a flat array of Notion blocks into React elements.
 * Consecutive list items are grouped into <ul>/<ol> wrappers.
 */
export function NotionBlocks({ blocks }: { blocks: NotionBlock[] }) {
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    // Group consecutive bulleted list items
    if (block.type === 'bulleted_list_item') {
      const group: NotionBlock[] = [];
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        group.push(blocks[i]);
        i++;
      }
      elements.push(<ListGroup key={group[0].id} blocks={group} ordered={false} />);
      continue;
    }

    // Group consecutive numbered list items
    if (block.type === 'numbered_list_item') {
      const group: NotionBlock[] = [];
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        group.push(blocks[i]);
        i++;
      }
      elements.push(<ListGroup key={group[0].id} blocks={group} ordered={true} />);
      continue;
    }

    // Single block rendering
    switch (block.type) {
      case 'paragraph':
        elements.push(<ParagraphBlock key={block.id} block={block} />);
        break;
      case 'heading_1':
        elements.push(<HeadingBlock key={block.id} block={block} level={1} />);
        break;
      case 'heading_2':
        elements.push(<HeadingBlock key={block.id} block={block} level={2} />);
        break;
      case 'heading_3':
        elements.push(<HeadingBlock key={block.id} block={block} level={3} />);
        break;
      case 'toggle':
        elements.push(<ToggleBlock key={block.id} block={block} />);
        break;
      case 'quote':
        elements.push(<QuoteBlock key={block.id} block={block} />);
        break;
      case 'callout':
        elements.push(<CalloutBlock key={block.id} block={block} />);
        break;
      case 'divider':
        elements.push(<DividerBlock key={block.id} />);
        break;
      case 'table':
        elements.push(<TableBlock key={block.id} block={block} />);
        break;
      case 'code':
        elements.push(<CodeBlock key={block.id} block={block} />);
        break;
      case 'child_page':
        elements.push(<ChildPageBlock key={block.id} block={block} />);
        break;
      case 'image':
        elements.push(<ImageBlock key={block.id} block={block} />);
        break;
      default:
        // Unsupported block — render as spacer if empty, skip otherwise
        break;
    }

    i++;
  }

  return <>{elements}</>;
}
