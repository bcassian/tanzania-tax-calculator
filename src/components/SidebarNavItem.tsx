'use client';

import Link from 'next/link';

interface SidebarNavItemProps {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  active: boolean;
  disabled?: boolean;
  indent?: boolean;
  onClick?: () => void;
}

export default function SidebarNavItem({
  href,
  icon,
  label,
  badge,
  active,
  disabled,
  indent,
  onClick,
}: SidebarNavItemProps) {
  const baseClasses = `flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${indent ? 'pl-10' : ''}`;

  if (disabled) {
    return (
      <span className={`${baseClasses} text-gray-300 cursor-default`}>
        <span className="text-lg w-6 text-center opacity-50">{icon}</span>
        <span className="flex-1">{label}</span>
        {badge && (
          <span className="text-[10px] font-medium bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </span>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${baseClasses} ${
        active
          ? 'bg-[#F28500]/5 text-[#F28500] border-l-2 border-[#F28500] -ml-[2px]'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            active
              ? 'bg-[#F28500]/10 text-[#F28500]'
              : 'bg-[#006233]/10 text-[#006233]'
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
