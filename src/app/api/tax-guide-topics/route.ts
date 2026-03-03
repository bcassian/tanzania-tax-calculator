import { NextResponse } from 'next/server';
import { getDatabasePages } from '@/lib/notion';

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  const envOk = process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID;

  if (!envOk) {
    return NextResponse.json([]);
  }

  try {
    const pages = await getDatabasePages();
    return NextResponse.json(
      pages.map((p) => ({ id: p.id, title: p.title, icon: p.icon })),
    );
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
