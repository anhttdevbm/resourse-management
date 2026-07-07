import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeading from '../../components/heading';
import {
  StatisticsService,
  StatisticsData,
  RecentActivity,
  FileTypeStats,
  TopDownloadedResource,
  StorageUsage,
  SecurityStats,
  DownloadStatistics,
  UploadStatistics,
  UserStatistics,
  BreakdownItem,
  ReportPeriod,
} from '../../services/StatisticsService';
import {
  FaChartBar,
  FaDownload,
  FaUpload,
  FaUsers,
  FaShieldAlt,
  FaSync,
  FaFileExport,
  FaBox,
  FaClock,
  FaServer,
  FaExclamationTriangle,
  FaCheckCircle,
  FaExternalLinkAlt,
} from 'react-icons/fa';

type ReportTab = 'overview' | 'downloads' | 'resources' | 'users' | 'security';

const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: '1d', label: '24 giờ' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: '1y', label: '1 năm' },
];

const TAB_LABELS: Record<ReportTab, string> = {
  overview: 'Tổng quan',
  downloads: 'Tải xuống',
  resources: 'Tài nguyên',
  users: 'Người dùng',
  security: 'Bảo mật & lưu trữ',
};

const BAR_COLORS: Record<string, string> = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-600',
  orange: 'bg-orange-500',
  red: 'bg-red-600',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-600',
  gray: 'bg-gray-500',
};

const DOT_COLORS: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return '0';
  return n.toLocaleString('vi-VN');
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function downloadCsv(filename: string, rows: string[][]): void {
  const bom = '\uFEFF';
  const body = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([bom + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  loading?: boolean;
  hint?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, iconBg, loading, hint }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {loading ? (
          <p className="text-2xl font-bold text-gray-300 mt-1">...</p>
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        )}
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
      <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
    </div>
  </div>
);

interface TimeSeriesChartProps {
  series: Array<{ date: string; value: number }>;
  valueLabel: string;
  colorClass?: string;
  loading?: boolean;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  series,
  valueLabel,
  colorClass = 'bg-blue-600',
  loading,
}) => {
  const max = useMemo(() => Math.max(...series.map((p) => p.value), 1), [series]);
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3" />
        Đang tải biểu đồ...
      </div>
    );
  }
  if (!series.length) {
    return <p className="text-center py-12 text-gray-500 text-sm">Không có dữ liệu trong khoảng thời gian này.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1 min-w-max h-48 px-1">
        {series.map((point) => (
          <div key={point.date} className="flex flex-col items-center flex-1 min-w-[28px] max-w-[48px] group">
            <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 mb-1 whitespace-nowrap">
              {point.value} {valueLabel}
            </span>
            <div
              className={`w-full rounded-t ${colorClass} transition-all duration-300 min-h-[4px]`}
              style={{ height: `${Math.max((point.value / max) * 100, 4)}%` }}
              title={`${formatDateLabel(point.date)}: ${point.value}`}
            />
            <span className="text-[9px] text-gray-400 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
              {formatDateLabel(point.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface BreakdownPanelProps {
  title: string;
  items: BreakdownItem[];
  loading?: boolean;
}

const BreakdownPanel: React.FC<BreakdownPanelProps> = ({ title, items, loading }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    {loading ? (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
      </div>
    ) : items.length === 0 ? (
      <p className="text-sm text-gray-500 text-center py-6">Chưa có dữ liệu</p>
    ) : (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300 truncate mr-2">{item.name}</span>
              <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {formatNumber(item.count)} ({item.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className={`${BAR_COLORS[item.color] || BAR_COLORS.gray} h-2 rounded-full transition-all`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const AdminReports: React.FC = () => {
  const [tab, setTab] = useState<ReportTab>('overview');
  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<StatisticsData | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [fileTypes, setFileTypes] = useState<FileTypeStats[]>([]);
  const [topDownloads, setTopDownloads] = useState<TopDownloadedResource[]>([]);
  const [downloadStats, setDownloadStats] = useState<DownloadStatistics | null>(null);
  const [uploadStats, setUploadStats] = useState<UploadStatistics | null>(null);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<BreakdownItem[]>([]);
  const [platformBreakdown, setPlatformBreakdown] = useState<BreakdownItem[]>([]);
  const [productTypeBreakdown, setProductTypeBreakdown] = useState<BreakdownItem[]>([]);
  const [stageBreakdown, setStageBreakdown] = useState<BreakdownItem[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [security, setSecurity] = useState<SecurityStats | null>(null);

  const breadcrumb = useMemo(() => ({ title: 'Báo cáo quản trị', route: '/admin/reports' }), []);

  const loadReports = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [
        overviewData,
        activitiesData,
        fileTypesData,
        topData,
        downloadData,
        uploadData,
        usersData,
        statusData,
        platformData,
        productData,
        stageData,
        storageData,
        securityData,
      ] = await Promise.all([
        StatisticsService.getStatistics(),
        StatisticsService.getRecentActivities(50),
        StatisticsService.getFileTypeStatistics(),
        StatisticsService.getTopDownloadedResources(20),
        StatisticsService.getDownloadStatistics(period),
        StatisticsService.getUploadStatistics(period),
        StatisticsService.getUserStatistics(period),
        StatisticsService.getResourceStatusBreakdown(),
        StatisticsService.getPlatformBreakdown(),
        StatisticsService.getProductTypeBreakdown(),
        StatisticsService.getStageBreakdown(),
        StatisticsService.getStorageUsage(),
        StatisticsService.getSecurityStatistics(),
      ]);
      setOverview(overviewData);
      setActivities(activitiesData);
      setFileTypes(fileTypesData);
      setTopDownloads(topData);
      setDownloadStats(downloadData);
      setUploadStats(uploadData);
      setUserStats(usersData);
      setStatusBreakdown(statusData);
      setPlatformBreakdown(platformData);
      setProductTypeBreakdown(productData);
      setStageBreakdown(stageData);
      setStorage(storageData);
      setSecurity(securityData);
      setLastUpdated(new Date());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Không thể tải báo cáo';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => loadReports(true), 60_000);
    return () => window.clearInterval(id);
  }, [autoRefresh, loadReports]);

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const rows: string[][] = [
      ['Báo cáo RMS', stamp],
      [],
      ['=== Tổng quan ==='],
      ['Tổng tài nguyên', String(overview?.total_resources ?? 0)],
      ['Upload hôm nay', String(overview?.uploads_today ?? 0)],
      ['Tổng lượt tải', String(overview?.total_downloads ?? 0)],
      ['Chờ duyệt', String(overview?.files_pending_review ?? 0)],
      ['Tổng người dùng', String(overview?.total_users ?? 0)],
      [],
      ['=== Tải xuống (' + period + ') ==='],
      ['Tổng', String(downloadStats?.total_downloads ?? 0)],
      ['Trung bình/ngày', String(downloadStats?.average_downloads ?? 0)],
      ['Cao nhất/ngày', String(downloadStats?.peak_downloads ?? 0)],
      [],
      ['Ngày', 'Lượt tải'],
      ...(downloadStats?.time_series.map((p) => [p.date, String(p.downloads)]) ?? []),
      [],
      ['=== Upload (' + period + ') ==='],
      ['Tổng', String(uploadStats?.total_uploads ?? 0)],
      ['Ngày', 'Upload'],
      ...(uploadStats?.time_series.map((p) => [p.date, String(p.uploads)]) ?? []),
      [],
      ['=== Người dùng ==='],
      ['Tổng', String(userStats?.total_users ?? 0)],
      ['Admin', String(userStats?.admin_users ?? 0)],
      ['Bị khóa', String(userStats?.locked_users ?? 0)],
      ['Tải trong kỳ', String(userStats?.active_downloaders ?? 0)],
      [],
      ['=== Top tải xuống ==='],
      ['Tên', 'Extension', 'Downloads'],
      ...topDownloads.map((r) => [r.name, r.extension, String(r.downloads)]),
      [],
      ['=== Trạng thái tài nguyên ==='],
      ['Trạng thái', 'Số lượng', '%'],
      ...statusBreakdown.map((s) => [s.name, String(s.count), String(s.percentage)]),
    ];
    downloadCsv(`rms-admin-report-${stamp}.csv`, rows);
    toast.success('Đã xuất báo cáo CSV');
  };

  const downloadSeries = useMemo(
    () => downloadStats?.time_series.map((p) => ({ date: p.date, value: p.downloads })) ?? [],
    [downloadStats]
  );
  const uploadSeries = useMemo(
    () => uploadStats?.time_series.map((p) => ({ date: p.date, value: p.uploads })) ?? [],
    [uploadStats]
  );
  const registrationSeries = useMemo(
    () => userStats?.registrations.map((p) => ({ date: p.date, value: p.registrations })) ?? [],
    [userStats]
  );

  const cleanRate = useMemo(() => {
    if (!security?.files_scanned) return 0;
    return Math.round((security.clean_files / security.files_scanned) * 1000) / 10;
  }, [security]);

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaChartBar className="text-blue-600" />
              Báo cáo & phân tích
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Dữ liệu realtime từ API thống kê backend
              {lastUpdated && (
                <span className="ml-2">
                  · Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Tự làm mới (60s)
            </label>
            <button
              type="button"
              onClick={() => loadReports(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              <FaSync className={refreshing ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <FaFileExport />
              Xuất CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm flex items-center gap-2">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-slate-700 pb-2">
          {(Object.keys(TAB_LABELS) as ReportTab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        {/* === OVERVIEW TAB === */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="Tổng tài nguyên"
                value={formatNumber(overview?.total_resources)}
                icon={<FaBox className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-100"
                loading={loading}
              />
              <StatCard
                label="Upload hôm nay"
                value={formatNumber(overview?.uploads_today)}
                icon={<FaUpload className="w-5 h-5 text-green-600" />}
                iconBg="bg-green-100"
                loading={loading}
              />
              <StatCard
                label="Tổng lượt tải"
                value={formatNumber(overview?.total_downloads)}
                icon={<FaDownload className="w-5 h-5 text-indigo-600" />}
                iconBg="bg-indigo-100"
                loading={loading}
              />
              <StatCard
                label="Chờ duyệt"
                value={formatNumber(overview?.files_pending_review)}
                icon={<FaClock className="w-5 h-5 text-yellow-600" />}
                iconBg="bg-yellow-100"
                loading={loading}
                hint={
                  (overview?.files_pending_review ?? 0) > 0 ? (
                    <Link to="/admin/resources" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                      Đi duyệt <FaExternalLinkAlt className="w-3 h-3" />
                    </Link>
                  ) : undefined
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="Người dùng"
                value={formatNumber(overview?.total_users)}
                icon={<FaUsers className="w-5 h-5 text-purple-600" />}
                iconBg="bg-purple-100"
                loading={loading}
              />
              <StatCard
                label="Loại file"
                value={formatNumber(overview?.total_file_types)}
                icon={<FaChartBar className="w-5 h-5 text-cyan-600" />}
                iconBg="bg-cyan-100"
                loading={loading}
              />
              <StatCard
                label={`Tải xuống (${period})`}
                value={formatNumber(downloadStats?.total_downloads)}
                icon={<FaDownload className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-100"
                loading={loading}
              />
              <StatCard
                label={`Upload (${period})`}
                value={formatNumber(uploadStats?.total_uploads)}
                icon={<FaUpload className="w-5 h-5 text-green-600" />}
                iconBg="bg-green-100"
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Xu hướng tải xuống</h3>
                <TimeSeriesChart series={downloadSeries} valueLabel="lượt" loading={loading} />
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Xu hướng upload</h3>
                <TimeSeriesChart
                  series={uploadSeries}
                  valueLabel="file"
                  colorClass="bg-green-600"
                  loading={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Hoạt động gần đây</h3>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                  </div>
                ) : activities.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">Chưa có hoạt động</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {activities.slice(0, 20).map((a) => (
                      <div key={a.id} className="flex items-start gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${DOT_COLORS[a.color] || DOT_COLORS.blue}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 dark:text-gray-300 truncate">{a.message}</p>
                          <p className="text-xs text-gray-400">{a.time_ago}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <BreakdownPanel title="Phân bố trạng thái duyệt" items={statusBreakdown} loading={loading} />
            </div>
          </div>
        )}

        {/* === DOWNLOADS TAB === */}
        {tab === 'downloads' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Tổng lượt tải (kỳ)"
                value={formatNumber(downloadStats?.total_downloads)}
                icon={<FaDownload className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-100"
                loading={loading}
              />
              <StatCard
                label="Trung bình / ngày"
                value={downloadStats?.average_downloads?.toFixed(1) ?? '0'}
                icon={<FaChartBar className="w-5 h-5 text-indigo-600" />}
                iconBg="bg-indigo-100"
                loading={loading}
              />
              <StatCard
                label="Cao nhất / ngày"
                value={formatNumber(downloadStats?.peak_downloads)}
                icon={<FaCheckCircle className="w-5 h-5 text-green-600" />}
                iconBg="bg-green-100"
                loading={loading}
              />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Biểu đồ tải xuống theo ngày</h3>
              <TimeSeriesChart series={downloadSeries} valueLabel="lượt" loading={loading} />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Top tài nguyên được tải nhiều nhất</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700 text-left text-gray-500">
                        <th className="py-2 pr-4">#</th>
                        <th className="py-2 pr-4">Tên</th>
                        <th className="py-2 pr-4">Loại</th>
                        <th className="py-2 text-right">Lượt tải</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topDownloads.map((r, i) => (
                        <tr key={r.id} className="border-b border-gray-100 dark:border-slate-800">
                          <td className="py-3 pr-4 text-gray-400">{i + 1}</td>
                          <td className="py-3 pr-4">
                            <Link
                              to={`/resources/${r.id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {r.name}
                            </Link>
                          </td>
                          <td className="py-3 pr-4 text-gray-500">{r.extension || '—'}</td>
                          <td className="py-3 text-right font-semibold">{formatNumber(r.downloads)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === RESOURCES TAB === */}
        {tab === 'resources' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Upload trong kỳ"
                value={formatNumber(uploadStats?.total_uploads)}
                icon={<FaUpload className="w-5 h-5 text-green-600" />}
                iconBg="bg-green-100"
                loading={loading}
              />
              <StatCard
                label="Trung bình upload/ngày"
                value={uploadStats?.average_uploads?.toFixed(1) ?? '0'}
                icon={<FaChartBar className="w-5 h-5 text-teal-600" />}
                iconBg="bg-teal-100"
                loading={loading}
              />
              <StatCard
                label="Chờ duyệt"
                value={formatNumber(overview?.files_pending_review)}
                icon={<FaClock className="w-5 h-5 text-yellow-600" />}
                iconBg="bg-yellow-100"
                loading={loading}
              />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Upload theo ngày</h3>
              <TimeSeriesChart
                series={uploadSeries}
                valueLabel="file"
                colorClass="bg-green-600"
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BreakdownPanel title="Theo trạng thái" items={statusBreakdown} loading={loading} />
              <BreakdownPanel title="Theo loại file (extension)" items={fileTypes.map((f) => ({
                name: f.type,
                count: f.count,
                percentage: f.percentage,
                color: f.color,
              }))} loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <BreakdownPanel title="Theo nền tảng" items={platformBreakdown} loading={loading} />
              <BreakdownPanel title="Theo loại sản phẩm" items={productTypeBreakdown} loading={loading} />
              <BreakdownPanel title="Theo giai đoạn" items={stageBreakdown} loading={loading} />
            </div>
          </div>
        )}

        {/* === USERS TAB === */}
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <StatCard
                label="Tổng người dùng"
                value={formatNumber(userStats?.total_users)}
                icon={<FaUsers className="w-5 h-5 text-purple-600" />}
                iconBg="bg-purple-100"
                loading={loading}
              />
              <StatCard
                label="Mới hôm nay"
                value={formatNumber(userStats?.new_users_today)}
                icon={<FaUsers className="w-5 h-5 text-green-600" />}
                iconBg="bg-green-100"
                loading={loading}
              />
              <StatCard
                label="Admin"
                value={formatNumber(userStats?.admin_users)}
                icon={<FaShieldAlt className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-100"
                loading={loading}
              />
              <StatCard
                label="Bị khóa"
                value={formatNumber(userStats?.locked_users)}
                icon={<FaExclamationTriangle className="w-5 h-5 text-red-600" />}
                iconBg="bg-red-100"
                loading={loading}
              />
              <StatCard
                label="Có tải trong kỳ"
                value={formatNumber(userStats?.active_downloaders)}
                icon={<FaDownload className="w-5 h-5 text-indigo-600" />}
                iconBg="bg-indigo-100"
                loading={loading}
                hint="User có ít nhất 1 lượt tải"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Đăng ký mới theo ngày</h3>
              <TimeSeriesChart
                series={registrationSeries}
                valueLabel="user"
                colorClass="bg-purple-600"
                loading={loading}
              />
            </div>

            <div className="flex gap-3">
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                <FaUsers /> Quản lý người dùng
              </Link>
            </div>
          </div>
        )}

        {/* === SECURITY TAB === */}
        {tab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="File đã quét"
                value={formatNumber(security?.files_scanned)}
                icon={<FaShieldAlt className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-100"
                loading={loading}
              />
              <StatCard
                label="File sạch"
                value={formatNumber(security?.clean_files)}
                icon={<FaCheckCircle className="w-5 h-5 text-green-600" />}
                iconBg="bg-green-100"
                loading={loading}
                hint={`${cleanRate}% tổng số`}
              />
              <StatCard
                label="File nhiễm / từ chối"
                value={formatNumber(security?.infected_files)}
                icon={<FaExclamationTriangle className="w-5 h-5 text-red-600" />}
                iconBg="bg-red-100"
                loading={loading}
              />
              <StatCard
                label="Dung lượng đã dùng"
                value={storage ? `${storage.used_space_tb.toFixed(2)} TB` : '—'}
                icon={<FaServer className="w-5 h-5 text-gray-600" />}
                iconBg="bg-gray-100"
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Lưu trữ hệ thống</h3>
                {loading || !storage ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Đã dùng</span>
                      <span className="font-semibold">{storage.used_space_tb.toFixed(2)} TB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Còn trống</span>
                      <span className="font-semibold">{storage.available_space_tb.toFixed(2)} TB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tổng dung lượng</span>
                      <span className="font-semibold">{storage.total_capacity_tb.toFixed(2)} TB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Số file</span>
                      <span className="font-semibold">{formatNumber(storage.total_files)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all"
                        style={{ width: `${Math.min(storage.usage_percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {storage.usage_percentage.toFixed(1)}% đã sử dụng
                    </p>
                  </div>
                )}
              </div>

              <BreakdownPanel
                title="Trạng thái bảo mật (theo status)"
                items={statusBreakdown.filter((s) =>
                  ['Approved', 'Active', 'Pending', 'Rejected'].some((k) =>
                    s.name.toLowerCase().includes(k.toLowerCase())
                  )
                )}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminReports;
