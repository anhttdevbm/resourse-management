import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeading from '../components/heading';
import {
  FaDownload,
  FaChartLine,
  FaArrowUp,
  FaFile,
  FaCalendarAlt,
  FaFilter,
} from 'react-icons/fa';
import { 
  StatisticsService, 
  DownloadStatistics,
  TopDownloadedResource,
  StatisticsData,
  type ReportPeriod,
} from '../services/StatisticsService';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/translations';

const Downloads: React.FC = () => {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [downloadStats, setDownloadStats] = useState<DownloadStatistics | null>(null);
  const [topDownloads, setTopDownloads] = useState<TopDownloadedResource[]>([]);
  const [overallStats, setOverallStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [topDownloadsLoading, setTopDownloadsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('7d');

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch download statistics
      const stats = await StatisticsService.getDownloadStatistics(selectedPeriod);
      setDownloadStats(stats);

      // Fetch top downloads
      setTopDownloadsLoading(true);
      const top = await StatisticsService.getTopDownloadedResources(20);
      setTopDownloads(top);

      // Fetch overall statistics
      const overall = await StatisticsService.getStatistics();
      setOverallStats(overall);
    } catch (error) {
      console.error('Error fetching download data:', error);
    } finally {
      setLoading(false);
      setTopDownloadsLoading(false);
    }
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN');
  };

  const getPeriodLabel = (period: ReportPeriod): string => {
    const key = `downloads.period.${period}` as TranslationKey;
    const translated = t(key);
    return translated === key ? period : translated;
  };

  const formatChartLabel = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate chart data for visualization
  const getChartData = () => {
    if (!downloadStats || !downloadStats.time_series) return [];
    return downloadStats.time_series;
  };

  // Get max value for chart scaling
  const getMaxValue = () => {
    if (!downloadStats) return 100;
    return Math.max(downloadStats.peak_downloads, 10);
  };

  const chartData = getChartData();
  const maxValue = getMaxValue();

  const breadcrumb = {
    title: t('downloads.breadcrumbTitle'),
    route: '/dashboard/downloads',
  };

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        {/* Period Filter */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{t('downloads.timeRange')}</span>
          </div>
          <div className="flex space-x-2">
            {(['1d', '7d', '30d', '90d', '1y'] as ReportPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('downloads.cards.totalDownloads')}</p>
                {loading ? (
                  <p className="text-2xl font-semibold text-gray-400">...</p>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(downloadStats?.total_downloads)}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FaDownload className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                {t('downloads.cards.noteWithPeriod').replace('{period}', getPeriodLabel(selectedPeriod))}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('downloads.cards.average')}</p>
                {loading ? (
                  <p className="text-2xl font-semibold text-gray-400">...</p>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {downloadStats?.average_downloads.toFixed(1) || '0'}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FaChartLine className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">{t('downloads.cards.perDay')}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('downloads.cards.peak')}</p>
                {loading ? (
                  <p className="text-2xl font-semibold text-gray-400">...</p>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(downloadStats?.peak_downloads)}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <FaArrowUp className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">{t('downloads.cards.peakNote')}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('downloads.cards.totalResources')}</p>
                {loading ? (
                  <p className="text-2xl font-semibold text-gray-400">...</p>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(overallStats?.total_resources)}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FaFile className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">{t('downloads.cards.resourcesNote')}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Download Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaChartLine className="mr-2 text-blue-600" />
                {t('downloads.chart.title')}
              </h3>
              <div className="flex items-center text-sm text-gray-500">
                <FaCalendarAlt className="mr-1" />
                {getPeriodLabel(selectedPeriod)}
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-sm text-gray-500">{t('downloads.chart.loading')}</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">{t('downloads.chart.empty')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Simple Bar Chart */}
                <div className="flex items-end justify-between h-64 space-x-1">
                  {chartData.map((item, index) => {
                    const height = maxValue > 0 ? (item.downloads / maxValue) * 100 : 0;
                    const chartLabel = formatChartLabel(item.date);
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div className="w-full flex flex-col items-center justify-end h-full">
                          <div
                            className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all duration-300 cursor-pointer group-hover:bg-blue-700"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={t('downloads.chart.barTitle')
                              .replace('{label}', chartLabel)
                              .replace('{count}', String(item.downloads))}
                          ></div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 text-center truncate w-full">
                          {chartLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Chart Legend */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">{t('downloads.chart.legend')}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('downloads.chart.totalLine').replace(
                      '{count}',
                      formatNumber(downloadStats?.total_downloads)
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Downloads */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaDownload className="mr-2 text-blue-600" />
              {t('downloads.top.title')}
            </h3>
            {topDownloadsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">{t('downloads.top.loading')}</span>
              </div>
            ) : topDownloads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">{t('downloads.top.empty')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {topDownloads.map((resource, index) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-xs font-semibold text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {resource.name}
                        </p>
                        {resource.extension && (
                          <p className="text-xs text-gray-500">
                            .{resource.extension.toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <FaDownload className="text-gray-400 text-xs" />
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatNumber(resource.downloads)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Download History Table */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaFile className="mr-2 text-blue-600" />
            {t('downloads.table.title')}
          </h3>
          {topDownloadsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-500">{t('downloads.table.loading')}</span>
            </div>
          ) : topDownloads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">{t('downloads.table.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('downloads.table.colNo')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('downloads.table.colName')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('downloads.table.colType')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('downloads.table.colDownloads')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('downloads.table.colStatus')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topDownloads.map((resource, index) => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {resource.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {resource.extension || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FaDownload className="mr-1 text-gray-400" />
                          {formatNumber(resource.downloads)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {t('downloads.table.statusActive')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Downloads;

