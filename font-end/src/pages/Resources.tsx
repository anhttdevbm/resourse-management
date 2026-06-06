import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageHeading from '../components/heading';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/translations';
import { ResourceService, Resource, ResourceFilters } from '../services/ResourceService';
import { DownloadHistoryService } from '../services/DownloadHistoryService';
import { FavoritesService } from '../services/FavoritesService';
import { BookmarksService } from '../services/BookmarksService';
import {
  FaSearch,
  FaFilter,
  FaDownload,
  FaEdit,
  FaTrash,
  FaEye,
  FaFile,
  FaTimes,
  FaFileExport,
  FaPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaServer,
  FaTag,
  FaBox,
  FaFolder,
  FaHeart,
  FaBookmark,
} from 'react-icons/fa';

type SortField = 'name' | 'version' | 'created_at';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

const STATUS_I18N: Record<string, TranslationKey> = {
  Active: 'resources.status.active',
  Pending: 'resources.status.pending',
  Approved: 'resources.status.approved',
  Rejected: 'resources.status.rejected',
};

const Resources: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ResourceFilters>({});
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(FavoritesService.getFavorites().map((r) => r.id))
  );
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(
    () => new Set(BookmarksService.getBookmarks().map((r) => r.id))
  );

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ResourceService.getResources(filters);
      setResources(data);
    } catch (err: unknown) {
      console.error('Error fetching resources:', err);
      setError(t('resources.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    let filtered = [...resources];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (resource) =>
          resource.name.toLowerCase().includes(query) ||
          resource.version.toLowerCase().includes(query) ||
          resource.url.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'version':
          aValue = a.version.toLowerCase();
          bValue = b.version.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [resources, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedResources.length / itemsPerPage);
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedResources.slice(startIndex, endIndex);
  }, [filteredAndSortedResources, currentPage, itemsPerPage]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: resources.length,
      filtered: filteredAndSortedResources.length,
      byStatus: {
        active: resources.filter((r) => r.resource_status?.name === 'Active' || !r.is_deleted).length,
        pending: resources.filter((r) => r.resource_status?.name === 'Pending').length,
        archived: resources.filter((r) => r.is_deleted).length,
      },
    };
  }, [resources, filteredAndSortedResources]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <FaSort className="w-3 h-3 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <FaSortUp className="w-3 h-3 text-blue-600" />
    ) : (
      <FaSortDown className="w-3 h-3 text-blue-600" />
    );
  };

  // Handle delete
  const handleDelete = async (resourceId: string) => {
    try {
      await ResourceService.deleteResource(resourceId);
      setResources(resources.filter((r) => r.id !== resourceId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting resource:', err);
      alert(t('resources.deleteError'));
    }
  };

  // Handle download - ghi vào lịch sử đã tải để hiển thị tại /resources/downloaded
  const handleDownload = async (resource: Resource) => {
    DownloadHistoryService.addToHistory({
      id: resource.id,
      name: resource.name,
      version: resource.version,
      url: resource.url,
    });
    const filename =
      (resource.url && resource.url.split('/').pop()) ||
      (resource.name ? `${resource.name}.bin` : undefined);
    await ResourceService.downloadResource(resource.id, filename);
  };

  const handleToggleFavorite = (resource: Resource) => {
    FavoritesService.toggleFavorite({
      id: resource.id,
      name: resource.name,
      version: resource.version,
      url: resource.url,
    });
    setFavoriteIds(new Set(FavoritesService.getFavorites().map((r) => r.id)));
  };

  const handleToggleBookmark = (resource: Resource) => {
    BookmarksService.toggleBookmark({
      id: resource.id,
      name: resource.name,
      version: resource.version,
      url: resource.url,
    });
    setBookmarkIds(new Set(BookmarksService.getBookmarks().map((r) => r.id)));
  };

  // Format date
  const dateLocaleTag = locale === 'en' ? 'en-US' : 'vi-VN';

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(dateLocaleTag, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return t('resources.na');
    }
  };

  const getStatusLabel = (statusName: string) => {
    const key = STATUS_I18N[statusName];
    return key ? t(key) : statusName;
  };

  const getStatusBadge = (resource: Resource) => {
    if (resource.is_deleted) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          {t('resources.status.deleted')}
        </span>
      );
    }

    const statusName = resource.resource_status?.name || 'Unknown';
    const statusColors: Record<string, string> = {
      Active: 'bg-green-100 text-green-800 border-green-200',
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Approved: 'bg-blue-100 text-blue-800 border-blue-200',
      Rejected: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          statusColors[statusName] || 'bg-gray-100 text-gray-800 border-gray-200'
        }`}
      >
        {getStatusLabel(statusName)}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = [
      t('resources.csv.id'),
      t('resources.csv.name'),
      t('resources.csv.version'),
      t('resources.csv.url'),
      t('resources.csv.status'),
      t('resources.csv.platform'),
      t('resources.csv.productType'),
      t('resources.csv.createdAt'),
    ];
    const rows = filteredAndSortedResources.map((resource) => [
      resource.id,
      resource.name,
      resource.version,
      resource.url,
      resource.resource_status?.name
        ? getStatusLabel(resource.resource_status.name)
        : t('resources.na'),
      resource.resource_platform?.name || t('resources.na'),
      resource.product_type?.name || t('resources.na'),
      formatDate(resource.created_at),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `resources_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilters({});
    setCurrentPage(1);
  };

  const breadcrumb = useMemo(
    () => ({
      title: t('resources.breadcrumbTitle'),
      route: '/resources',
    }),
    [t]
  );

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('resources.pageTitle')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('resources.pageSubtitle')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FaFileExport className="w-4 h-4" />
                {t('resources.exportCsv')}
              </button>
              <button
                onClick={() => navigate('/resources/upload')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FaPlus className="w-4 h-4" />
                {t('resources.addNew')}
              </button>
              <button
                onClick={fetchResources}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                {t('resources.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('resources.stats.total')}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaFile className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('resources.stats.active')}</p>
                <p className="text-2xl font-semibold text-green-600">{stats.byStatus.active}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('resources.stats.pending')}</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.byStatus.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaClock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('resources.stats.filtered')}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.filtered}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaFilter className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('resources.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('resources.viewTable')}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('resources.viewGrid')}
              </button>
            </div>

            {/* Reset Filter */}
            {(searchQuery || Object.keys(filters).length > 0) && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-2"
              >
                <FaTimes className="w-3 h-3" />
                {t('resources.resetFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Resources List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">{t('resources.loading')}</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FaExclamationTriangle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchResources}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('resources.retry')}
              </button>
            </div>
          ) : paginatedResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FaFile className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">{t('resources.empty.title')}</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchQuery || Object.keys(filters).length > 0
                  ? t('resources.empty.hintFiltered')
                  : t('resources.empty.hintNone')}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span>{t('resources.col.name')}</span>
                          <button onClick={() => handleSort('name')} className="hover:text-blue-600">
                            {getSortIcon('name')}
                          </button>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span>{t('resources.col.version')}</span>
                          <button onClick={() => handleSort('version')} className="hover:text-blue-600">
                            {getSortIcon('version')}
                          </button>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('resources.col.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('resources.col.platform')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span>{t('resources.col.createdAt')}</span>
                          <button onClick={() => handleSort('created_at')} className="hover:text-blue-600">
                            {getSortIcon('created_at')}
                          </button>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('resources.col.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedResources.map((resource) => (
                      <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaFile className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{resource.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">{resource.url}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {resource.version}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(resource)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaServer className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {resource.resource_platform?.name || t('resources.na')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{formatDate(resource.created_at)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownload(resource)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={t('resources.action.download')}
                            >
                              <FaDownload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleFavorite(resource)}
                              className={`p-2 rounded-lg transition-colors ${
                                favoriteIds.has(resource.id)
                                  ? 'text-pink-600 hover:bg-pink-50'
                                  : 'text-gray-400 hover:bg-gray-100 hover:text-pink-500'
                              }`}
                              title={
                                favoriteIds.has(resource.id)
                                  ? t('resources.action.removeFavorite')
                                  : t('resources.action.addFavorite')
                              }
                            >
                              <FaHeart className={`w-4 h-4 ${favoriteIds.has(resource.id) ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleToggleBookmark(resource)}
                              className={`p-2 rounded-lg transition-colors ${
                                bookmarkIds.has(resource.id)
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-gray-400 hover:bg-gray-100 hover:text-amber-500'
                              }`}
                              title={
                                bookmarkIds.has(resource.id)
                                  ? t('resources.action.removeBookmark')
                                  : t('resources.action.addBookmark')
                              }
                            >
                              <FaBookmark className={`w-4 h-4 ${bookmarkIds.has(resource.id) ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => navigate(`/resources/${resource.id}`)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={t('resources.action.viewDetail')}
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(resource.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('resources.action.delete')}
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => (window.location.href = `/resources/${resource.id}/edit`)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                title={t('resources.action.edit')}
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{t('resources.pagination.showing')}</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-700">
                      {t('resources.pagination.totalCount').replace(
                        '{count}',
                        String(filteredAndSortedResources.length)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {t('resources.pagination.prev')}
                    </button>
                    <span className="text-sm text-gray-700">
                      {t('resources.pagination.page')
                        .replace('{current}', String(currentPage))
                        .replace('{total}', String(totalPages))}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {t('resources.pagination.next')}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FaFile className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{resource.name}</h3>
                          <p className="text-xs text-gray-500">{resource.version}</p>
                        </div>
                      </div>
                      {getStatusBadge(resource)}
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FaServer className="w-3 h-3" />
                        <span>{resource.resource_platform?.name || t('resources.na')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FaBox className="w-3 h-3" />
                        <span>{resource.product_type?.name || t('resources.na')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaClock className="w-3 h-3" />
                        <span>{formatDate(resource.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleDownload(resource)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <FaDownload className="w-3 h-3" />
                        {t('resources.action.download')}
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(resource)}
                        className={`px-3 py-2 rounded-lg transition-colors text-xs ${
                          favoriteIds.has(resource.id)
                            ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-pink-500'
                        }`}
                        title={
                          favoriteIds.has(resource.id)
                            ? t('resources.action.removeFavorite')
                            : t('resources.action.favorite')
                        }
                      >
                        <FaHeart className={`w-3 h-3 ${favoriteIds.has(resource.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleToggleBookmark(resource)}
                        className={`px-3 py-2 rounded-lg transition-colors text-xs ${
                          bookmarkIds.has(resource.id)
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-amber-600'
                        }`}
                        title={
                          bookmarkIds.has(resource.id)
                            ? t('resources.action.removeBookmark')
                            : t('resources.action.addBookmark')
                        }
                      >
                        <FaBookmark className={`w-3 h-3 ${bookmarkIds.has(resource.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => navigate(`/resources/${resource.id}`)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs"
                        title={t('resources.action.viewDetail')}
                      >
                        <FaEye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(resource.id)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-xs"
                        title={t('resources.action.delete')}
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => (window.location.href = `/resources/${resource.id}/edit`)}
                          className="px-3 py-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors text-xs"
                          title={t('resources.action.edit')}
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination for Grid View */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{t('resources.pagination.showing')}</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {t('resources.pagination.prev')}
                    </button>
                    <span className="text-sm text-gray-700">
                      {t('resources.pagination.page')
                        .replace('{current}', String(currentPage))
                        .replace('{total}', String(totalPages))}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {t('resources.pagination.next')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('resources.deleteConfirm.title')}</h3>
              <p className="text-sm text-gray-600 mb-6">{t('resources.deleteConfirm.message')}</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {t('resources.deleteConfirm.cancel')}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  {t('resources.deleteConfirm.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Resources;

