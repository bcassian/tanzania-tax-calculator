import type { Metadata } from 'next';
import Link from 'next/link';
import { getPage, getPageBlocks } from '@/lib/notion';
import { NotionBlocks } from '@/components/NotionBlockRenderer';

export const revalidate = 300; // ISR — refresh every 5 minutes

interface Props {
  params: Promise<{ pageId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pageId } = await params;
  try {
    const page = await getPage(pageId);
    return {
      title: `${page.title} — Master Tax Guide — Tanzania Tax Tools`,
      description: `Learn about ${page.title} in the Tanzania Master Tax Guide.`,
    };
  } catch {
    return { title: 'Tax Guide — Tanzania Tax Tools' };
  }
}

export default async function TaxGuideTopicPage({ params }: Props) {
  const { pageId } = await params;

  let page: Awaited<ReturnType<typeof getPage>> | null = null;
  let blocks: Awaited<ReturnType<typeof getPageBlocks>> = [];
  let error = false;

  try {
    [page, blocks] = await Promise.all([getPage(pageId), getPageBlocks(pageId)]);
  } catch {
    error = true;
  }

  if (error || !page) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href="/tax-guide"
          className="inline-flex items-center gap-1 text-sm text-[#F28500] hover:text-[#d97400] transition-colors mb-4"
        >
          ← Back to guide
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
          Unable to load this topic. It may have been removed or the connection to Notion failed.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Link
        href="/tax-guide"
        className="inline-flex items-center gap-1 text-sm text-[#F28500] hover:text-[#d97400] transition-colors mb-4"
      >
        ← Back to guide
      </Link>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span>{page.icon}</span>
          {page.title}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
        <NotionBlocks blocks={blocks} />
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        View only · Content updated from Notion
      </p>
    </main>
  );
}
