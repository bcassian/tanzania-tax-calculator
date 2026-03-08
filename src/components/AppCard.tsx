import Link from 'next/link';

interface AppCardProps {
  title: string;
  description: string;
  href: string;
  badge?: string;
  icon: string;
}

export default function AppCard({ title, description, href, badge, icon }: AppCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#006233]/20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F28500]/30"
    >
      <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdf6ee] text-2xl shadow-sm ring-1 ring-[#F28500]/10">
          <span aria-hidden="true">{icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 transition-colors group-hover:text-[#006233]">
              {title}
            </h2>
            {badge && (
              <span className="rounded-full bg-[#006233]/8 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#006233] ring-1 ring-[#006233]/10">
                {badge}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#9A5700]">
            <span>Open tool</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
