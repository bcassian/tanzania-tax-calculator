'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { TaxGuideTopic } from '@/lib/navConfig';

interface Props {
  currentPath: string;
  onNavigate: () => void;
}

export default function SidebarGuideSection({ currentPath, onNavigate }: Props) {
  const isGuidePage = currentPath.startsWith('/tax-guide');
  const [expanded, setExpanded] = useState(isGuidePage);
  const [topics, setTopics] = useState<TaxGuideTopic[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-expand when navigating to a guide page
  useEffect(() => {
    if (isGuidePage) setExpanded(true);
  }, [isGuidePage]);

  // Fetch topics when first expanded
  useEffect(() => {
    if (!expanded || topics.length > 0) return;

    setLoading(true);
    fetch('/api/tax-guide-topics')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: TaxGuideTopic[]) => setTopics(data))
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, [expanded, topics.length]);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
        aria-expanded={expanded}
      >
        <span
          className={`text-[10px] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        >
          ▶
        </span>
        Tax Guide Topics
      </button>

      {expanded && (
        <div className="space-y-0.5 pb-2">
          {loading && (
            <div className="px-4 py-2 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-[#F28500] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Loading topics…</span>
            </div>
          )}

          {!loading && topics.length === 0 && (
            <p className="px-4 py-2 text-xs text-gray-400">
              No topics available.
            </p>
          )}

          {topics.map((topic) => {
            const href = `/tax-guide/${topic.id}`;
            const active = currentPath === href;
            return (
              <Link
                key={topic.id}
                href={href}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 pl-10 pr-4 py-2 text-sm rounded-lg transition-colors ${
                  active
                    ? 'bg-[#F28500]/5 text-[#F28500] border-l-2 border-[#F28500] -ml-[2px]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base">{topic.icon}</span>
                <span className="truncate">{topic.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
