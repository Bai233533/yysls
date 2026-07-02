import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div className="mt-12 flex justify-center items-center gap-3">
      <button
        className="w-9 h-9 flex items-center justify-center rounded-full border border-gold-400/30 bg-ink-800 text-gold-200/50 hover:text-gold-200 hover:border-gold-400/60 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-2">
        {pages.map((page) => (
          <button
            key={page}
            className={`w-9 h-9 flex items-center justify-center rounded-full border text-sm font-song transition-all duration-200 ${
              page === currentPage
                ? "border-cinnabar-300 bg-cinnabar-300 text-rice-50"
                : "border-gold-400/30 bg-ink-800 text-gold-200/60 hover:text-gold-200 hover:border-gold-400/60"
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        {totalPages > 5 && (
          <>
            <span className="px-1 text-gold-400/30">···</span>
            <button
              className={`w-9 h-9 flex items-center justify-center rounded-full border text-sm font-song transition-all duration-200 ${
                totalPages === currentPage
                  ? "border-cinnabar-300 bg-cinnabar-300 text-rice-50"
                  : "border-gold-400/30 bg-ink-800 text-gold-200/60 hover:text-gold-200 hover:border-gold-400/60"
              }`}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        className="w-9 h-9 flex items-center justify-center rounded-full border border-gold-400/30 bg-ink-800 text-gold-200/50 hover:text-gold-200 hover:border-gold-400/60 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
