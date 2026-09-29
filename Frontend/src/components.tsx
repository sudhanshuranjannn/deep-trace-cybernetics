import { useEffect, useRef, type ReactNode } from 'react';
import { X, ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';

export function Brand() {
  return (
    <div className="brand dt-brand">
      <img src="/deeptrace-mark.svg" alt="Deep Trace" className="brand-logo-img" />
      <div className="brand-text-wrap">
        <span className="brand-title">DEEP TRACE</span>
        <span className="brand-subtitle">CYBERNETICS</span>
      </div>
    </div>
  );
}

export function Badge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  return (
    <span className={`badge badge-${normalized}`}>
      <span className="badge-dot" />
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export function Loading() {
  return (
    <div className="empty-state">
      <Loader2 className="spin" size={22} />
      <span>Loading workspace…</span>
    </div>
  );
}

export function Empty({ text = 'No records found. Try adjusting your filters.' }: { text?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon-box">
        <Search size={20} />
      </div>
      <span>{text}</span>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return message ? (
    <div className="error-box" role="alert">
      <span>{message}</span>
    </div>
  ) : null;
}

export function date(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function time(value: string) {
  return new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function Pagination({ page, total, size = 10, onChange }: { page: number; total: number; size?: number; onChange: (page: number) => void }) {
  const maxPage = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pagination">
      <span className="pagination-info">
        {total ? (page - 1) * size + 1 : 0}–{Math.min(page * size, total)} of {total} records
      </span>
      <div className="pagination-controls">
        <button
          className="btn-icon bordered"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="page-indicator">
          Page {page} of {maxPage}
        </span>
        <button
          className="btn-icon bordered"
          aria-label="Next page"
          disabled={page * size >= total}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button type="button" className="btn-icon" aria-label="Close dialog" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="modal-content-wrap">{children}</div>
    </dialog>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search records…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="search-box">
      <Search size={16} className="search-icon" />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
