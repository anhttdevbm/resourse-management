import React, { useCallback, useEffect, useState, useMemo } from 'react';
import PageHeading from "../components/heading";
import { StatisticsService, RecentActivity } from '../services/StatisticsService';
import { useI18n } from '../i18n/I18nProvider';
import { 
  FaSearch, 
  FaUpload, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaClock,
  FaFile,
  FaTimes,
  FaFileExport
} from 'react-icons/fa';

type ActivityType = 'all' | 'upload' | 'pending' | 'approved' | 'rejected';

const Activity: React.FC = () => {
  const { t, locale } = useI18n();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ActivityType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch more activities to allow filtering and pagination
      const data = await StatisticsService.getRecentActivities(100);
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(t('activity.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Filter activities based on search and type
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.message.toLowerCase().includes(query) ||
        activity.file_name.toLowerCase().includes(query) ||
        activity.file_ext.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activities, selectedType, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredActivities.slice(startIndex, endIndex);
  }, [filteredActivities, currentPage, itemsPerPage]);

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <FaUpload className="w-4 h-4" />;
      case 'pending':
        return <FaClock className="w-4 h-4" />;
      case 'approved':
        return <FaCheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <FaExclamationTriangle className="w-4 h-4" />;
      default:
        return <FaFile className="w-4 h-4" />;
    }
  };

  // Get activity color
  const getActivityColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500 text-blue-600 border-blue-200',
      green: 'bg-green-500 text-green-600 border-green-200',
      yellow: 'bg-yellow-500 text-yellow-600 border-yellow-200',
      red: 'bg-red-500 text-red-600 border-red-200',
    };
    return colorMap[color] || 'bg-gray-500 text-gray-600 border-gray-200';
  };

  // Get activity badge color
  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'upload':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get activity type label
  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'upload':
        return t('activity.type.upload');
      case 'pending':
        return t('activity.type.pending');
      case 'approved':
        return t('activity.type.approved');
      case 'rejected':
        return t('activity.type.rejected');
      default:
        return t('activity.type.other');
    }
  };

  const dateLocaleTag = locale === 'en' ? 'en-US' : 'vi-VN';

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('activity.na');
    try {
      const date = new Date(dateString);
      return date.toLocaleString(dateLocaleTag, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return t('activity.na');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      t('activity.csv.id'),
      t('activity.csv.type'),
      t('activity.csv.message'),
      t('activity.csv.fileName'),
      t('activity.csv.format'),
      t('activity.csv.timeAgo'),
      t('activity.csv.createdAt'),
    ];
    const rows = filteredActivities.map(activity => [
      activity.id,
      getActivityTypeLabel(activity.type),
      activity.message,
      activity.file_name,
      activity.file_ext,
      activity.time_ago,
      formatDate(activity.created_at)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setCurrentPage(1);
  };

  const breadcrumb = useMemo(
    () => ({
      title: t('activity.breadcrumbTitle'),
      route: '/dashboard/activity',
    }),
    [t]
  );

  // Activity type counts
  const activityCounts = useMemo(() => {
    return {
      all: activities.length,
      upload: activities.filter(a => a.type === 'upload').length,
      pending: activities.filter(a => a.type === 'pending').length,
      approved: activities.filter(a => a.type === 'approved').length,
      rejected: activities.filter(a => a.type === 'rejected').length,
    };
  }, [activities]);

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('activity.pageTitle')}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('activity.pageSubtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FaFileExport className="w-4 h-4" />
                {t('activity.exportCsv')}
              </button>
              <button
                onClick={fetchActivities}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                {t('activity.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('activity.searchPlaceholder')}
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

            {/* Type Filter */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'upload', 'pending', 'approved', 'rejected'] as ActivityType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    selectedType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type === 'all' ? t('activity.filterAll') : getActivityTypeLabel(type)}
                  {type !== 'all' && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      selectedType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {activityCounts[type]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Reset Filter */}
            {(searchQuery || selectedType !== 'all') && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-2"
              >
                <FaTimes className="w-3 h-3" />
                {t('activity.resetFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('activity.stats.totalActivities')}</p>
                <p className="text-2xl font-semibold text-gray-900">{activities.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaFile className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('activity.stats.upload')}</p>
                <p className="text-2xl font-semibold text-blue-600">{activityCounts.upload}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaUpload className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('activity.stats.pending')}</p>
                <p className="text-2xl font-semibold text-yellow-600">{activityCounts.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaClock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('activity.stats.approved')}</p>
                <p className="text-2xl font-semibold text-green-600">{activityCounts.approved}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">{t('activity.loading')}</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FaExclamationTriangle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchActivities}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('activity.retry')}
              </button>
            </div>
          ) : paginatedActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FaFile className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">{t('activity.empty.title')}</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchQuery || selectedType !== 'all'
                  ? t('activity.empty.hintFiltered')
                  : t('activity.empty.hintNone')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('activity.col.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('activity.col.message')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('activity.col.fileName')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('activity.col.format')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('activity.col.timeAgo')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('activity.col.createdAt')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedActivities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${getActivityColor(activity.color)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getActivityBadgeColor(activity.type)}`}>
                              {getActivityTypeLabel(activity.type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaFile className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 font-medium">{activity.file_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {activity.file_ext || t('activity.na')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{activity.time_ago}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{formatDate(activity.created_at)}</span>
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
                    <span className="text-sm text-gray-700">{t('activity.pagination.showing')}</span>
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
                      {t('activity.pagination.totalCount').replace('{count}', String(filteredActivities.length))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {t('activity.pagination.prev')}
                    </button>
                    <span className="text-sm text-gray-700">
                      {t('activity.pagination.page').replace('{current}', String(currentPage)).replace('{total}', String(totalPages))}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {t('activity.pagination.next')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Activity;

