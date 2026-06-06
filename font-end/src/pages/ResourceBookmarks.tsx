import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageHeading from '../components/heading';
import {
  BookmarksService,
  BookmarkResourceRecord,
  BOOKMARKS_STORAGE_KEY,
} from '../services/BookmarksService';
import { ResourceService } from '../services/ResourceService';
import { DownloadHistoryService } from '../services/DownloadHistoryService';
import {
  FaSearch,
  FaDownload,
  FaFile,
  FaTimes,
  FaFileExport,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaBookmark,
  FaBoxOpen,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaTrash,
  FaStickyNote,
  FaEdit,
} from 'react-icons/fa';

type SortField = 'name' | 'version' | 'bookmarked_at' | 'note';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';
type DateRangeFilter = 'all' | '7d' | '30d';

const ResourceBookmarks: React.FC = () => {
  const location = useLocation();
  const isMyBookmarksRoute = location.pathname === '/my-bookmarks';

  const [bookmarks, setBookmarks] = useState<BookmarkResourceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('bookmarked_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [noteOnly, setNoteOnly] = useState(false);
  const [noteEdit, setNoteEdit] = useState<BookmarkResourceRecord | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const loadBookmarks = () => setBookmarks(BookmarksService.getBookmarks());

  useEffect(() => {
    loadBookmarks();
  }, []);

  useEffect(() => {
    const refresh = () => loadBookmarks();
    const onStorage = (e: StorageEvent) => {
      if (e.key === BOOKMARKS_STORAGE_KEY || e.key === null) refresh();
    };
    window.addEventListener('storage', onStorage);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = [...bookmarks];

    if (dateRange !== 'all') {
      const now = Date.now();
      const cutoff =
        dateRange === '7d' ? now - 7 * 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((r) => new Date(r.bookmarked_at).getTime() >= cutoff);
    }

    if (noteOnly) {
      list = list.filter((r) => r.note && r.note.trim().length > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.version.toLowerCase().includes(q) ||
          (r.url && r.url.toLowerCase().includes(q)) ||
          (r.note && r.note.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'version':
          aVal = a.version.toLowerCase();
          bVal = b.version.toLowerCase();
          break;
        case 'note':
          aVal = (a.note || '').toLowerCase();
          bVal = (b.note || '').toLowerCase();
          break;
        case 'bookmarked_at':
          aVal = new Date(a.bookmarked_at).getTime();
          bVal = new Date(b.bookmarked_at).getTime();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [bookmarks, searchQuery, dateRange, noteOnly, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    return {
      total: bookmarks.length,
      withNotes: bookmarks.filter((r) => r.note && r.note.trim()).length,
      thisWeek: bookmarks.filter((r) => new Date(r.bookmarked_at).getTime() >= weekAgo).length,
      thisMonth: bookmarks.filter((r) => new Date(r.bookmarked_at).getTime() >= monthAgo).length,
      filtered: filteredAndSorted.length,
    };
  }, [bookmarks, filteredAndSorted]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort className="w-3 h-3 text-gray-400" />;
    return sortDirection === 'asc' ? (
      <FaSortUp className="w-3 h-3 text-amber-600" />
    ) : (
      <FaSortDown className="w-3 h-3 text-amber-600" />
    );
  };

  const handleDownload = async (id: string) => {
    const item = bookmarks.find((r) => r.id === id);
    const filename =
      (item?.url && item.url.split('/').pop()) ||
      (item?.name ? `${item.name}.bin` : undefined);
    await ResourceService.downloadResource(id, filename);
    if (item) {
      DownloadHistoryService.addToHistory({
        id: item.id,
        name: item.name,
        version: item.version,
        url: item.url,
      });
    }
  };

  const handleRemove = (id: string) => {
    BookmarksService.removeBookmark(id);
    setRemoveConfirm(null);
    loadBookmarks();
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await ResourceService.deleteResource(id);
      BookmarksService.removeBookmark(id);
      setDeleteConfirm(null);
      loadBookmarks();
    } catch (err) {
      console.error('Delete resource failed:', err);
      setDeleteConfirm(null);
    }
  };

  const handleClearAll = () => {
    BookmarksService.clearBookmarks();
    setClearConfirm(false);
    loadBookmarks();
  };

  const openNoteEdit = (item: BookmarkResourceRecord) => {
    setNoteEdit(item);
    setNoteDraft(item.note || '');
  };

  const saveNote = () => {
    if (!noteEdit) return;
    BookmarksService.updateNote(noteEdit.id, noteDraft);
    setNoteEdit(null);
    setNoteDraft('');
    loadBookmarks();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Tên', 'Phiên bản', 'Ghi chú', 'URL', 'Ngày đánh dấu'];
    const rows = filteredAndSorted.map((r) => [
      r.id,
      r.name,
      r.version,
      r.note || '',
      r.url || '',
      formatDate(r.bookmarked_at),
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bookmarks_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDateRange('all');
    setNoteOnly(false);
    setCurrentPage(1);
  };

  const breadcrumb = useMemo(
    () =>
      isMyBookmarksRoute
        ? { title: 'Bookmark của tôi', route: '/my-bookmarks' }
        : { title: 'Tài nguyên đã bookmark', route: '/resources/bookmarks' },
    [isMyBookmarksRoute]
  );

  const pageTitle = isMyBookmarksRoute ? 'Bookmark của tôi' : 'Tài nguyên đã bookmark';
  const pageDescription = isMyBookmarksRoute
    ? 'Danh sách tài nguyên bạn đã đánh dấu bookmark (lưu cục bộ trên trình duyệt). Có thể thêm ghi chú để nhớ nhanh mục đích sử dụng.'
    : 'Các tài nguyên đã bookmark để truy cập và ghi chú nhanh sau này';

  const ActionButtons = ({ item }: { item: BookmarkResourceRecord }) => (
    <div className="flex items-center gap-2">
      <Link
        to={`/resources/${item.id}`}
        className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
        title="Chi tiết"
      >
        <FaExternalLinkAlt className="w-4 h-4" />
      </Link>
      <button
        type="button"
        onClick={() => openNoteEdit(item)}
        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg dark:hover:bg-amber-950/40"
        title="Ghi chú"
      >
        <FaStickyNote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDownload(item.id)}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
        title="Tải xuống"
      >
        <FaDownload className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setRemoveConfirm(item.id)}
        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
        title="Bỏ bookmark"
      >
        <FaBookmark className="w-4 h-4 fill-current" />
      </button>
      <button
        type="button"
        onClick={() => setDeleteConfirm(item.id)}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
        title="Xóa tài nguyên"
      >
        <FaTrash className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 rounded-2xl border border-gray-200/90 bg-gradient-to-br from-white via-amber-50/30 to-white shadow-sm dark:border-slate-700/80 dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-950">
          <div className="p-6 sm:p-7">
            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
                    {pageTitle}
                  </h2>
                  {isMyBookmarksRoute && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-400/25">
                      Lưu cục bộ
                    </span>
                  )}
                </div>
                <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {pageDescription}
                </p>
              </div>

              <div className="flex flex-col gap-4 border-t border-gray-200/70 pt-5 dark:border-slate-700/70 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-500">
                  <span className="tabular-nums text-gray-800 dark:text-slate-300">{bookmarks.length}</span>{' '}
                  bookmark
                  {stats.withNotes > 0 && (
                    <>
                      {' '}
                      · <span className="tabular-nums">{stats.withNotes}</span> có ghi chú
                    </>
                  )}
                  {filteredAndSorted.length !== bookmarks.length && (
                    <>
                      {' '}
                      · <span className="tabular-nums">{filteredAndSorted.length}</span> sau lọc
                    </>
                  )}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex flex-wrap items-stretch gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={exportToCSV}
                      disabled={filteredAndSorted.length === 0}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaFileExport className="h-4 w-4" />
                      Xuất CSV
                    </button>
                    <Link
                      to="/resources"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <FaBoxOpen className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                      Danh sách tài nguyên
                    </Link>
                  </div>

                  {bookmarks.length > 0 && (
                    <div className="flex items-center justify-end sm:border-l sm:border-gray-200 sm:pl-3 dark:sm:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setClearConfirm(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70 sm:w-auto"
                      >
                        <FaTrash className="h-4 w-4" />
                        Xóa tất cả bookmark
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">Tổng bookmark</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{stats.total}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg dark:bg-amber-950/50">
                <FaBookmark className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">Có ghi chú</p>
                <p className="text-2xl font-semibold text-amber-700">{stats.withNotes}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <FaStickyNote className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">Tuần này</p>
                <p className="text-2xl font-semibold text-green-600">{stats.thisWeek}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCalendarAlt className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">Kết quả lọc</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{stats.filtered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex flex-col md:flex-row gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm theo tên, phiên bản, ghi chú..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as DateRangeFilter);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
            </select>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer dark:border-slate-600 dark:bg-slate-950">
              <input
                type="checkbox"
                checked={noteOnly}
                onChange={(e) => {
                  setNoteOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-gray-700 dark:text-slate-300">Chỉ có ghi chú</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'table' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bảng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'grid' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lưới
              </button>
            </div>
            {(searchQuery || dateRange !== 'all' || noteOnly) && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-2"
              >
                <FaTimes className="w-3 h-3" />
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 dark:bg-slate-900/40">
          {filteredAndSorted.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <FaBookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-slate-100">
                Chưa có bookmark nào
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto dark:text-slate-400">
                Đánh dấu bookmark từ trang Tài nguyên của tôi (icon bookmark) để lưu lại và thêm ghi chú tại đây.
              </p>
              <Link
                to="/resources"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
              >
                <FaExternalLinkAlt className="w-4 h-4" />
                Đi đến Tài nguyên của tôi
              </Link>
            </div>
          ) : viewMode === 'table' ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <button onClick={() => handleSort('name')} className="flex items-center gap-2 hover:text-amber-600">
                          Tên {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <button onClick={() => handleSort('version')} className="flex items-center gap-2 hover:text-amber-600">
                          Phiên bản {getSortIcon('version')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[180px]">
                        <button onClick={() => handleSort('note')} className="flex items-center gap-2 hover:text-amber-600">
                          Ghi chú {getSortIcon('note')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <button onClick={() => handleSort('bookmarked_at')} className="flex items-center gap-2 hover:text-amber-600">
                          Ngày đánh dấu {getSortIcon('bookmarked_at')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {paginated.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaFile className="w-4 h-4 text-gray-400 shrink-0" />
                            <div className="min-w-0">
                              <Link
                                to={`/resources/${r.id}`}
                                className="text-sm font-medium text-gray-900 hover:text-amber-600 hover:underline dark:text-slate-100"
                              >
                                {r.name}
                              </Link>
                              {r.url && (
                                <p className="text-xs text-gray-500 truncate max-w-xs">{r.url}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded text-xs font-medium dark:bg-amber-950/50 dark:text-amber-200">
                            {r.version}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {r.note ? (
                            <button
                              type="button"
                              onClick={() => openNoteEdit(r)}
                              className="text-left text-sm text-gray-700 hover:text-amber-700 line-clamp-2 max-w-xs dark:text-slate-300"
                              title="Sửa ghi chú"
                            >
                              {r.note}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openNoteEdit(r)}
                              className="text-xs text-amber-600 hover:underline inline-flex items-center gap-1"
                            >
                              <FaEdit className="w-3 h-3" />
                              Thêm ghi chú
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap dark:text-slate-400">
                          {formatDate(r.bookmarked_at)}
                        </td>
                        <td className="px-6 py-4">
                          <ActionButtons item={r} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  total={filteredAndSorted.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(n) => {
                    setItemsPerPage(n);
                    setCurrentPage(1);
                  }}
                />
              )}
            </>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((r) => (
                <div
                  key={r.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow dark:border-slate-700"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <FaFile className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/resources/${r.id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-amber-600 line-clamp-2 dark:text-slate-100"
                      >
                        {r.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">{r.version}</p>
                    </div>
                  </div>
                  {r.note ? (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-3 dark:text-slate-400">{r.note}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic mb-3">Chưa có ghi chú</p>
                  )}
                  <p className="text-xs text-gray-500 mb-4">{formatDate(r.bookmarked_at)}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(r.id)}
                      className="flex-1 min-w-[100px] px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <FaDownload className="w-3 h-3" />
                      Tải
                    </button>
                    <button
                      type="button"
                      onClick={() => openNoteEdit(r)}
                      className="px-3 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 text-xs"
                      title="Ghi chú"
                    >
                      <FaStickyNote className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveConfirm(r.id)}
                      className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-xs"
                      title="Bỏ bookmark"
                    >
                      <FaBookmark className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="col-span-full">
                  <PaginationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    total={filteredAndSorted.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(n) => {
                      setItemsPerPage(n);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {noteEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 dark:text-slate-100">Ghi chú bookmark</h3>
              <p className="text-sm text-gray-500 mb-4 truncate dark:text-slate-400">{noteEdit.name}</p>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={4}
                placeholder="Ví dụ: Cần tải cho dự án X, phiên bản ổn định…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-y dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{noteDraft.length}/500</p>
              <div className="flex gap-2 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setNoteEdit(null);
                    setNoteDraft('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={saveNote}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                >
                  Lưu ghi chú
                </button>
              </div>
            </div>
          </div>
        )}

        {removeConfirm && (
          <ConfirmModal
            title="Bỏ bookmark"
            message="Bạn có chắc muốn bỏ mục này khỏi danh sách bookmark?"
            confirmLabel="Bỏ bookmark"
            onCancel={() => setRemoveConfirm(null)}
            onConfirm={() => handleRemove(removeConfirm)}
          />
        )}

        {deleteConfirm && (
          <ConfirmModal
            title="Xóa tài nguyên"
            message="Tài nguyên sẽ bị xóa khỏi hệ thống và khỏi bookmark. Bạn có chắc chắn?"
            confirmLabel="Xóa tài nguyên"
            onCancel={() => setDeleteConfirm(null)}
            onConfirm={() => handleDeleteResource(deleteConfirm)}
          />
        )}

        {clearConfirm && (
          <ConfirmModal
            title="Xóa tất cả bookmark"
            message="Toàn bộ bookmark sẽ bị xóa khỏi trình duyệt (không xóa tài nguyên trên máy chủ)."
            confirmLabel="Xóa tất cả"
            onCancel={() => setClearConfirm(false)}
            onConfirm={handleClearAll}
          />
        )}
      </div>
    </>
  );
};

function PaginationBar({
  currentPage,
  totalPages,
  itemsPerPage,
  total,
  onPageChange,
  onItemsPerPageChange,
}: {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  total: number;
  onPageChange: (p: number) => void;
  onItemsPerPageChange: (n: number) => void;
}) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-slate-300">Hiển thị:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-950"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-gray-700 dark:text-slate-300">/ Tổng {total}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:border-slate-600"
        >
          Trước
        </button>
        <span className="text-sm text-gray-700 dark:text-slate-300">
          Trang {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:border-slate-600"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full dark:bg-slate-900 dark:border dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 dark:text-slate-400">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResourceBookmarks;
