'use client';

import { useState } from 'react';
import type { Bill, ExportFormat, ExportFileType } from '@/types/bill';
import BillCard from '@/components/BillCard';
import { exportBills } from '@/lib/exportUtils';

interface Props {
  bills: Bill[];
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
  onDeleteSelected: (ids: string[]) => void;
}

export default function BillsList({ bills, onEdit, onDelete, onDeleteSelected }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xero');
  const [exportFileType, setExportFileType] = useState<ExportFileType>('csv');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const finishedBills = bills.filter((b) => b.status !== 'uploading' && b.status !== 'parsing');

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(finishedBills.map((b) => b.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const allSelected = finishedBills.length > 0 && selectedIds.size === finishedBills.length;

  function handleDeleteSelected() {
    const ids = Array.from(selectedIds);
    onDeleteSelected(ids);
    setSelectedIds(new Set());
  }

  async function handleExport() {
    const toExport = bills.filter((b) => selectedIds.has(b.id));
    if (toExport.length === 0) return;
    setExporting(true);
    try {
      await exportBills(toExport, exportFormat, exportFileType);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  }

  if (bills.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            {bills.length} bill{bills.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={allSelected ? clearSelection : selectAll}
            className="text-xs text-[#F28500] hover:text-[#d97400] font-medium transition-colors"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
            >
              Delete {selectedIds.size} selected
            </button>
          )}
        </div>

        {/* Export controls */}
        <div className="flex items-center gap-2 relative">
          {/* Format selector */}
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700
              focus:outline-none focus:border-[#F28500] focus:ring-2 focus:ring-[#F28500]/10"
          >
            <option value="xero">Xero</option>
            <option value="quickbooks">QuickBooks</option>
            <option value="generic">Generic</option>
          </select>

          {/* File type selector */}
          <select
            value={exportFileType}
            onChange={(e) => setExportFileType(e.target.value as ExportFileType)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700
              focus:outline-none focus:border-[#F28500] focus:ring-2 focus:ring-[#F28500]/10"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
          </select>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={selectedIds.size === 0 || exporting}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#F28500] text-white
              hover:bg-[#d97400] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting…' : `Export${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
          </button>
        </div>
      </div>

      {/* Bill cards */}
      <div className="space-y-2">
        {bills.map((bill) => (
          <BillCard
            key={bill.id}
            bill={bill}
            selected={selectedIds.has(bill.id)}
            onToggleSelect={() => toggleSelect(bill.id)}
            onEdit={() => onEdit(bill)}
            onDelete={() => onDelete(bill.id)}
          />
        ))}
      </div>
    </div>
  );
}
