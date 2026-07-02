import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/heading';
import {
  UploadHistoryService,
  UploadedResourceRecord,
} from '../services/UploadHistoryService';
import { ResourceService } from '../services/ResourceService';
import {
  FaSearch,
  FaFile,
  FaTimes,
  FaTrash,
  FaCalendarAlt,
  FaBoxOpen,
  FaExternalLinkAlt,
  FaUpload,
  FaCloudUploadAlt,
} from 'react-icons/fa';

type SortField = 'name' | 'version' | 'uploaded_at';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';
type DateRangeFilter = 'all' | '7d' | '30d';

const UploadHistory: React.FC = () => {
  const [history, setHistory] = useState<UploadedResourceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('uploaded_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const loadHistory = async () => {
    const items = await UploadHistoryService.loadHistory();
    setHistory(items);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = [...history];

    if (dateRange !== 'all') {
      const now = Date.now();
      const cutoff =
        dateRange === '7d' ? now - 7 * 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((r) => new Date(r.uploaded_at).getTime() >= cutoff);
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
        case 'uploaded_at':
          aVal = new Date(a.uploaded_at).getTime();
          bVal = new Date(b.uploaded_at).getTime();
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
      thisWeek: history.filter((r) => new Date(r.uploaded_at).getTime() >= weekAgo).length,
      thisMonth: history.filter((r) => new Date(r.uploaded_at).getTime() >= monthAgo).length,
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
    if (sortField !== field) return <span className="text-gray-400 text-xs">↕</span>;
    return sortDirection === 'asc' ? (
      <span className="text-blue-600 text-xs">↑</span>
    ) : (
      <span className="text-blue-600 text-xs">↓</span>
    );
  };

  const handleOpenResource = (id: string) => {
    window.open(`/resources/${id}`, '_blank');
  };

  const handleRemove = async (id: string) => {
    await UploadHistoryService.removeFromHistory(id);
    setRemoveConfirm(null);
    await loadHistory();
  };

  const handleClearAll = async () => {
    await UploadHistoryService.clearHistory();
    setClearConfirm(false);
    await loadHistory();
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

  const resetFilters = () => {
    setSearchQuery('');
    setDateRange('all');
    setCurrentPage(1);
  };

  const breadcrumb = { title: 'Lịch sử upload', route: '/uploads/history' };

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Lịch sử upload</h2>
              <p className="text-sm text-gray-500 mt-1">
                Danh sách các tài nguyên bạn đã upload lên hệ thống
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
              <Link
                to="/resources"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FaBoxOpen className="w-4 h-4" />
                Xem tài nguyên
              </Link>
              {history.length > 0 && (
                <button
                  onClick={() => setClearConfirm(true)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  <FaTrash className="w-4 h-4" />
                  Xóa toàn bộ lịch sử
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tổng đã upload</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaUpload className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tuần này</p>
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
                <p className="text-xs text-gray-500 mb-1">Tháng này</p>
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
                <p className="text-xs text-gray-500 mb-1">Kết quả lọc</p>
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
                placeholder="Tìm theo tên, phiên bản..."
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
              <option value="all">Tất cả thời gian</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bảng
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lưới
              </button>
            </div>
            {(searchQuery || dateRange !== 'all') && (
              <button
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredAndSorted.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <FaBoxOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử upload</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Khi bạn upload tài nguyên tại trang Upload tài nguyên, chúng sẽ xuất hiện tại đây.
              </p>
              <Link
                to="/resources/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <FaExternalLinkAlt className="w-4 h-4" />
                Đi đến Upload tài nguyên
              </Link>
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
                          Tên
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('version')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          Phiên bản
                          {getSortIcon('version')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('uploaded_at')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          Ngày upload
                          {getSortIcon('uploaded_at')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
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
                              <p className="text-sm font-medium text-gray-900">{r.name}</p>
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
                          {formatDate(r.uploaded_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenResource(r.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Xem chi tiết tài nguyên"
                            >
                              <FaExternalLinkAlt className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRemoveConfirm(r.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Xóa khỏi lịch sử"
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
                    <span className="text-sm text-gray-700">Hiển thị:</span>
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
                    <span className="text-sm text-gray-700">/ Tổng {filteredAndSorted.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Trước
                    </button>
                    <span className="text-sm text-gray-700">
                      Trang {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Sau
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
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{r.name}</h3>
                        <p className="text-xs text-gray-500">{r.version}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{formatDate(r.uploaded_at)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenResource(r.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                      Xem chi tiết
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
                    Trước
                  </button>
                  <span className="text-sm text-gray-700">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg text-sm border border-gray-300 disabled:opacity-50"
                  >
                    Sau
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xóa khỏi lịch sử</h3>
              <p className="text-sm text-gray-600 mb-6">
                Bạn có chắc muốn xóa mục này khỏi danh sách lịch sử upload? Tài nguyên trên hệ thống
                vẫn giữ nguyên.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setRemoveConfirm(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleRemove(removeConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm clear all */}
        {clearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xóa toàn bộ lịch sử</h3>
              <p className="text-sm text-gray-600 mb-6">
                Toàn bộ lịch sử upload của bạn sẽ bị xóa khỏi trình duyệt. Bạn có chắc chắn?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setClearConfirm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UploadHistory;

