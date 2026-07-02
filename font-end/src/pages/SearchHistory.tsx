import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeading from '../components/heading';
import {
  SearchHistoryService,
  type SearchHistoryRecord,
} from '../services/SearchHistoryService';
import {
  FaSearch,
  FaTimes,
  FaTrash,
  FaCalendarAlt,
  FaRedo,
  FaFile,
  FaUser,
  FaExternalLinkAlt,
} from 'react-icons/fa';

type SortField = 'query' | 'searched_at' | 'total';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';
type DateRangeFilter = 'all' | '7d' | '30d';

const SearchHistory: React.FC = () => {
  const [history, setHistory] = useState<SearchHistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('searched_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const navigate = useNavigate();

  const loadHistory = async () => {
    const items = await SearchHistoryService.loadHistory();
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
      list = list.filter((r) => new Date(r.searched_at).getTime() >= cutoff);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.query.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case 'query':
          aVal = a.query.toLowerCase();
          bVal = b.query.toLowerCase();
          break;
        case 'searched_at':
          aVal = new Date(a.searched_at).getTime();
          bVal = new Date(b.searched_at).getTime();
          break;
        case 'total':
          aVal = a.resource_count + a.user_count;
          bVal = b.resource_count + b.user_count;
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

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage) || 1;
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
      thisWeek: history.filter((r) => new Date(r.searched_at).getTime() >= weekAgo).length,
      thisMonth: history.filter((r) => new Date(r.searched_at).getTime() >= monthAgo).length,
      filtered: filteredAndSorted.length,
    };
  }, [history, filteredAndSorted]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'searched_at' ? 'desc' : 'asc');
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

  const handleRepeatSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleRemove = async (id: string) => {
    await SearchHistoryService.removeFromHistory(id);
    setRemoveConfirm(null);
    await loadHistory();
  };

  const handleClearAll = async () => {
    await SearchHistoryService.clearHistory();
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

  const breadcrumb = { title: 'Lịch sử tìm kiếm', route: '/search/history' };

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Lịch sử tìm kiếm</h2>
              <p className="text-sm text-gray-500 mt-1">
                Các từ khóa bạn đã tìm trên trang Tìm kiếm hoặc hộp tìm nhanh (lưu trên trình duyệt)
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                to="/search"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FaSearch className="w-4 h-4" />
                Tìm kiếm mới
              </Link>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setClearConfirm(true)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-2"
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
                <p className="text-xs text-gray-500 mb-1">Tổng từ khóa</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaSearch className="w-5 h-5 text-blue-600" />
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
                placeholder="Lọc theo từ khóa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bảng
              </button>
              <button
                type="button"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredAndSorted.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <FaSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử tìm kiếm</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Khi bạn tìm kiếm từ trang Tìm kiếm nâng cao hoặc ô tìm nhanh trên thanh menu, từ khóa sẽ
                được lưu tại đây.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <FaExternalLinkAlt className="w-4 h-4" />
                Đi đến Tìm kiếm
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
                          type="button"
                          onClick={() => handleSort('query')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          Từ khóa
                          {getSortIcon('query')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-2">
                          <FaFile className="w-3 h-3" />
                          Tài nguyên
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-2">
                          <FaUser className="w-3 h-3" />
                          Người dùng
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => handleSort('total')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          Tổng
                          {getSortIcon('total')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => handleSort('searched_at')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          Thời gian
                          {getSortIcon('searched_at')}
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
                          <p className="text-sm font-medium text-gray-900">{r.query}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{r.resource_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{r.user_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {r.resource_count + r.user_count}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(r.searched_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRepeatSearch(r.query)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Tìm lại"
                            >
                              <FaRedo className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
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
                      type="button"
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
                      type="button"
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
                    <div className="flex items-center gap-2 min-w-0">
                      <FaSearch className="w-5 h-5 text-blue-600 shrink-0" />
                      <h3 className="text-sm font-semibold text-gray-900 truncate" title={r.query}>
                        {r.query}
                      </h3>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <FaFile className="w-3 h-3 text-blue-500" /> {r.resource_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaUser className="w-3 h-3 text-green-500" /> {r.user_count}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{formatDate(r.searched_at)}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRepeatSearch(r.query)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <FaRedo className="w-3 h-3" />
                      Tìm lại
                    </button>
                    <button
                      type="button"
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
                    type="button"
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
                    type="button"
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

        {removeConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xóa khỏi lịch sử</h3>
              <p className="text-sm text-gray-600 mb-6">
                Bạn có chắc muốn xóa mục này khỏi lịch sử tìm kiếm? Thao tác không ảnh hưởng dữ liệu
                trên hệ thống.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRemoveConfirm(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(removeConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {clearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xóa toàn bộ lịch sử</h3>
              <p className="text-sm text-gray-600 mb-6">
                Toàn bộ lịch sử tìm kiếm sẽ bị xóa khỏi trình duyệt. Bạn có chắc chắn?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setClearConfirm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="button"
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

export default SearchHistory;
