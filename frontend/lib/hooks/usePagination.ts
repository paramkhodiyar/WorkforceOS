'use client';

import { useState, useCallback, useRef } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string;
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string;
  setPage: (p: number) => void;
  setSearch: (s: string) => void;
  setTotal: (t: number, totalPages?: number) => void;
  reset: () => void;
  searchDebounced: (s: string, onSearch: (s: string) => void) => void;
}

export function usePagination(defaultLimit = 10): UsePaginationReturn {
  const [page, setPageState] = useState(1);
  const [limit] = useState(defaultLimit);
  const [total, setTotalState] = useState(0);
  const [totalPages, setTotalPagesState] = useState(0);
  const [search, setSearchState] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPage = useCallback((p: number) => setPageState(p), []);

  const setSearch = useCallback((s: string) => {
    setSearchState(s);
    setPageState(1);
  }, []);

  const setTotal = useCallback((t: number, tp?: number) => {
    setTotalState(t);
    setTotalPagesState(tp ?? Math.max(1, Math.ceil(t / limit)));
  }, [limit]);

  const reset = useCallback(() => {
    setPageState(1);
    setSearchState('');
    setTotalState(0);
    setTotalPagesState(0);
  }, []);

  const searchDebounced = useCallback((s: string, onSearch: (s: string) => void) => {
    setSearch(s);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(s), 300);
  }, [setSearch]);

  return { page, limit, total, totalPages, search, setPage, setSearch, setTotal, reset, searchDebounced };
}
