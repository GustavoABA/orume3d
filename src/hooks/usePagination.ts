import { useCallback, useMemo, useState } from 'react';

export const usePagination = <T,>(items: T[], pageSize: number) => {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(items.length / pageSize)), [items.length, pageSize]);

  const paginatedItems = useMemo(() => items.slice(0, page * pageSize), [items, page, pageSize]);

  const hasMore = useMemo(() => page < totalPages, [page, totalPages]);

  const loadMore = useCallback(() => {
    setPage((prev) => (prev < totalPages ? prev + 1 : prev));
  }, [totalPages]);

  const reset = useCallback(() => setPage(1), []);

  return { page, setPage, totalPages, items: paginatedItems, hasMore, loadMore, reset };
};
