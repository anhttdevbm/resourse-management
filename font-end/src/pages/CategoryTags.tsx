import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeading from '../components/heading';
import {
  ResourceTagCatalogService,
  type ResourceTagRow,
} from '../services/ResourceTagCatalogService';
import {
  FaSearch,
  FaTimes,
  FaTrash,
  FaPlus,
  FaEdit,
  FaTags,
  FaCalendarAlt,
  FaLayerGroup,
  FaCloudUploadAlt,
  FaFilter,
  FaTag,
  FaRobot,
} from 'react-icons/fa';

type SortField = 'name' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

const CategoryTags: React.FC = () => {
  const [rows, setRows] = useState<ResourceTagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; name: string; id?: string } | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const breadcrumb = { title: 'Tags & Labels', route: '/categories/tags' };

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ResourceTagCatalogService.list();
      setRows(data);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được danh sách thẻ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filteredSorted = useMemo(() => {
    let list = [...rows];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (sortField) {
        case 'name':
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case 'created_at':
          av = new Date(a.created_at).getTime();
          bv = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          av = new Date(a.updated_at).getTime();
          bv = new Date(b.updated_at).getTime();
          break;
        default:
          return 0;
      }
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [rows, searchQuery, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / itemsPerPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSorted.slice(start, start + itemsPerPage);
  }, [filteredSorted, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      filtered: filteredSorted.length,
    }),
    [rows.length, filteredSorted.length]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
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

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const submitModal = async () => {
    const name = modal?.name?.trim() ?? '';
    if (name.length < 1) {
      toast.warning('Vui lòng nhập tên thẻ.');
      return;
    }
    setActionLoading(true);
    try {
      const ok =
        modal?.mode === 'create'
          ? await ResourceTagCatalogService.create(name)
          : await ResourceTagCatalogService.update(modal!.id!, name);
      if (ok) {
        toast.success(modal?.mode === 'create' ? 'Đã tạo thẻ.' : 'Đã cập nhật thẻ.');
        setModal(null);
        await loadRows();
      } else {
        toast.error('Thao tác thất bại. Tên có thể đã tồn tại trong thẻ của bạn.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      const ok = await ResourceTagCatalogService.delete(deleteId);
      if (ok) {
        toast.success('Đã xóa thẻ.');
        setDeleteId(null);
        await loadRows();
      } else {
        toast.error('Không xóa được thẻ.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi khi xóa.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tags &amp; Labels</h2>
            <p className="text-sm text-gray-500 mt-1">
              Thẻ gắn nhãn do <strong>bạn</strong> tạo — dùng khi upload tài nguyên và lọc theo tag. Mỗi tài
              khoản có bộ thẻ riêng; tên thẻ không được trùng trong phạm vi của bạn.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/categories"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FaLayerGroup className="w-4 h-4" />
              Danh mục chính
            </Link>
            <Link
              to="/categories/auto"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FaRobot className="w-4 h-4" />
              Phân loại tự động
            </Link>
            <Link
              to="/resources/upload"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FaCloudUploadAlt className="w-4 h-4" />
              Upload tài nguyên
            </Link>
            <Link
              to="/filters"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FaFilter className="w-4 h-4" />
              Bộ lọc
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tổng thẻ của bạn</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <FaTags className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Kết quả lọc / sắp xếp</p>
                <p className="text-2xl font-semibold text-green-600">{stats.filtered}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <FaSearch className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3 text-sm text-gray-600">
            <FaTag className="w-8 h-8 text-amber-500 shrink-0" />
            <span>
              Gợi ý: đặt tên ngắn, nhất quán (ví dụ <code className="text-xs bg-gray-100 px-1 rounded">urgent</code>
              , <code className="text-xs bg-gray-100 px-1 rounded">team-a</code>) để lọc nhanh trên trang tài
              nguyên.
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex-1 relative max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên thẻ..."
                className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Bảng
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Lưới
                </button>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
                >
                  <FaTimes className="w-3 h-3" />
                  Xóa bộ lọc
                </button>
              )}
              <button
                type="button"
                onClick={() => setModal({ mode: 'create', name: '' })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                Thêm thẻ
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-500">Đang tải...</div>
          ) : filteredSorted.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <FaTags className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Không có thẻ khớp' : 'Chưa có thẻ nào'}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? 'Thử từ khóa khác hoặc xóa ô tìm kiếm.'
                  : 'Tạo thẻ để gắn vào tài nguyên khi upload — giúp nhóm và lọc nhanh hơn.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => setModal({ mode: 'create', name: '' })}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <FaPlus className="w-4 h-4" />
                  Tạo thẻ đầu tiên
                </button>
              )}
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
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          Tên thẻ
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => handleSort('created_at')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          <FaCalendarAlt className="w-3 h-3" />
                          Ngày tạo
                          {getSortIcon('created_at')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => handleSort('updated_at')}
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          Cập nhật
                          {getSortIcon('updated_at')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginated.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                              {r.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(r.updated_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setModal({ mode: 'edit', id: r.id, name: r.name })}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm mr-1"
                          >
                            <FaEdit className="w-3.5 h-3.5" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(r.id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
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
                    <span className="text-sm text-gray-700">/ Tổng {filteredSorted.length}</span>
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
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginated.map((r) => (
                  <div
                    key={r.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-900 text-sm font-semibold border border-amber-200 break-all">
                        {r.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Tạo: {formatDate(r.created_at)}</p>
                    <p className="text-xs text-gray-500 mb-4">Sửa: {formatDate(r.updated_at)}</p>
                    <div className="flex gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'edit', id: r.id, name: r.name })}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <FaEdit className="w-3 h-3" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(r.id)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-xs"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Hiển thị:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg text-sm border border-gray-300 disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <span className="text-sm text-gray-700">
                      {currentPage} / {totalPages}
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {modal.mode === 'create' ? 'Thêm thẻ mới' : 'Đổi tên thẻ'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Tên thẻ chỉ cần là duy nhất trong tài khoản của bạn.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên thẻ</label>
            <input
              type="text"
              value={modal.name}
              onChange={(e) => setModal({ ...modal, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-6"
              placeholder="Ví dụ: production, internal, v1.2"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitModal}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa thẻ?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Thẻ sẽ bị gỡ khỏi hệ thống nếu không còn được dùng. Các tài nguyên đang gắn thẻ có thể cần cập
              nhật lại sau khi xóa.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryTags;
