import AppCard from '@/components/AppCard';

const apps = [
  {
    title: 'Tanzania Tax Calculator',
    description: 'PAYE, NSSF, SDL & WCF — monthly or annual breakdown for employees and employers.',
    href: '/tax-calculator',
    badge: '2025/2026',
    icon: '🧮',
  },
  {
    title: 'Receipt & Invoice Parser',
    description: 'Upload photos or PDFs of receipts and invoices. Extract vendor, date, line items and totals automatically. Export to Xero or QuickBooks CSV.',
    href: '/receipt-parser',
    badge: 'Beta',
    icon: '🧾',
  },
  {
    title: 'Payroll Manager',
    description: 'Bulk payroll calculations for multiple employees. Export to PDF or CSV.',
    href: '#',
    badge: 'Coming soon',
    icon: '👥',
  },
  {
    title: 'Corporate Tax Estimator',
    description: 'Estimate corporation tax liability based on net profit and applicable deductions.',
    href: '#',
    badge: 'Coming soon',
    icon: '🏢',
  },
];

export default function HomePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tax Tools</h1>
        <p className="text-sm text-gray-500 mt-1">Select a tool to get started.</p>
      </div>

      <div className="space-y-3">
        {apps.map((app) => (
          <AppCard key={app.href} {...app} />
        ))}
      </div>
    </main>
  );
}
