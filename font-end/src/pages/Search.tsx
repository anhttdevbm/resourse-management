import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeading from '../components/heading';
import { SearchService, type SearchResource, type SearchUser } from '../services/SearchService';
import { SearchHistoryService } from '../services/SearchHistoryService';
import { FaSearch, FaTimes, FaFile, FaUser, FaExternalLinkAlt, FaHistory } from 'react-icons/fa';

type Tab = 'all' | 'resources' | 'users';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [resources, setResources] = useState<SearchResource[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const breadcrumb = { title: 'Tìm kiếm nâng cao', route: '/search' };

  const hasQuery = query.trim().length > 0;
  const hasResults = resources.length > 0 || users.length > 0;

  const visibleResources = useMemo(
    () => (activeTab === 'users' ? [] : resources),
    [activeTab, resources]
  );
  const visibleUsers = useMemo(
    () => (activeTab === 'resources' ? [] : users),
    [activeTab, users]
  );

  const handleSearch = async (
    e?: React.FormEvent,
    options?: { saveHistory?: boolean }
  ) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setResources([]);
      setUsers([]);
      setError(q ? 'Nhập ít nhất 2 ký tự để tìm kiếm.' : null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await SearchService.searchAll(q);
      setResources(result.resources || []);
      setUsers(result.users || []);
      if (!result.resources.length && !result.users.length) {
        setError('Không tìm thấy kết quả nào phù hợp.');
      }
      if (options?.saveHistory) {
        SearchHistoryService.addToHistory({
          query: q,
          resource_count: (result.resources || []).length,
          user_count: (result.users || []).length,
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  /** Đọc ?q= từ URL (ví dụ từ trang Lịch sử tìm kiếm) */
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam && qParam.trim().length >= 2) {
      setQuery(qParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch();
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResources([]);
    setUsers([]);
    setError(null);
  };

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        {/* Search header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <form
            onSubmit={(e) => handleSearch(e, { saveHistory: true })}
            className="flex flex-col md:flex-row gap-4 items-stretch"
          >
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên tài nguyên, phiên bản hoặc người dùng..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              {hasQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <FaSearch className="w-4 h-4" />
                Tìm kiếm
              </button>
              <Link
                to="/search/history"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <FaHistory className="w-4 h-4" />
                Lịch sử
              </Link>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Mẹo:</span>
              <span>Nhập ít nhất 2 ký tự để xem gợi ý. Nhấn &quot;Tìm kiếm&quot; để lưu vào lịch sử.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Tổng kết quả:</span>
              <span className="font-semibold text-gray-700">
                {resources.length + users.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Tất cả ({resources.length + users.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
              activeTab === 'resources'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Tài nguyên ({resources.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Người dùng ({users.length})
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main results */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="py-12 px-4 text-center text-sm text-gray-500">
                Đang tìm kiếm...
              </div>
            ) : !hasQuery ? (
              <div className="py-12 px-4 text-center text-sm text-gray-500">
                Nhập từ khóa để bắt đầu tìm kiếm.
              </div>
            ) : error && !hasResults ? (
              <div className="py-12 px-4 text-center text-sm text-red-600">{error}</div>
            ) : !hasResults ? (
              <div className="py-12 px-4 text-center text-sm text-gray-500">
                Không tìm thấy kết quả nào phù hợp với từ khóa đã nhập.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Resources section */}
                {visibleResources.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <FaFile className="w-4 h-4 text-blue-600" />
                        Tài nguyên
                      </h2>
                      <span className="text-xs text-gray-500">
                        {visibleResources.length} kết quả
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {visibleResources.map((r) => (
                        <li
                          key={r.id}
                          className="px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between gap-3 cursor-pointer"
                          onClick={() => navigate(`/resources/${r.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center">
                              <FaFile className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{r.name}</p>
                              <p className="text-xs text-gray-500">
                                {r.version ? `Phiên bản ${r.version}` : 'Không rõ phiên bản'}
                              </p>
                            </div>
                          </div>
                          {r.created_at && (
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {new Date(r.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Users section */}
                {visibleUsers.length > 0 && (
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <FaUser className="w-4 h-4 text-green-600" />
                        Người dùng
                      </h2>
                      <span className="text-xs text-gray-500">
                        {visibleUsers.length} kết quả
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {visibleUsers.map((u) => (
                        <li
                          key={u.id}
                          className="px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between gap-3 cursor-pointer"
                          onClick={() => navigate('/user/index')}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-green-600 text-sm font-semibold">
                                {u.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{u.name}</p>
                              {u.email && (
                                <p className="text-xs text-gray-500">{u.email}</p>
                              )}
                            </div>
                          </div>
                          <FaExternalLinkAlt className="w-3 h-3 text-gray-400" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side panel: summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Tóm tắt kết quả</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FaFile className="w-3 h-3 text-blue-600" />
                  Tài nguyên
                </span>
                <span className="font-semibold">{resources.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FaUser className="w-3 h-3 text-green-600" />
                  Người dùng
                </span>
                <span className="font-semibold">{users.length}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Trang tìm kiếm này giúp bạn nhanh chóng tìm lại tài nguyên và người dùng trong hệ
              thống. Bạn cũng có thể sử dụng hộp tìm kiếm nhanh ở góc trên bên phải.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchPage;

