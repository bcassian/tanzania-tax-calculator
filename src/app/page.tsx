import AppCard from '@/components/AppCard';
import { NAV_TOOLS } from '@/lib/navConfig';

export default function HomePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tax Tools</h1>
        <p className="text-sm text-gray-500 mt-1">Select a tool to get started.</p>
      </div>

      <div className="space-y-3">
        {NAV_TOOLS.map((app) => (
          <AppCard
            key={app.shortTitle}
            title={app.title}
            description={app.description}
            href={app.href}
            badge={app.badge}
            icon={app.icon}
          />
        ))}
      </div>
    </main>
  );
}
