import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeading from "../components/heading";
import { FaDownload, FaUpload, FaFileCode, FaShieldAlt, FaUsers } from 'react-icons/fa';
import { StatisticsService, StatisticsData, RecentActivity, FileTypeStats, TopDownloadedResource, StorageUsage, SecurityStats } from '../services/StatisticsService';
import { useI18n } from "../i18n/I18nProvider";

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [fileTypeStats, setFileTypeStats] = useState<FileTypeStats[]>([]);
  const [topDownloads, setTopDownloads] = useState<TopDownloadedResource[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [fileTypesLoading, setFileTypesLoading] = useState(true);
  const [topDownloadsLoading, setTopDownloadsLoading] = useState(true);
  const [storageLoading, setStorageLoading] = useState(true);
  const [securityLoading, setSecurityLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await StatisticsService.getStatistics();
        setStats(data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRecentActivities = async () => {
      setActivitiesLoading(true);
      try {
        const data = await StatisticsService.getRecentActivities(10);
        setRecentActivities(data);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      } finally {
        setActivitiesLoading(false);
      }
    };

    const fetchFileTypeStats = async () => {
      setFileTypesLoading(true);
      try {
        const data = await StatisticsService.getFileTypeStatistics();
        setFileTypeStats(data);
      } catch (error) {
        console.error('Error fetching file type statistics:', error);
      } finally {
        setFileTypesLoading(false);
      }
    };

    const fetchTopDownloads = async () => {
      setTopDownloadsLoading(true);
      try {
        const data = await StatisticsService.getTopDownloadedResources(10);
        setTopDownloads(data);
      } catch (error) {
        console.error('Error fetching top downloads:', error);
      } finally {
        setTopDownloadsLoading(false);
      }
    };

    const fetchStorageUsage = async () => {
      setStorageLoading(true);
      try {
        const data = await StatisticsService.getStorageUsage();
        setStorageUsage(data);
      } catch (error) {
        console.error('Error fetching storage usage:', error);
      } finally {
        setStorageLoading(false);
      }
    };

    const fetchSecurityStats = async () => {
      setSecurityLoading(true);
      try {
        const data = await StatisticsService.getSecurityStatistics();
        setSecurityStats(data);
      } catch (error) {
        console.error('Error fetching security statistics:', error);
      } finally {
        setSecurityLoading(false);
      }
    };
    
    fetchStats();
    fetchRecentActivities();
    fetchFileTypeStats();
    fetchTopDownloads();
    fetchStorageUsage();
    fetchSecurityStats();
  }, []);

  // Get color class for activity dot
  const getActivityDotColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  // Get color class for file type progress bar
  const getFileTypeBarColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      yellow: 'bg-yellow-600',
      purple: 'bg-purple-600',
      orange: 'bg-orange-600',
      red: 'bg-red-600',
      pink: 'bg-pink-600',
      cyan: 'bg-cyan-600',
      gray: 'bg-gray-600',
    };
    return colorMap[color] || 'bg-gray-600';
  };

  // Get icon color for file type
  const getFileTypeIconColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      yellow: 'text-yellow-500',
      purple: 'text-purple-500',
      orange: 'text-orange-500',
      red: 'text-red-500',
      pink: 'text-pink-500',
      cyan: 'text-cyan-500',
      gray: 'text-gray-500',
    };
    return colorMap[color] || 'text-gray-500';
  };
  
  const breadcrumb = {
    title: t("dashboard.breadcrumbTitle"),
    route: '/dashboard'
  };

  // Format number with thousand separators
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString(locale === "en" ? "en-US" : "vi-VN");
  };

  return (
    <>
      <PageHeading breadcrumb={breadcrumb}/>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Thống kê tổng quan */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FaDownload className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("dashboard.cards.totalResources")}</p>
                {loading ? (
                  <p className="text-2xl font-semibold text-gray-400">...</p>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats?.total_resources)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FaUpload className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("dashboard.cards.uploadsToday")}</p>
                {loading ? (
                  <p className="text-2xl font-semibold text-gray-400">...</p>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats?.uploads_today)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <FaUsers className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("dashboard.cards.totalDownloads")}</p>
                {loading ? (
                  <p className="text-2xl font-semibold text-gray-400">...</p>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats?.total_downloads)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <FaShieldAlt className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t("dashboard.cards.pendingReview")}</p>
                {loading ? (
                  <p className="text-2xl font-semibold text-gray-400">...</p>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats?.files_pending_review)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nội dung chính */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("dashboard.sections.recentActivity")}</h3>
            <div className="space-y-4">
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">{t("dashboard.loadingShort")}</span>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">{t("dashboard.empty.noActivity")}</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 ${getActivityDotColor(activity.color)} rounded-full flex-shrink-0`}></div>
                    <p className="text-sm text-gray-600 flex-1 truncate">{activity.message}</p>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time_ago}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("dashboard.sections.fileTypeStats")}</h3>
            <div className="space-y-4">
              {fileTypesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">{t("dashboard.loadingShort")}</span>
                </div>
              ) : fileTypeStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">{t("dashboard.empty.noStats")}</p>
                </div>
              ) : (
                fileTypeStats.map((fileType, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FaFileCode className={`w-4 h-4 ${getFileTypeIconColor(fileType.color)} mr-2`} />
                      <span className="text-sm text-gray-600">{fileType.type} Files</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`${getFileTypeBarColor(fileType.color)} h-2 rounded-full transition-all duration-300`} 
                          style={{width: `${Math.min(fileType.percentage, 100)}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-12 text-right">{fileType.percentage}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Thống kê chi tiết */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("dashboard.sections.topDownloads")}</h3>
            {topDownloadsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">{t("dashboard.loadingShort")}</span>
              </div>
            ) : topDownloads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">{t("dashboard.empty.noData")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topDownloads.slice(0, 5).map((resource) => (
                  <div key={resource.id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 truncate flex-1 mr-2" title={resource.name}>
                      {resource.name}
                      {resource.extension && <span className="text-gray-400">.{resource.extension.toLowerCase()}</span>}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatNumber(resource.downloads)} {t("dashboard.downloads.unit")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("dashboard.sections.storageUsage")}</h3>
            {storageLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">{t("dashboard.loadingShort")}</span>
              </div>
            ) : storageUsage ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t("dashboard.storage.used")}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {storageUsage.used_space_tb.toFixed(1)} TB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t("dashboard.storage.available")}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {storageUsage.available_space_tb.toFixed(1)} TB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{width: `${Math.min(storageUsage.usage_percentage, 100)}%`}}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {storageUsage.usage_percentage.toFixed(1)}{t("dashboard.storage.percentUsed")}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">{t("dashboard.empty.noData")}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("dashboard.sections.security")}</h3>
            {securityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">{t("dashboard.loadingShort")}</span>
              </div>
            ) : securityStats ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t("dashboard.security.filesScanned")}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(securityStats.files_scanned)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t("dashboard.security.cleanFiles")}</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatNumber(securityStats.clean_files)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t("dashboard.security.infectedFiles")}</span>
                  <span className="text-sm font-semibold text-red-600">
                    {formatNumber(securityStats.infected_files)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">{t("dashboard.empty.noData")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Thông báo chào mừng */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">
            {t("dashboard.welcome.title").replace("{name}", user?.name || "")}
          </h3>
          <p className="text-blue-100">
            {isAdmin 
              ? t("dashboard.welcome.adminDesc")
              : t("dashboard.welcome.userDesc")
            }
          </p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;