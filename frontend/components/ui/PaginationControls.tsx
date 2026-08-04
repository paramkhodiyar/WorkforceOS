'use client';

import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 ${className}`}>
      {totalItems !== undefined && startItem !== null && endItem !== null ? (
        <p className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalItems}</span> results
        </p>
      ) : (
        <p className="text-xs text-slate-500 font-medium">
          Page <span className="font-semibold text-slate-700">{currentPage}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalPages}</span>
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Previous
        </button>

        {getPageNumbers().map((p, idx) => (
          <React.Fragment key={idx}>
            {typeof p === 'number' ? (
              <button
                onClick={() => onPageChange(p)}
                className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === p
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ) : (
              <span className="px-1 text-slate-400 text-xs font-semibold">...</span>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}
