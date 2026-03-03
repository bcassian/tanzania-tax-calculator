import { Client } from '@notionhq/client';
import type {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

// ── Client ──────────────────────────────────────────────────────────────────

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? '';

// ── Types ───────────────────────────────────────────────────────────────────

export type NotionBlock = BlockObjectResponse & {
  children?: NotionBlock[];
};

export interface NotionPage {
  id: string;
  title: string;
  icon: string | null;
}

export type { RichTextItemResponse };

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Extract plain-text title from a Notion page object. */
function extractTitle(page: PageObjectResponse): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === 'title' && prop.title.length > 0) {
      return prop.title.map((t) => t.plain_text).join('');
    }
  }
  return 'Untitled';
}

/** Extract emoji icon (or null) from a Notion page object. */
function extractIcon(page: PageObjectResponse): string | null {
  if (page.icon?.type === 'emoji') return page.icon.emoji;
  return null;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch every page in the database, sorted by title.
 * Handles Notion's 100-item pagination automatically.
 */
export async function getDatabasePages(): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
      sorts: [{ property: 'title', direction: 'ascending' }],
    });

    for (const result of response.results) {
      if (!('properties' in result)) continue;
      const page = result as PageObjectResponse;
      pages.push({
        id: page.id,
        title: extractTitle(page),
        icon: extractIcon(page),
      });
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

/**
 * Fetch a single page's properties (title, icon, etc.).
 */
export async function getPage(pageId: string): Promise<NotionPage> {
  const page = (await notion.pages.retrieve({ page_id: pageId })) as PageObjectResponse;
  return {
    id: page.id,
    title: extractTitle(page),
    icon: extractIcon(page),
  };
}

/**
 * Recursively fetch all blocks of a page (including nested children).
 * `depth` limits recursion to avoid runaway API calls.
 */
export async function getPageBlocks(
  pageId: string,
  depth: number = 3,
): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const result of response.results) {
      if (!('type' in result)) continue;
      const block = result as NotionBlock;

      // Recursively fetch children for blocks that have them
      if (block.has_children && depth > 0) {
        block.children = await getPageBlocks(block.id, depth - 1);
      }

      blocks.push(block);
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks;
}
