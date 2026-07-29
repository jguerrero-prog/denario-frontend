import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import { parseCsv } from '../../utils/csv';
import styles from './DataTableViewer.module.css';

// ROADMAP.md ticket 4.4 — browsable sortable/filterable table for a CSV
// promoted by 4.1 to input_files/analysis_data/. Same modal-overlay pattern
// as PlotLightbox (portal to document.body, Escape-to-close, body scroll
// lock) — the two are siblings in the artifact viewer, opened the same way.

export interface DataTableViewerProps {
  fileName: string;
  backendProjectId: string;
  onClose: () => void;
}

type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 25;

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 4l10 10M14 4L4 14" />
    </svg>
  );
}

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (!dir) return <span className={styles.sortIcon}>↕</span>;
  return <span className={styles.sortIconActive}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

// Numeric-aware compare — real generated CSVs are mostly numeric data
// (correlation matrices, model coefficients); sorting "10" before "9" as
// strings would be a visibly wrong table for the common case.
function compareValues(a: string, b: string): number {
  const numA = Number(a);
  const numB = Number(b);
  if (a !== '' && b !== '' && !Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }
  return a.localeCompare(b);
}

export function DataTableViewer({ fileName, backendProjectId, onClose }: DataTableViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(api.fileUrl(backendProjectId, `input_files/analysis_data/${fileName}`))
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.text();
      })
      .then(text => {
        if (cancelled) return;
        const parsed = parseCsv(text);
        setColumns(parsed.columns);
        setRows(parsed.rows);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this data file.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [backendProjectId, fileName]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const filteredRows = useMemo(() => {
    if (!filter.trim()) return rows;
    const needle = filter.trim().toLowerCase();
    return rows.filter(row => row.some(cell => cell.toLowerCase().includes(needle)));
  }, [rows, filter]);

  const sortedRows = useMemo(() => {
    if (sortCol === null) return filteredRows;
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const cmp = compareValues(a[sortCol] ?? '', b[sortCol] ?? '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filteredRows, sortCol, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = sortedRows.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE);

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colIdx);
      setSortDir('asc');
    }
    setPage(0);
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.fileName}>{fileName}</span>
          <div className={styles.headerRight}>
            {!loading && !error && (
              <span className={styles.rowCount}>
                {sortedRows.length} row{sortedRows.length === 1 ? '' : 's'}
                {filter.trim() && ` (of ${rows.length})`}
              </span>
            )}
            <button className={styles.closeBtn} aria-label="Close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>

        {!loading && !error && (
          <input
            className={styles.filterInput}
            placeholder="Filter rows…"
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(0); }}
          />
        )}

        <div className={styles.tableScroll}>
          {loading ? (
            <p className={styles.status}>Loading…</p>
          ) : error ? (
            <p className={styles.status}>{error}</p>
          ) : rows.length === 0 ? (
            <p className={styles.status}>This file is empty.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.map((col, i) => (
                    <th key={i} onClick={() => handleSort(i)} className={styles.th}>
                      <span className={styles.thContent}>
                        {col || <em>(index)</em>}
                        <SortIcon dir={sortCol === i ? sortDir : null} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => <td key={ci} className={styles.td}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && pageCount > 1 && (
          <div className={styles.pager}>
            <button
              className={styles.pagerBtn}
              disabled={clampedPage === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              ← Prev
            </button>
            <span className={styles.pagerLabel}>Page {clampedPage + 1} of {pageCount}</span>
            <button
              className={styles.pagerBtn}
              disabled={clampedPage >= pageCount - 1}
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
