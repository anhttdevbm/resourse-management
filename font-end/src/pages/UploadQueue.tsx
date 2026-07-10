import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/heading';
import { FaBoxOpen, FaClock, FaCloudUploadAlt, FaFilter, FaSyncAlt } from 'react-icons/fa';
import { ProcessingQueueApi, ProcessingQueueJob, ProcessingQueueStats } from '../services/ProcessingQueueApi';

const statusLabel: Record<string, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
};

const statusClass: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const UploadQueue: React.FC = () => {
  const breadcrumb = { title: 'Queue xử lý', route: '/uploads/queue' };
  const [items, setItems] = useState<ProcessingQueueJob[]>([]);
  const [stats, setStats] = useState<ProcessingQueueStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ProcessingQueueApi.list(100);
      setItems(data.items);
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  const filtered =
    statusFilter === 'all' ? items : items.filter((j) => j.status === statusFilter);

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Queue phân loại tự động</h2>
              <p className="text-sm text-gray-500 mt-1">
                Hàng đợi Redis áp dụng quy tắc auto classification sau khi upload.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                to="/resources/upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FaCloudUploadAlt className="w-4 h-4" />
                Upload mới
              </Link>
              <button
                type="button"
                onClick={() => load()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FaSyncAlt className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tổng trong queue</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaClock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Đang xử lý</p>
                <p className="text-2xl font-semibold text-green-600">{stats.processing}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <FaClock className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Chờ xử lý</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaClock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Thất bại</p>
                <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <FaClock className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FaFilter className="w-4 h-4 text-gray-400" />
              <span>Bộ lọc queue</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-md px-2 py-1"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn tất</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>

          {error && (
            <div className="px-4 py-3 text-sm text-red-600 border-b border-red-50 bg-red-50">{error}</div>
          )}

          {loading && items.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <FaBoxOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có job nào trong queue</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Sau khi upload tài nguyên, job phân loại sẽ xuất hiện tại đây.
              </p>
              <Link
                to="/resources/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <FaCloudUploadAlt className="w-4 h-4" />
                Đi đến Upload tài nguyên
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tài nguyên</th>
                    <th className="px-4 py-3 font-medium">File</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium">Kết quả</th>
                    <th className="px-4 py-3 font-medium">Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((job) => (
                    <tr key={job.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{job.resource_name || '—'}</div>
                        <div className="text-xs text-gray-400 font-mono">{job.resource_id}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{job.filename || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusClass[job.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {statusLabel[job.status] || job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {job.status === 'failed' && (job.error || 'Lỗi không xác định')}
                        {job.status === 'completed' &&
                          (job.result?.matched_rule_title
                            ? `Rule: ${job.result.matched_rule_title}`
                            : 'Không khớp rule')}
                        {(job.status === 'pending' || job.status === 'processing') && '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {job.updated_at ? new Date(job.updated_at).toLocaleString() : '—'}
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

export default UploadQueue;
