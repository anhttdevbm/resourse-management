import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeading from '../components/heading';
import {
  CategoryCatalogService,
  type CatalogRow,
} from '../services/CategoryCatalogService';
import {
  FaSearch,
  FaTimes,
  FaTrash,
  FaPlus,
  FaEdit,
  FaLayerGroup,
  FaBoxOpen,
  FaServer,
  FaFilter,
  FaTags,
  FaCalendarAlt,
  FaRobot,
} from 'react-icons/fa';

type TabKey = 'stage' | 'product' | 'platform';

const TAB_META: Record<
  TabKey,
  { label: string; short: string; icon: React.ReactNode; hint: string }
> = {
  stage: {
    label: 'Giai đoạn tài nguyên',
    short: 'Giai đoạn',
    icon: <FaLayerGroup className="w-4 h-4" />,
    hint: 'Ví dụ: Development, Staging, Production — dùng khi upload và lọc tài nguyên.',
  },
  product: {
    label: 'Loại sản phẩm',
    short: 'Loại SP',
    icon: <FaBoxOpen className="w-4 h-4" />,
    hint: 'Phân loại nghiệp vụ (APK, thư viện, công cụ…) — khớp trường loại sản phẩm trên tài nguyên.',
  },
  platform: {
    label: 'Nền tảng / Platform',
    short: 'Nền tảng',
    icon: <FaServer className="w-4 h-4" />,
    hint: 'Windows, Android, Linux… — dùng chung với form upload và bộ lọc.',
  },
};

const Categories: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('stage');
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [counts, setCounts] = useState({ stage: 0, product: 0, platform: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [modal, setModal] = useState<{
    mode: 'create' | 'edit';
    name: string;
    id?: string;
  } | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const breadcrumb = { title: 'Danh mục chính', route: '/categories' };

  const refreshCounts = useCallback(async () => {
    const [s, p, pl] = await Promise.all([
      CategoryCatalogService.listStages(),
      CategoryCatalogService.listProductTypes(),
      CategoryCatalogService.listPlatforms(),
    ]);
    setCounts({ stage: s.length, product: p.length, platform: pl.length });
    return { s, p, pl };
  }, []);

  const loadTabRows = useCallback(async () => {
    setLoading(true);
    try {
      const cache = await refreshCounts();
      if (tab === 'stage') setRows(cache.s);
      else if (tab === 'product') setRows(cache.p);
      else setRows(cache.pl);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được danh mục.');
    } finally {
      setLoading(false);
    }
  }, [tab, refreshCounts]);

  useEffect(() => {
    loadTabRows();
  }, [loadTabRows]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, searchQuery]);

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

  const submitModal = async () => {
    const name = modal?.name?.trim() ?? '';
    if (name.length < 1) {
      toast.warning('Vui lòng nhập tên.');
      return;
    }
    setActionLoading(true);
    try {
      let ok = false;
      if (tab === 'stage') {
        ok =
          modal?.mode === 'create'
            ? await CategoryCatalogService.createStage(name)
            : await CategoryCatalogService.updateStage(modal!.id!, name);
      } else if (tab === 'product') {
        ok =
          modal?.mode === 'create'
            ? await CategoryCatalogService.createProductType(name)
            : await CategoryCatalogService.updateProductType(modal!.id!, name);
      } else {
        ok =
          modal?.mode === 'create'
            ? await CategoryCatalogService.createPlatform(name)
            : await CategoryCatalogService.updatePlatform(modal!.id!, name);
      }
      if (ok) {
        toast.success(modal?.mode === 'create' ? 'Đã thêm mục.' : 'Đã cập nhật.');
        setModal(null);
        await loadTabRows();
      } else {
        toast.error('Thao tác thất bại. Kiểm tra tên trùng hoặc quyền tài khoản.');
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
      let ok = false;
      if (tab === 'stage') ok = await CategoryCatalogService.deleteStage(deleteId);
      else if (tab === 'product') ok = await CategoryCatalogService.deleteProductType(deleteId);
      else ok = await CategoryCatalogService.deletePlatform(deleteId);

      if (ok) {
        toast.success('Đã xóa mục.');
        setDeleteId(null);
        await loadTabRows();
      } else {
        toast.error('Không xóa được (có thể đang được dùng bởi tài nguyên).');
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi xóa.');
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
            <h2 className="text-xl font-semibold text-gray-900">Danh mục chính</h2>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý giai đoạn, loại sản phẩm và nền tảng — dùng chung cho upload tài nguyên và bộ lọc.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/filters"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FaFilter className="w-4 h-4" />
              Bộ lọc nâng cao
            </Link>
            <Link
              to="/categories/tags"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FaTags className="w-4 h-4" />
              Tags &amp; Labels
            </Link>
            <Link
              to="/categories/auto"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FaRobot className="w-4 h-4" />
              Phân loại tự động
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setTab('stage')}
            className={`text-left bg-white rounded-lg shadow-sm border p-4 transition-colors ${
              tab === 'stage' ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Giai đoạn</p>
                <p className="text-2xl font-semibold text-gray-900">{counts.stage}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <FaLayerGroup className="w-5 h-5" />
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTab('product')}
            className={`text-left bg-white rounded-lg shadow-sm border p-4 transition-colors ${
              tab === 'product' ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Loại sản phẩm</p>
                <p className="text-2xl font-semibold text-green-600">{counts.product}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <FaBoxOpen className="w-5 h-5" />
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTab('platform')}
            className={`text-left bg-white rounded-lg shadow-sm border p-4 transition-colors ${
              tab === 'platform' ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Nền tảng</p>
                <p className="text-2xl font-semibold text-purple-600">{counts.platform}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <FaServer className="w-5 h-5" />
              </div>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(TAB_META) as TabKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors flex items-center gap-2 ${
                tab === k
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {TAB_META[k].icon}
              {TAB_META[k].short}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 mb-4">{TAB_META[tab].hint}</p>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex-1 relative max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên..."
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
            <button
              type="button"
              onClick={() => setModal({ mode: 'create', name: '' })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Thêm {TAB_META[tab].short.toLowerCase()}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-500">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="text-gray-300 mb-3 flex justify-center">{TAB_META[tab].icon}</div>
              <p className="text-gray-600 font-medium">Chưa có dữ liệu</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery
                  ? 'Không khớp bộ lọc. Thử từ khóa khác hoặc xóa ô tìm kiếm.'
                  : 'Nhấn “Thêm” để tạo mục đầu tiên cho danh mục này.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <FaCalendarAlt className="w-3 h-3" />
                        Tạo
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Cập nhật
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(r.updated_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
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
          )}
        </div>
      </div>

      {/* Create / Edit */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {modal.mode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'} — {TAB_META[tab].label}
            </h3>
            <p className="text-xs text-gray-500 mb-4">Tên hiển thị khi chọn trên form tài nguyên và bộ lọc.</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
            <input
              type="text"
              value={modal.name}
              onChange={(e) => setModal({ ...modal, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-6"
              placeholder="Nhập tên..."
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

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa mục?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Chỉ xóa được nếu không còn tài nguyên nào đang tham chiếu. Hành động không hoàn tác.
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

export default Categories;
