import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  variant?: "dark" | "light";
}

export default function Pagination({ currentPage, totalPages, onPageChange, variant = "dark" }: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  const isLight = variant === "light";

  const btnBase = isLight
    ? "bg-white text-gray-500 border border-gray-200 hover:text-gray-800 hover:border-gray-300 shadow-sm"
    : "border-gold-400/30 bg-ink-800 text-gold-200/60 hover:text-gold-200 hover:border-gold-400/60";

  const btnActive = isLight
    ? "bg-gray-800 text-white border border-gray-800 shadow-md"
    : "border-cinnabar-300 bg-cinnabar-300 text-rice-50";

  const fontClass = isLight ? "font-medium" : "font-song";

  return (
    <div className="flex justify-center items-center gap-2">
      <button
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${btnBase}`}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={14} />
      </button>

      <div className="flex items-center gap-2">
        {pages.map((page) => (
          <button
            key={page}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all duration-200 ${fontClass} ${
              page === currentPage ? btnActive : btnBase
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        {totalPages > 5 && (
          <>
            <span className={`px-1 ${isLight ? "text-gray-300" : "text-gold-400/30"}`}>···</span>
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all duration-200 ${fontClass} ${
                totalPages === currentPage ? btnActive : btnBase
              }`}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${btnBase}`}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
