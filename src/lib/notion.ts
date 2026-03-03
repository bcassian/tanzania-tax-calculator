import { Client } from '@notionhq/client';
import type {
  BlockObjectResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NotionBlock = BlockObjectResponse & {
  children?: NotionBlock[];
};

export interface NotionPage {
  id: string;
  title: string;
  icon: string;
}

/* ------------------------------------------------------------------ */
/*  Client                                                             */
/* ------------------------------------------------------------------ */

function getClient() {
  const token = process.env.NOTION_API_KEY;
  if (!token) throw new Error('Missing NOTION_API_KEY environment variable');
  return new Client({ auth: token });
}

function getDatabaseId() {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) throw new Error('Missing NOTION_DATABASE_ID environment variable');
  return id;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function extractTitle(page: PageObjectResponse): string {
  const props = page.properties;
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === 'title' && prop.title.length > 0) {
      return prop.title.map((t) => t.plain_text).join('');
    }
  }
  return 'Untitled';
}

function extractIcon(page: PageObjectResponse): string {
  if (page.icon?.type === 'emoji') return page.icon.emoji;
  return '📄';
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/** Fetch every page from the Notion database, sorted by title. */
export async function getDatabasePages(): Promise<NotionPage[]> {
  const notion = getClient();
  const databaseId = getDatabaseId();

  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
      sorts: [{ property: 'title', direction: 'ascending' }],
    });

    for (const page of res.results) {
      if (!('properties' in page)) continue;
      const p = page as PageObjectResponse;
      pages.push({
        id: p.id,
        title: extractTitle(p),
        icon: extractIcon(p),
      });
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

/** Fetch a single page's metadata. */
export async function getPage(pageId: string): Promise<NotionPage> {
  const notion = getClient();
  const page = (await notion.pages.retrieve({ page_id: pageId })) as PageObjectResponse;
  return {
    id: page.id,
    title: extractTitle(page),
    icon: extractIcon(page),
  };
}

/** Recursively fetch all blocks for a page. */
export async function getPageBlocks(
  pageId: string,
  depth = 3,
): Promise<NotionBlock[]> {
  const notion = getClient();

  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of res.results) {
      if (!('type' in block)) continue;
      const b = block as NotionBlock;

      if (b.has_children && depth > 0) {
        b.children = await getPageBlocks(b.id, depth - 1);
      }

      blocks.push(b);
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks;
}
