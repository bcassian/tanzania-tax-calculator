import type { Metadata } from 'next';
import TaxCalculator from '@/components/TaxCalculator';

export const metadata: Metadata = {
  title: 'Tanzania Tax Calculator — PAYE, NSSF, SDL & WCF',
  description: 'Calculate PAYE income tax, NSSF, SDL and WCF for Tanzania employment — 2025/2026 TRA rates.',
};

export default function TaxCalculatorPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Tanzania Employment Tax Calculator</h1>
        <p className="text-sm text-gray-500 mt-0.5">PAYE, NSSF, SDL &amp; WCF — 2025/2026</p>
      </div>
      <TaxCalculator />
    </main>
  );
}
