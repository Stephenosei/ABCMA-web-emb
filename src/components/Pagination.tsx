import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  itemName?: string;
  className?: string;
  darkTheme?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemName = 'items',
  className = '',
  darkTheme = false,
}) => {
  if (totalPages <= 1 && totalItems === 0) return null;

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-xs ${
        darkTheme ? 'border-t border-slate-800 text-slate-400' : 'border-t border-slate-200/80 text-slate-500'
      } ${className}`}
    >
      {/* Items count summary */}
      <div className="font-medium order-2 sm:order-1">
        Showing <span className={`font-semibold font-mono tabular-nums ${darkTheme ? 'text-slate-200' : 'text-slate-800'}`}>{startIndex}</span> to{' '}
        <span className={`font-semibold font-mono tabular-nums ${darkTheme ? 'text-slate-200' : 'text-slate-800'}`}>{endIndex}</span> of{' '}
        <span className={`font-semibold font-mono tabular-nums ${darkTheme ? 'text-emerald-400' : 'text-slate-900'}`}>{totalItems}</span> {itemName}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 order-1 sm:order-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
              currentPage === 1
                ? darkTheme
                  ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                : darkTheme
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white shadow-sm'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shadow-sm'
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Previous</span>
          </button>

          {/* Page Number Pills */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className={`px-2 py-1 font-mono ${darkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    …
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                    isActive
                      ? darkTheme
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-emerald-800 text-white shadow-sm'
                      : darkTheme
                        ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
              currentPage === totalPages
                ? darkTheme
                  ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                : darkTheme
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white shadow-sm'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shadow-sm'
            }`}
            aria-label="Next page"
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
