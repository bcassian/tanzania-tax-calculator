'use client';

import { useRef, useState } from 'react';

interface Props {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.pdf';

export default function ReceiptUploader({ onFilesSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (valid.length > 0) onFilesSelected(valid);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer select-none
        ${dragging ? 'border-[#F28500] bg-orange-50' : 'border-gray-200 bg-white hover:border-[#F28500] hover:bg-orange-50/40'}
        ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
          📎
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">
            Drop receipts &amp; invoices here
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            or click to browse — JPG, PNG, WEBP, PDF
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-[#F28500]/10 text-[#F28500] font-medium">
          Multiple files supported
        </span>
      </div>
    </div>
  );
}
