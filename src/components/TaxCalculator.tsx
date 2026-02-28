'use client';

import { useState } from 'react';
import {
  calculate,
  fmt,
  type Residency,
  type Sector,
  type NSSFSplit,
  type Period,
} from '@/lib/taxCalc';

export default function TaxCalculator() {
  const [grossInput, setGrossInput] = useState('');
  const [residency, setResidency] = useState<Residency>('resident');
  const [sector, setSector] = useState<Sector>('private');
  const [nssfSplit, setNssfSplit] = useState<NSSFSplit>('10-10');
  const [period, setPeriod] = useState<Period>('monthly');

  const gross = parseFloat(grossInput);
  const hasResult = gross > 0;
  const result = hasResult ? calculate(gross, residency, nssfSplit) : null;
  const m = period === 'annual' ? 12 : 1;
  const periodLabel = period === 'annual' ? '/yr' : '/mo';

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {/* Input card */}
      <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6" id="inputCard">
        <h2 className="text-base font-semibold text-[#006233] mb-4 flex items-center gap-2">
          <span>📋</span> Enter Salary Details
        </h2>

        {/* Gross salary */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-500 mb-1.5">
            Gross Monthly Salary (TZS)
          </label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 1500000"
            min={0}
            step={1000}
            value={grossInput}
            onChange={(e) => setGrossInput(e.target.value)}
            className="w-full px-3 py-3 border-[1.5px] border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#006233] focus:ring-2 focus:ring-[#006233]/10 transition-colors"
          />
        </div>

        {/* Residency + Sector toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">Residency Status</label>
            <div className="flex border-[1.5px] border-gray-200 rounded-lg overflow-hidden">
              {(['resident', 'non-resident'] as Residency[]).map((val) => (
                <button
                  key={val}
                  onClick={() => setResidency(val)}
                  className={`flex-1 min-h-[44px] text-sm font-medium transition-colors ${
                    residency === val
                      ? 'bg-[#006233] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {val === 'resident' ? 'Resident' : 'Non-Resident'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">Sector</label>
            <div className="flex border-[1.5px] border-gray-200 rounded-lg overflow-hidden">
              {(['private', 'public'] as Sector[]).map((val) => (
                <button
                  key={val}
                  onClick={() => setSector(val)}
                  className={`flex-1 min-h-[44px] text-sm font-medium transition-colors ${
                    sector === val
                      ? 'bg-[#006233] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NSSF Split + Period selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">NSSF Split</label>
            <select
              value={nssfSplit}
              onChange={(e) => setNssfSplit(e.target.value as NSSFSplit)}
              className="w-full px-3 py-3 border-[1.5px] border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#006233] focus:ring-2 focus:ring-[#006233]/10 bg-white transition-colors"
            >
              <option value="10-10">10% Employee / 10% Employer</option>
              <option value="5-15">5% Employee / 15% Employer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">View Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="w-full px-3 py-3 border-[1.5px] border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#006233] focus:ring-2 focus:ring-[#006233]/10 bg-white transition-colors"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results card */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6" id="resultsCard">
          <h2 className="text-base font-semibold text-[#006233] mb-4 flex items-center gap-2">
            <span>📊</span> Tax Breakdown
          </h2>

          {/* Print-only summary */}
          <div className="hidden print:block text-xs text-gray-500 border-b border-gray-200 pb-3 mb-3 leading-relaxed">
            Gross: TZS {fmt(gross)}/mo &nbsp;·&nbsp;
            {residency === 'resident' ? 'Resident' : 'Non-Resident'}, {sector === 'private' ? 'Private' : 'Public'} Sector &nbsp;·&nbsp;
            NSSF: {nssfSplit === '10-10' ? '10% / 10%' : '5% / 15%'} &nbsp;·&nbsp;
            View: {period === 'annual' ? 'Annual' : 'Monthly'}
          </div>

          <table className="w-full">
            <tbody>
              {/* Employee section */}
              <tr>
                <td colSpan={2} className="pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[#006233]">
                  Employee Deductions
                </td>
              </tr>
              <ResultRow label="Gross Salary" value={`TZS ${fmt(gross * m)}${periodLabel}`} />
              <ResultRow
                label={`NSSF (${result.employeeNSSFRate * 100}%)`}
                value={`− TZS ${fmt(result.employeeNSSF * m)}${periodLabel}`}
              />
              <ResultRow label="Taxable Income" value={`TZS ${fmt(result.taxableIncome * m)}${periodLabel}`} />
              <ResultRow
                label="PAYE (Income Tax)"
                value={`− TZS ${fmt(result.paye * m)}${periodLabel}`}
              />
              <tr className="border-t-2 border-gray-200">
                <td className="pt-3 pb-1 text-sm font-bold text-[#006233]">Net Take-Home Pay</td>
                <td className="pt-3 pb-1 text-sm font-bold text-[#006233] text-right tabular-nums">
                  TZS {fmt(result.netSalary * m)}{periodLabel}
                </td>
              </tr>

              {/* Employer section */}
              <tr>
                <td colSpan={2} className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Employer Costs (on top of gross)
                </td>
              </tr>
              <ResultRow
                label={`NSSF Employer (${result.employerNSSFRate * 100}%)`}
                value={`TZS ${fmt(result.employerNSSF * m)}${periodLabel}`}
              />
              <ResultRow label="SDL (3.5%)" value={`TZS ${fmt(result.sdl * m)}${periodLabel}`} />
              <ResultRow label="WCF (0.5%)" value={`TZS ${fmt(result.wcf * m)}${periodLabel}`} />
              <tr className="border-t-2 border-gray-200">
                <td className="pt-3 pb-1 text-sm font-semibold text-amber-700">Total Cost to Employer</td>
                <td className="pt-3 pb-1 text-sm font-semibold text-amber-700 text-right tabular-nums">
                  TZS {fmt(result.totalEmployerCost * m)}{periodLabel}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bracket info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Effective PAYE rate:</strong> {result.effectiveRate}% of gross salary.{' '}
            Highest bracket applied: <strong className="text-gray-700">{result.bracket}</strong>.
          </div>
        </div>
      )}

      {/* Download button */}
      {result && (
        <div className="text-center print:hidden" id="downloadWrap">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-[#006233] hover:opacity-85 text-white font-semibold px-6 py-3 rounded-lg transition-opacity text-base"
          >
            ⬇ Download as PDF
          </button>
        </div>
      )}

      {/* Tax brackets reference */}
      <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#006233] mb-4 flex items-center gap-2">
          <span>📘</span> PAYE Tax Brackets (Monthly, Resident)
        </h2>
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            {[
              ['Up to TZS 270,000', '0%'],
              ['270,001 – 520,000', '9%'],
              ['520,001 – 760,000', '20%'],
              ['760,001 – 1,000,000', '25%'],
              ['Above 1,000,000', '30%'],
            ].map(([range, rate]) => (
              <tr key={range}>
                <td className="py-2 text-sm text-gray-500">{range}</td>
                <td className="py-2 text-sm font-medium text-right text-gray-700">{rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="py-2 text-sm text-gray-500">{label}</td>
      <td className="py-2 text-sm font-medium text-right tabular-nums text-gray-800">{value}</td>
    </tr>
  );
}
