import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageHeading from '../components/heading';
import { useI18n } from '../i18n/I18nProvider';
import {
  DownloadHistoryService,
  DownloadedResourceRecord,
} from '../services/DownloadHistoryService';
import { ResourceService } from '../services/ResourceService';
import { StatisticsService, TopDownloadedResource } from '../services/StatisticsService';
import {
  FaSearch,
  FaDownload,
  FaFile,
  FaTimes,
  FaFileExport,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTrash,
  FaCalendarAlt,
  FaBoxOpen,
  FaExternalLinkAlt,
} from 'react-icons/fa';

type SortField = 'name' | 'version' | 'downloaded_at';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';
type DateRangeFilter = 'all' | '7d' | '30d';

const DOWNLOAD_HISTORY_STORAGE_KEY = 'resource_download_history';

const DownloadedResources: React.FC = () => {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN';
  const location = useLocation();
  const isMyDownloadsRoute = location.pathname === '/my-downloads';

  const [history, setHistory] = useState<DownloadedResourceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('downloaded_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [topDownloads, setTopDownloads] = useState<TopDownloadedResource[]>([]);
  const [topLoading, setTopLoading] = useState(false);

  const loadHistory = () => setHistory(DownloadHistoryService.getHistory());

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const refresh = () => loadHistory();
    const onStorage = (e: StorageEvent) => {
      if (e.key === DOWNLOAD_HISTORY_STORAGE_KEY || e.key === null) refresh();
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

  useEffect(() => {
    let cancelled = false;
    setTopLoading(true);
    StatisticsService.getTopDownloadedResources(8)
      .then((data) => {
        if (!cancelled) setTopDownloads(data);
      })
      .catch(() => {
        if (!cancelled) setTopDownloads([]);
      })
      .finally(() => {
        if (!cancelled) setTopLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = [...history];

    if (dateRange !== 'all') {
      const now = Date.now();
      const cutoff =
        dateRange === '7d' ? now - 7 * 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((r) => new Date(r.downloaded_at).getTime() >= cutoff);
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
        case 'downloaded_at':
          aVal = new Date(a.downloaded_at).getTime();
          bVal = new Date(b.downloaded_at).getTime();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [history, searchQuery, dateRange, sortField, sortDirection]);

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
      total: history.length,
      thisWeek: history.filter((r) => new Date(r.downloaded_at).getTime() >= weekAgo).length,
      thisMonth: history.filter((r) => new Date(r.downloaded_at).getTime() >= monthAgo).length,
      filtered: filteredAndSorted.length,
    };
  }, [history, filteredAndSorted]);

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
    const record = history.find((r) => r.id === id);
    if (record) {
      DownloadHistoryService.addToHistory(record);
      const filename =
        (record.url && record.url.split('/').pop()) ||
        (record.name ? `${record.name}.bin` : undefined);
      await ResourceService.downloadResource(id, filename);
      loadHistory();
    } else {
      await ResourceService.downloadResource(id);
    }
  };

  const handleRemove = (id: string) => {
    DownloadHistoryService.removeFromHistory(id);
    setRemoveConfirm(null);
    loadHistory();
  };

  const handleClearAll = () => {
    DownloadHistoryService.clearHistory();
    setClearConfirm(false);
    loadHistory();
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
      t('downloaded.col.name'),
      t('downloaded.col.version'),
      'URL',
      t('downloaded.csv.downloadedAt'),
    ];
    const rows = filteredAndSorted.map((r) => [
      r.id,
      r.name,
      r.version,
      r.url || '',
      formatDate(r.downloaded_at),
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c}"`).join(','))].join(
      '\n'
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${t('downloaded.csv.filename')}_${new Date().toISOString().split('T')[0]}.csv`;
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
      isMyDownloadsRoute
        ? { title: t('downloaded.breadcrumbMyDownloads'), route: '/my-downloads' }
        : { title: t('downloaded.breadcrumbDownloaded'), route: '/resources/downloaded' },
    [isMyDownloadsRoute, t]
  );

  const pageTitle = isMyDownloadsRoute
    ? t('downloaded.pageTitleMyDownloads')
    : t('downloaded.pageTitleDownloaded');
  const pageDescription = isMyDownloadsRoute
    ? t('downloaded.pageDescMyDownloads')
    : t('downloaded.pageDescDownloaded');

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        {/* Header — card, phân tầng rõ; nút xóa tách khỏi nhóm thao tác chính */}
        <div className="mb-8 rounded-2xl border border-gray-200/90 bg-gradient-to-br from-white via-slate-50/40 to-white shadow-sm dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950">
          <div className="p-6 sm:p-7">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
                      {pageTitle}
                    </h2>
                    {isMyDownloadsRoute && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-800 ring-1 ring-inset ring-blue-600/15 dark:bg-blue-950/60 dark:text-blue-200 dark:ring-blue-400/25">
                        {t('downloaded.badgeLocal')}
                      </span>
                    )}
                  </div>
                  <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                    {pageDescription}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-gray-200/70 pt-5 dark:border-slate-700/70 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-500">
                  {t('downloaded.historyCount').replace('{count}', String(history.length))}
                  {filteredAndSorted.length !== history.length && (
                    <>
                      {' '}
                      {t('downloaded.afterFilter').replace(
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
                      {t('downloaded.exportCsv')}
                    </button>
                    {isMyDownloadsRoute && (
                      <Link
                        to="/resources/downloaded"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                      >
                        <FaExternalLinkAlt className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                        {t('downloaded.linkDownloaded')}
                      </Link>
                    )}
                    <Link
                      to="/resources"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <FaBoxOpen className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                      {t('downloaded.linkResourceList')}
                    </Link>
                  </div>

                  {history.length > 0 && (
                    <div className="flex items-center justify-end sm:border-l sm:border-gray-200 sm:pl-3 dark:sm:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setClearConfirm(true)}
                        title={t('downloaded.clearAllTitle')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70 sm:w-auto"
                      >
                        <FaTrash className="h-4 w-4" />
                        <span className="sm:hidden">{t('downloaded.clearAllShort')}</span>
                        <span className="hidden sm:inline">{t('downloaded.clearAllLong')}</span>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('downloaded.stats.total')}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaDownload className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('downloaded.stats.thisWeek')}</p>
                <p className="text-2xl font-semibold text-green-600">{stats.thisWeek}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCalendarAlt className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('downloaded.stats.thisMonth')}</p>
                <p className="text-2xl font-semibold text-purple-600">{stats.thisMonth}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaCalendarAlt className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('downloaded.stats.filtered')}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.filtered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('downloaded.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">{t('downloaded.dateRange.all')}</option>
              <option value="7d">{t('downloaded.dateRange.7d')}</option>
              <option value="30d">{t('downloaded.dateRange.30d')}</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('downloaded.viewTable')}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('downloaded.viewGrid')}
              </button>
            </div>
            {(searchQuery || dateRange !== 'all') && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-2"
              >
                <FaTimes className="w-3 h-3" />
                {t('downloaded.resetFilters')}
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredAndSorted.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <FaBoxOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('downloaded.empty.title')}</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {t('downloaded.empty.hint')}
              </p>
              <Link
                to="/resources"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <FaExternalLinkAlt className="w-4 h-4" />
                {t('downloaded.empty.goResources')}
              </Link>

              {topDownloads.length > 0 && (
                <div className="mt-10 text-left max-w-2xl mx-auto">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {t('downloaded.empty.suggestions')}
                  </h4>
                  {topLoading ? (
                    <p className="text-sm text-gray-500">{t('downloaded.empty.loading')}</p>
                  ) : (
                    <ul className="space-y-2">
                      {topDownloads.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700 truncate flex-1">
                            {r.name}
                            {r.extension && (
                              <span className="text-gray-400">.{r.extension.toLowerCase()}</span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {t('downloaded.empty.downloadCount').replace(
                              '{count}',
                              String(r.downloads)
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          {t('downloaded.col.name')}
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('version')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          {t('downloaded.col.version')}
                          {getSortIcon('version')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('downloaded_at')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          {t('downloaded.col.downloadedAt')}
                          {getSortIcon('downloaded_at')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('downloaded.col.actions')}
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
                              {r.url && (
                                <p className="text-xs text-gray-500 truncate max-w-xs">{r.url}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {r.version}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(r.downloaded_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/resources/${r.id}`}
                              className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
                              title={t('downloaded.action.detail')}
                            >
                              <FaExternalLinkAlt className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDownload(r.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title={t('downloaded.action.redownload')}
                            >
                              <FaDownload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRemoveConfirm(r.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title={t('downloaded.action.remove')}
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
                    <span className="text-sm text-gray-700">{t('downloaded.pagination.showing')}</span>
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
                      {t('downloaded.pagination.totalCount').replace(
                        '{count}',
                        String(filteredAndSorted.length)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {t('downloaded.pagination.prev')}
                    </button>
                    <span className="text-sm text-gray-700">
                      {t('downloaded.pagination.page')
                        .replace('{current}', String(currentPage))
                        .replace('{total}', String(totalPages))}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {t('downloaded.pagination.next')}
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
                  <p className="text-xs text-gray-500 mb-4">{formatDate(r.downloaded_at)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(r.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <FaDownload className="w-3 h-3" />
                      {t('downloaded.action.redownload')}
                    </button>
                    <button
                      onClick={() => setRemoveConfirm(r.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-xs"
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
                    {t('downloaded.pagination.prev')}
                  </button>
                  <span className="text-sm text-gray-700">
                    {t('downloaded.pagination.page')
                      .replace('{current}', String(currentPage))
                      .replace('{total}', String(totalPages))}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg text-sm border border-gray-300 disabled:opacity-50"
                  >
                    {t('downloaded.pagination.next')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm remove one */}
        {removeConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('downloaded.removeConfirm.title')}
              </h3>
              <p className="text-sm text-gray-600 mb-6">{t('downloaded.removeConfirm.message')}</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setRemoveConfirm(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  {t('downloaded.confirm.cancel')}
                </button>
                <button
                  onClick={() => handleRemove(removeConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  {t('downloaded.confirm.remove')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm clear all */}
        {clearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('downloaded.clearConfirm.title')}
              </h3>
              <p className="text-sm text-gray-600 mb-6">{t('downloaded.clearConfirm.message')}</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setClearConfirm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  {t('downloaded.confirm.cancel')}
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  {t('downloaded.confirm.clearAll')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DownloadedResources;
