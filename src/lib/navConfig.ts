export interface NavTool {
  title: string;
  shortTitle: string;
  description: string;
  href: string;
  badge?: string;
  icon: string;
  disabled?: boolean;
}

export interface TaxGuideTopic {
  id: string;
  title: string;
  icon?: string;
}

export const NAV_TOOLS: NavTool[] = [
  {
    title: 'Tanzania Tax Calculator',
    shortTitle: 'Tax Calculator',
    description:
      'PAYE, NSSF, SDL & WCF — monthly or annual breakdown for employees and employers.',
    href: '/tax-calculator',
    badge: '2025/2026',
    icon: '🧮',
  },
  {
    title: 'Receipt & Invoice Parser',
    shortTitle: 'Receipt Parser',
    description:
      'Upload photos or PDFs of receipts and invoices. Extract vendor, date, line items and totals automatically. Export to Xero or QuickBooks CSV.',
    href: '/receipt-parser',
    badge: 'Beta',
    icon: '🧾',
  },
  {
    title: 'Master Tax Guide',
    shortTitle: 'Tax Guide',
    description:
      'Comprehensive reference for Tanzania tax types, rates, filing deadlines and compliance requirements.',
    href: '/tax-guide',
    badge: 'New',
    icon: '📖',
  },
  {
    title: 'Payroll Manager',
    shortTitle: 'Payroll Manager',
    description:
      'Bulk payroll calculations for multiple employees. Export to PDF or CSV.',
    href: '#',
    badge: 'Coming soon',
    icon: '👥',
    disabled: true,
  },
  {
    title: 'Corporate Tax Estimator',
    shortTitle: 'Corporate Tax',
    description:
      'Estimate corporation tax liability based on net profit and applicable deductions.',
    href: '#',
    badge: 'Coming soon',
    icon: '🏢',
    disabled: true,
  },
];

/** Fallback tax guide topics used when the Notion API is unavailable */
export const FALLBACK_GUIDE_TOPICS: TaxGuideTopic[] = [];
