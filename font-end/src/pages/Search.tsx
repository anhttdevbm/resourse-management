import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeading from '../components/heading';
import {
  SearchService,
  type AdvancedSearchFilters,
  type SearchResource,
  type SearchUser,
} from '../services/SearchService';
import { SearchHistoryService } from '../services/SearchHistoryService';
import {
  ResourceService,
  type ResourceUploadOptions,
} from '../services/ResourceService';
import {
  FaSearch,
  FaTimes,
  FaFile,
  FaUser,
  FaExternalLinkAlt,
  FaHistory,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

type Tab = 'all' | 'resources' | 'users';

const emptyFilters: AdvancedSearchFilters = {
  version: '',
  stage_id: '',
  status_id: '',
  platform_id: '',
  product_type_id: '',
  repo_id: '',
  tag_id: '',
};

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<AdvancedSearchFilters>({ ...emptyFilters });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<ResourceUploadOptions | null>(null);
  const [resources, setResources] = useState<SearchResource[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const breadcrumb = { title: 'Tìm kiếm nâng cao', route: '/search' };

  const activeFilterPayload = useMemo(() => {
    const out: AdvancedSearchFilters = {};
    (Object.keys(emptyFilters) as (keyof AdvancedSearchFilters)[]).forEach((key) => {
      const v = filters[key];
      if (typeof v === 'string' && v.trim()) out[key] = v.trim();
    });
    return out;
  }, [filters]);

  const hasAdvancedFilters = Object.keys(activeFilterPayload).length > 0;
  const hasQuery = query.trim().length > 0;
  const canSearch = query.trim().length >= 2 || hasAdvancedFilters;
  const hasResults = resources.length > 0 || users.length > 0;

  const visibleResources = useMemo(
    () => (activeTab === 'users' ? [] : resources),
    [activeTab, resources]
  );
  const visibleUsers = useMemo(
    () => (activeTab === 'resources' ? [] : users),
    [activeTab, users]
  );

  useEffect(() => {
    ResourceService.getResourceUploadOptions()
      .then(setOptions)
      .catch(() => setOptions(null));
  }, []);

  const handleSearch = async (
    e?: React.FormEvent,
    optionsArg?: { saveHistory?: boolean }
  ) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (q.length > 0 && q.length < 2 && !hasAdvancedFilters) {
      setResources([]);
      setUsers([]);
      setError('Nhập ít nhất 2 ký tự, hoặc chọn bộ lọc nâng cao.');
      return;
    }
    if (!canSearch) {
      setResources([]);
      setUsers([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await SearchService.searchAll(q, activeFilterPayload);
      setResources(result.resources || []);
      setUsers(result.users || []);
      if (!result.resources.length && !result.users.length) {
        setError('Không tìm thấy kết quả nào phù hợp.');
      }
      if (optionsArg?.saveHistory && q.length >= 2) {
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

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam && qParam.trim().length >= 2) {
      setQuery(qParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canSearch) {
        handleSearch();
      } else if (!hasQuery && !hasAdvancedFilters) {
        setResources([]);
        setUsers([]);
        setError(null);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters]);

  const handleClear = () => {
    setQuery('');
    setFilters({ ...emptyFilters });
    setResources([]);
    setUsers([]);
    setError(null);
  };

  const setFilterField = (key: keyof AdvancedSearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <form
            onSubmit={(e) => handleSearch(e, { saveHistory: true })}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên tài nguyên, phiên bản hoặc người dùng..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
                {(hasQuery || hasAdvancedFilters) && (
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
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 border ${
                    showAdvanced || hasAdvancedFilters
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                  }`}
                >
                  <FaFilter className="w-4 h-4" />
                  Bộ lọc
                  {hasAdvancedFilters ? ` (${Object.keys(activeFilterPayload).length})` : ''}
                  {showAdvanced ? (
                    <FaChevronUp className="w-3 h-3" />
                  ) : (
                    <FaChevronDown className="w-3 h-3" />
                  )}
                </button>
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
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Phiên bản
                  </label>
                  <input
                    type="text"
                    value={filters.version || ''}
                    onChange={(e) => setFilterField('version', e.target.value)}
                    placeholder="Ví dụ: 1.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Stage
                  </label>
                  <select
                    value={filters.stage_id || ''}
                    onChange={(e) => setFilterField('stage_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {options?.stages.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={filters.status_id || ''}
                    onChange={(e) => setFilterField('status_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {options?.statuses.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Platform
                  </label>
                  <select
                    value={filters.platform_id || ''}
                    onChange={(e) => setFilterField('platform_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {options?.platforms.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Loại sản phẩm
                  </label>
                  <select
                    value={filters.product_type_id || ''}
                    onChange={(e) => setFilterField('product_type_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {options?.productTypes.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Kho
                  </label>
                  <select
                    value={filters.repo_id || ''}
                    onChange={(e) => setFilterField('repo_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {options?.repos.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Tag
                  </label>
                  <select
                    value={filters.tag_id || ''}
                    onChange={(e) => setFilterField('tag_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {options?.tags.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </form>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Mẹo:</span>
              <span>
                Ô tìm kiếm khớp tên hoặc phiên bản. Dùng &quot;Bộ lọc&quot; để lọc stage / trạng thái
                / platform / tag…
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Tổng kết quả:</span>
              <span className="font-semibold text-gray-700">
                {resources.length + users.length}
              </span>
            </div>
          </div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="py-12 px-4 text-center text-sm text-gray-500">Đang tìm kiếm...</div>
            ) : !canSearch ? (
              <div className="py-12 px-4 text-center text-sm text-gray-500">
                Nhập từ khóa hoặc chọn bộ lọc để bắt đầu tìm kiếm.
              </div>
            ) : error && !hasResults ? (
              <div className="py-12 px-4 text-center text-sm text-red-600">{error}</div>
            ) : !hasResults ? (
              <div className="py-12 px-4 text-center text-sm text-gray-500">
                Không tìm thấy kết quả nào phù hợp.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {visibleResources.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <FaFile className="w-4 h-4 text-blue-600" />
                        Tài nguyên
                      </h2>
                      <span className="text-xs text-gray-500">{visibleResources.length} kết quả</span>
                    </div>
                    <ul className="space-y-2">
                      {visibleResources.map((r) => (
                        <li
                          key={r.id}
                          className="px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between gap-3 cursor-pointer"
                          onClick={() => navigate(`/resources/${r.id}`)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                              <FaFile className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {[
                                  r.version ? `v${r.version}` : null,
                                  r.resource_platform?.name,
                                  r.resource_status?.name,
                                  r.resource_stage?.name,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || 'Không rõ metadata'}
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

                {visibleUsers.length > 0 && (
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <FaUser className="w-4 h-4 text-green-600" />
                        Người dùng
                      </h2>
                      <span className="text-xs text-gray-500">{visibleUsers.length} kết quả</span>
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
                              {u.email && <p className="text-xs text-gray-500">{u.email}</p>}
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
              Ô tìm kiếm khớp tên hoặc phiên bản. Bộ lọc nâng cao (stage, trạng thái, platform, tag…)
              gửi đúng tham số lên API.
            </p>
            <Link to="/filters" className="text-xs text-blue-600 hover:underline inline-block">
              Mở trang Bộ lọc nâng cao →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchPage;
