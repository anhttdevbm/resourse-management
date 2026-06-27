import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageHeading from '../components/heading';
import { useI18n } from '../i18n/I18nProvider';
import {
  FavoritesService,
  FavoriteResourceRecord,
} from '../services/FavoritesService';
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
  FaHeart,
  FaBoxOpen,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaTrash,
} from 'react-icons/fa';

type SortField = 'name' | 'version' | 'added_at';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';
type DateRangeFilter = 'all' | '7d' | '30d';

const FAVORITES_STORAGE_KEY = 'resource_favorites';

const ResourceFavorites: React.FC = () => {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN';
  const location = useLocation();
  const isMyFavoritesRoute = location.pathname === '/my-favorites';

  const [favorites, setFavorites] = useState<FavoriteResourceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('added_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');

  const loadFavorites = () => setFavorites(FavoritesService.getFavorites());

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    const refresh = () => loadFavorites();
    const onStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_STORAGE_KEY || e.key === null) refresh();
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
    let list = [...favorites];

    if (dateRange !== 'all') {
      const now = Date.now();
      const cutoff =
        dateRange === '7d' ? now - 7 * 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((r) => new Date(r.added_at).getTime() >= cutoff);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.version.toLowerCase().includes(q) ||
          (r.url && r.url.toLowerCase().includes(q))
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
        case 'added_at':
          aVal = new Date(a.added_at).getTime();
          bVal = new Date(b.added_at).getTime();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [favorites, searchQuery, dateRange, sortField, sortDirection]);

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
      total: favorites.length,
      thisWeek: favorites.filter((r) => new Date(r.added_at).getTime() >= weekAgo).length,
      thisMonth: favorites.filter((r) => new Date(r.added_at).getTime() >= monthAgo).length,
      filtered: filteredAndSorted.length,
    };
  }, [favorites, filteredAndSorted]);

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
      <FaSortUp className="w-3 h-3 text-blue-600" />
    ) : (
      <FaSortDown className="w-3 h-3 text-blue-600" />
    );
  };

  const handleDownload = async (id: string) => {
    const fav = favorites.find((r) => r.id === id);
    const filename =
      (fav?.url && fav.url.split('/').pop()) ||
      (fav?.name ? `${fav.name}.bin` : undefined);
    await ResourceService.downloadResource(id, filename);
    if (fav) {
      DownloadHistoryService.addToHistory({
        id: fav.id,
        name: fav.name,
        version: fav.version,
        url: fav.url,
      });
    }
  };

  const handleRemove = (id: string) => {
    FavoritesService.removeFromFavorites(id);
    setRemoveConfirm(null);
    loadFavorites();
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await ResourceService.deleteResource(id);
      FavoritesService.removeFromFavorites(id);
      setDeleteConfirm(null);
      loadFavorites();
    } catch (err) {
      console.error('Delete resource failed:', err);
      setDeleteConfirm(null);
    }
  };

  const handleClearAll = () => {
    FavoritesService.clearFavorites();
    setClearConfirm(false);
    loadFavorites();
  };

  const formatDate = useCallback(
    (dateString: string) => {
      try {
        return new Date(dateString).toLocaleString(dateLocale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return 'N/A';
      }
    },
    [dateLocale]
  );

  const exportToCSV = () => {
    const headers = [
      'ID',
      t('favorites.col.name'),
      t('favorites.col.version'),
      'URL',
      t('favorites.csv.addedAt'),
    ];
    const rows = filteredAndSorted.map((r) => [
      r.id,
      r.name,
      r.version,
      r.url || '',
      formatDate(r.added_at),
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${t('favorites.csv.filename')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDateRange('all');
    setCurrentPage(1);
  };

  const breadcrumb = useMemo(
    () =>
      isMyFavoritesRoute
        ? { title: t('favorites.breadcrumbMyFavorites'), route: '/my-favorites' }
        : { title: t('favorites.breadcrumbFavorites'), route: '/resources/favorites' },
    [isMyFavoritesRoute, t]
  );

  const pageTitle = isMyFavoritesRoute
    ? t('favorites.pageTitleMyFavorites')
    : t('favorites.pageTitleFavorites');
  const pageDescription = isMyFavoritesRoute
    ? t('favorites.pageDescMyFavorites')
    : t('favorites.pageDescFavorites');

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8 rounded-2xl border border-gray-200/90 bg-gradient-to-br from-white via-slate-50/40 to-white shadow-sm dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950">
          <div className="p-6 sm:p-7">
            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
                    {pageTitle}
                  </h2>
                  {isMyFavoritesRoute && (
                    <span className="inline-flex items-center rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-pink-800 ring-1 ring-inset ring-pink-600/20 dark:bg-pink-950/40 dark:text-pink-200 dark:ring-pink-400/25">
                      {t('favorites.badgeLocal')}
                    </span>
                  )}
                </div>
                <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {pageDescription}
                </p>
              </div>

              <div className="flex flex-col gap-4 border-t border-gray-200/70 pt-5 dark:border-slate-700/70 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-500">
                  {t('favorites.count').replace('{count}', String(favorites.length))}
                  {filteredAndSorted.length !== favorites.length && (
                    <>
                      {' '}
                      {t('favorites.afterFilter').replace(
                        '{count}',
                        String(filteredAndSorted.length)
                      )}
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
                      {t('favorites.exportCsv')}
                    </button>
                    {isMyFavoritesRoute && (
                      <Link
                        to="/resources/favorites"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                      >
                        <FaExternalLinkAlt className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                        {t('favorites.linkFavorites')}
                      </Link>
                    )}
                    <Link
                      to="/resources"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <FaBoxOpen className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                      {t('favorites.linkResourceList')}
                    </Link>
                  </div>

                  {favorites.length > 0 && (
                    <div className="flex items-center justify-end sm:border-l sm:border-gray-200 sm:pl-3 dark:sm:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setClearConfirm(true)}
                        title={t('favorites.clearAllTitle')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70 sm:w-auto"
                      >
                        <FaTrash className="h-4 w-4" />
                        <span className="sm:hidden">{t('favorites.clearAllShort')}</span>
                        <span className="hidden sm:inline">{t('favorites.clearAllLong')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">{t('favorites.stats.total')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{stats.total}</p>
              </div>
              <div className="p-2 bg-pink-100 rounded-lg">
                <FaHeart className="w-5 h-5 text-pink-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">{t('favorites.stats.thisWeek')}</p>
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
                <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">{t('favorites.stats.thisMonth')}</p>
                <p className="text-2xl font-semibold text-purple-600">{stats.thisMonth}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaCalendarAlt className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">{t('favorites.stats.filtered')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{stats.filtered}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('favorites.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
              {searchQuery && (
                <button
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">{t('favorites.dateRange.all')}</option>
              <option value="7d">{t('favorites.dateRange.7d')}</option>
              <option value="30d">{t('favorites.dateRange.30d')}</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('favorites.viewTable')}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('favorites.viewGrid')}
              </button>
            </div>
            {(searchQuery || dateRange !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-slate-300 text-sm font-medium flex items-center gap-2"
              >
                <FaTimes className="w-3 h-3" />
                {t('favorites.resetFilters')}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 dark:bg-slate-900/40">
          {filteredAndSorted.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <FaHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('favorites.empty.title')}</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {t('favorites.empty.hint')}
              </p>
              <Link
                to="/resources"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <FaExternalLinkAlt className="w-4 h-4" />
                {t('favorites.empty.goResources')}
              </Link>
            </div>
          ) : viewMode === 'table' ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button onClick={() => handleSort('name')} className="flex items-center gap-2 hover:text-blue-600">
                          {t('favorites.col.name')}
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button onClick={() => handleSort('version')} className="flex items-center gap-2 hover:text-blue-600">
                          {t('favorites.col.version')}
                          {getSortIcon('version')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button onClick={() => handleSort('added_at')} className="flex items-center gap-2 hover:text-blue-600">
                          {t('favorites.col.addedAt')}
                          {getSortIcon('added_at')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('favorites.col.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginated.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaFile className="w-4 h-4 text-gray-400" />
                            <div>
                              <Link
                                to={`/resources/${r.id}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline dark:text-slate-100 dark:hover:text-blue-400"
                              >
                                {r.name}
                              </Link>
                              {r.url && <p className="text-xs text-gray-500 truncate max-w-xs">{r.url}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{r.version}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(r.added_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/resources/${r.id}`}
                              className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
                              title={t('favorites.action.detail')}
                            >
                              <FaExternalLinkAlt className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDownload(r.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title={t('favorites.action.download')}
                            >
                              <FaDownload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRemoveConfirm(r.id)}
                              className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg"
                              title={t('favorites.action.unfavorite')}
                            >
                              <FaHeart className="w-4 h-4 fill-current" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(r.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title={t('favorites.action.deleteResource')}
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{t('favorites.pagination.showing')}</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-700">
                      {t('favorites.pagination.totalCount').replace('{count}', String(filteredAndSorted.length))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {t('favorites.pagination.prev')}
                    </button>
                    <span className="text-sm text-gray-700">
                      {t('favorites.pagination.page')
                        .replace('{current}', String(currentPage))
                        .replace('{total}', String(totalPages))}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {t('favorites.pagination.next')}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((r) => (
                <div
                  key={r.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FaFile className="w-5 h-5 text-blue-600" />
                      <div className="min-w-0">
                        <Link
                          to={`/resources/${r.id}`}
                          className="text-sm font-semibold text-gray-900 truncate block hover:text-blue-600 hover:underline dark:text-slate-100"
                        >
                          {r.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{r.version}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{formatDate(r.added_at)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(r.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <FaDownload className="w-3 h-3" />
                      {t('favorites.grid.download')}
                    </button>
                    <button
                      onClick={() => setRemoveConfirm(r.id)}
                      className="px-3 py-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 text-xs"
                      title={t('favorites.action.unfavorite')}
                    >
                      <FaHeart className="w-3 h-3 fill-current" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(r.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-xs"
                      title={t('favorites.action.deleteResource')}
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="col-span-full mt-4 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg text-sm border border-gray-300 disabled:opacity-50"
                  >
                    {t('favorites.pagination.prev')}
                  </button>
                  <span className="text-sm text-gray-700">
                    {t('favorites.pagination.page')
                      .replace('{current}', String(currentPage))
                      .replace('{total}', String(totalPages))}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg text-sm border border-gray-300 disabled:opacity-50"
                  >
                    {t('favorites.pagination.next')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {removeConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('favorites.removeConfirm.title')}</h3>
              <p className="text-sm text-gray-600 mb-6">
                {t('favorites.removeConfirm.message')}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setRemoveConfirm(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  {t('favorites.confirm.cancel')}
                </button>
                <button
                  onClick={() => handleRemove(removeConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  {t('favorites.confirm.unfavorite')}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('favorites.deleteConfirm.title')}</h3>
              <p className="text-sm text-gray-600 mb-6">
                {t('favorites.deleteConfirm.message')}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  {t('favorites.confirm.cancel')}
                </button>
                <button
                  onClick={() => handleDeleteResource(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  {t('favorites.confirm.deleteResource')}
                </button>
              </div>
            </div>
          </div>
        )}

        {clearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('favorites.clearConfirm.title')}</h3>
              <p className="text-sm text-gray-600 mb-6">
                {t('favorites.clearConfirm.message')}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setClearConfirm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  {t('favorites.confirm.cancel')}
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  {t('favorites.confirm.clearAll')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ResourceFavorites;
