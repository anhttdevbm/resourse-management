import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeading from '../../components/heading';
import { useAuth } from '../../contexts/AuthContext';
import {
  AdminResourceService,
  AdminResource,
  AdminResourceFilters,
} from '../../services/AdminResourceService';
import {
  ResourceService,
  ResourceUploadOptions,
  ResourceShareInfo,
} from '../../services/ResourceService';
import { DownloadHistoryService } from '../../services/DownloadHistoryService';
import {
  FaSearch,
  FaTimes,
  FaSync,
  FaEdit,
  FaTrash,
  FaEye,
  FaFile,
  FaFileExport,
  FaPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaServer,
  FaDownload,
  FaFilter,
  FaUndo,
  FaUser,
  FaBox,
  FaFolder,
  FaTag,
  FaCheck,
  FaBan,
} from 'react-icons/fa';

type SortField = 'name' | 'version' | 'created_at' | 'status';
type SortDirection = 'asc' | 'desc';
type StatusTab = 'all' | 'active' | 'pending' | 'approved' | 'rejected' | 'deleted';
type ViewMode = 'table' | 'grid';

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-800 border-green-200',
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Approved: 'bg-blue-100 text-blue-800 border-blue-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
};

const AdminResources: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin || hasPermission('manage_resources');

  const [resources, setResources] = useState<AdminResource[]>([]);
  const [options, setOptions] = useState<ResourceUploadOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [apiFilters, setApiFilters] = useState<AdminResourceFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [detailResource, setDetailResource] = useState<AdminResource | null>(null);
  const [detailShares, setDetailShares] = useState<ResourceShareInfo[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);

  const [editResource, setEditResource] = useState<AdminResource | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    version: '',
    stage_id: '',
    status_id: '',
    platform_id: '',
    product_type_id: '',
    repo_id: '',
  });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminResource | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [bulkStatusId, setBulkStatusId] = useState('');
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const breadcrumb = useMemo(
    () => ({ title: 'Tất cả tài nguyên', route: '/admin/resources' }),
    []
  );

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminResourceService.listAll({
        ...apiFilters,
        include_deleted: includeDeleted || statusTab === 'deleted',
      });
      setResources(data);
    } catch {
      setError('Không thể tải danh sách tài nguyên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [apiFilters, includeDeleted, statusTab]);

  const loadOptions = useCallback(async () => {
    const opts = await ResourceService.getResourceUploadOptions();
    setOptions(opts);
  }, []);

  useEffect(() => {
    if (!canManage) {
      navigate('/unauthorized');
      return;
    }
    loadResources();
    loadOptions();
  }, [canManage, navigate, loadResources, loadOptions]);

  const filteredResources = useMemo(() => {
    let list = [...resources];

    if (statusTab === 'active') {
      list = list.filter((r) => !r.is_deleted && r.resource_status?.name === 'Active');
    } else if (statusTab === 'pending') {
      list = list.filter((r) => !r.is_deleted && r.resource_status?.name === 'Pending');
    } else if (statusTab === 'approved') {
      list = list.filter((r) => !r.is_deleted && r.resource_status?.name === 'Approved');
    } else if (statusTab === 'rejected') {
      list = list.filter((r) => !r.is_deleted && r.resource_status?.name === 'Rejected');
    } else if (statusTab === 'deleted') {
      list = list.filter((r) => r.is_deleted);
    } else if (!includeDeleted) {
      list = list.filter((r) => !r.is_deleted);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.version.toLowerCase().includes(q) ||
          r.url.toLowerCase().includes(q) ||
          r.owner?.email?.toLowerCase().includes(q) ||
          r.owner?.name?.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'version':
          aVal = a.version.toLowerCase();
          bVal = b.version.toLowerCase();
          break;
        case 'status':
          aVal = a.resource_status?.name || '';
          bVal = b.resource_status?.name || '';
          break;
        case 'created_at':
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [resources, statusTab, includeDeleted, searchQuery, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredResources.slice(start, start + pageSize);
  }, [filteredResources, page, pageSize]);

  const stats = useMemo(() => {
    const active = resources.filter((r) => !r.is_deleted && r.resource_status?.name === 'Active').length;
    const pending = resources.filter((r) => !r.is_deleted && r.resource_status?.name === 'Pending').length;
    const deleted = resources.filter((r) => r.is_deleted).length;
    const approved = resources.filter((r) => !r.is_deleted && r.resource_status?.name === 'Approved').length;
    return {
      total: resources.filter((r) => !r.is_deleted).length,
      active,
      pending,
      approved,
      deleted,
      filtered: filteredResources.length,
    };
  }, [resources, filteredResources]);

  const formatDate = (iso: string | null | undefined) => {
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

  const getStatusBadge = (resource: AdminResource) => {
    if (resource.is_deleted) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          Đã xóa
        </span>
      );
    }
    const name = resource.resource_status?.name || 'Unknown';
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${
          STATUS_COLORS[name] || 'bg-gray-100 text-gray-800 border-gray-200'
        }`}
      >
        {name}
      </span>
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort className="w-3 h-3 text-gray-400" />;
    return sortDirection === 'asc' ? (
      <FaSortUp className="w-3 h-3 text-blue-600" />
    ) : (
      <FaSortDown className="w-3 h-3 text-blue-600" />
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((r) => r.id)));
    }
  };

  const openDetail = async (resource: AdminResource) => {
    setDetailResource(resource);
    setDetailShares([]);
    setLoadingShares(true);
    try {
      const shares = await AdminResourceService.getShares(resource.id);
      setDetailShares(shares);
    } catch {
      setDetailShares([]);
    } finally {
      setLoadingShares(false);
    }
  };

  const openEdit = (resource: AdminResource) => {
    setEditResource(resource);
    setEditForm({
      name: resource.name,
      version: resource.version,
      stage_id: resource.stage_id || '',
      status_id: resource.status_id || '',
      platform_id: resource.platform_id || '',
      product_type_id: resource.product_type_id || '',
      repo_id: resource.repo_id || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editResource) return;
    if (!editForm.name.trim() || !editForm.version.trim()) {
      toast.error('Tên và phiên bản không được để trống.');
      return;
    }
    setSaving(true);
    const updated = await AdminResourceService.update(editResource.id, {
      name: editForm.name.trim(),
      version: editForm.version.trim(),
      stage_id: editForm.stage_id || undefined,
      status_id: editForm.status_id || undefined,
      platform_id: editForm.platform_id || undefined,
      product_type_id: editForm.product_type_id || undefined,
      repo_id: editForm.repo_id || undefined,
    });
    setSaving(false);
    if (updated) {
      toast.success('Đã cập nhật tài nguyên.');
      setEditResource(null);
      loadResources();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await AdminResourceService.delete(deleteTarget.id);
    setDeleting(false);
    if (ok) {
      toast.success('Đã xóa tài nguyên.');
      setDeleteTarget(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      loadResources();
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    setDeleting(true);
    let success = 0;
    for (const id of selectedIds) {
      const ok = await AdminResourceService.delete(id);
      if (ok) success++;
    }
    setDeleting(false);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());
    toast.success(`Đã xóa ${success}/${count} tài nguyên.`);
    loadResources();
  };

  const handleBulkStatus = async () => {
    if (!bulkStatusId) {
      toast.error('Chọn trạng thái mới.');
      return;
    }
    setBulkUpdating(true);
    let success = 0;
    for (const id of selectedIds) {
      const updated = await AdminResourceService.update(id, { status_id: bulkStatusId });
      if (updated) success++;
    }
    setBulkUpdating(false);
    setBulkStatusOpen(false);
    setBulkStatusId('');
    setSelectedIds(new Set());
    toast.success(`Đã cập nhật trạng thái ${success} tài nguyên.`);
    loadResources();
  };

  const handleRestore = async (resource: AdminResource) => {
    const restored = await AdminResourceService.restore(resource.id);
    if (restored) {
      toast.success('Đã khôi phục tài nguyên.');
      loadResources();
    }
  };

  const handleQuickStatus = async (resource: AdminResource, statusName: string) => {
    const status = options?.statuses.find((s) => s.name === statusName);
    if (!status) {
      toast.error(`Không tìm thấy trạng thái "${statusName}".`);
      return;
    }
    const updated = await AdminResourceService.update(resource.id, { status_id: status.id });
    if (updated) {
      toast.success(`Đã chuyển sang ${statusName}.`);
      loadResources();
    }
  };

  const handleDownload = async (resource: AdminResource) => {
    DownloadHistoryService.addToHistory({
      id: resource.id,
      name: resource.name,
      version: resource.version,
      url: resource.url,
    });
    const filename =
      (resource.url && resource.url.split('/').pop()) ||
      (resource.name ? `${resource.name}.bin` : undefined);
    try {
      await ResourceService.downloadResource(resource.id, filename);
    } catch {
      toast.error('Không thể tải xuống tài nguyên.');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Tên',
      'Phiên bản',
      'URL',
      'Trạng thái',
      'Nền tảng',
      'Loại SP',
      'Kho',
      'Chủ sở hữu',
      'Email',
      'Ngày tạo',
    ];
    const rows = filteredResources.map((r) => [
      r.id,
      r.name,
      r.version,
      r.url,
      r.is_deleted ? 'Đã xóa' : r.resource_status?.name || '—',
      r.resource_platform?.name || '—',
      r.product_type?.name || '—',
      r.package_repo?.name || '—',
      r.owner?.name || '—',
      r.owner?.email || '—',
      formatDate(r.created_at),
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `admin_resources_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setApiFilters({});
    setStatusTab('all');
    setIncludeDeleted(false);
    setPage(1);
  };

  const ModalShell = ({
    title,
    onClose,
    children,
    wide,
  }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    wide?: boolean;
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 w-full max-h-[90vh] overflow-y-auto ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"
          >
            <FaTimes />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';

  const selectClass = `${inputClass} cursor-pointer`;

  if (!canManage) return null;

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              Quản lý tất cả tài nguyên
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Xem, lọc, duyệt, chỉnh sửa và quản lý toàn bộ tài nguyên trong hệ thống
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
            >
              <FaFileExport className="w-4 h-4" />
              Xuất CSV
            </button>
            <button
              type="button"
              onClick={() => navigate('/resources/upload')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Tải lên mới
            </button>
            <button
              type="button"
              onClick={loadResources}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-medium flex items-center gap-2"
            >
              <FaSync className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Tổng', value: stats.total, color: 'text-gray-900 dark:text-slate-100', icon: FaFile },
            { label: 'Hoạt động', value: stats.active, color: 'text-green-600', icon: FaCheckCircle },
            { label: 'Chờ duyệt', value: stats.pending, color: 'text-yellow-600', icon: FaClock },
            { label: 'Đã duyệt', value: stats.approved, color: 'text-blue-600', icon: FaCheck },
            { label: 'Đã xóa', value: stats.deleted, color: 'text-red-600', icon: FaTrash },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm theo tên, phiên bản, URL, chủ sở hữu, ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className={`${inputClass} pl-10`}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600'
              }`}
            >
              <FaFilter className="w-4 h-4" />
              Bộ lọc nâng cao
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-700'
                }`}
              >
                Bảng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-700'
                }`}
              >
                Lưới
              </button>
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className={`${selectClass} w-auto min-w-[120px]`}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / trang
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {(
              [
                ['all', 'Tất cả'],
                ['active', 'Hoạt động'],
                ['pending', 'Chờ duyệt'],
                ['approved', 'Đã duyệt'],
                ['rejected', 'Từ chối'],
                ['deleted', 'Đã xóa'],
              ] as [StatusTab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setStatusTab(tab);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  statusTab === tab
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
            {(searchQuery || Object.keys(apiFilters).length > 0 || statusTab !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
              >
                <FaTimes className="w-3 h-3" />
                Xóa bộ lọc
              </button>
            )}
          </div>

          {showFilters && options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Giai đoạn</label>
                <select
                  value={apiFilters.stage_id || ''}
                  onChange={(e) => {
                    setApiFilters((f) => ({ ...f, stage_id: e.target.value || undefined }));
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="">Tất cả</option>
                  {options.stages.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Trạng thái</label>
                <select
                  value={apiFilters.status_id || ''}
                  onChange={(e) => {
                    setApiFilters((f) => ({ ...f, status_id: e.target.value || undefined }));
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="">Tất cả</option>
                  {options.statuses.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nền tảng</label>
                <select
                  value={apiFilters.platform_id || ''}
                  onChange={(e) => {
                    setApiFilters((f) => ({ ...f, platform_id: e.target.value || undefined }));
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="">Tất cả</option>
                  {options.platforms.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Loại sản phẩm</label>
                <select
                  value={apiFilters.product_type_id || ''}
                  onChange={(e) => {
                    setApiFilters((f) => ({ ...f, product_type_id: e.target.value || undefined }));
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="">Tất cả</option>
                  {options.productTypes.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Kho</label>
                <select
                  value={apiFilters.repo_id || ''}
                  onChange={(e) => {
                    setApiFilters((f) => ({ ...f, repo_id: e.target.value || undefined }));
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="">Tất cả</option>
                  {options.repos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDeleted}
                    onChange={(e) => {
                      setIncludeDeleted(e.target.checked);
                      setPage(1);
                    }}
                    className="rounded border-gray-300"
                  />
                  Bao gồm tài nguyên đã xóa
                </label>
              </div>
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Đã chọn {selectedIds.size} tài nguyên
            </span>
            <button
              type="button"
              onClick={() => setBulkStatusOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Đổi trạng thái hàng loạt
            </button>
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Xóa hàng loạt
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-gray-600 text-sm hover:underline"
            >
              Bỏ chọn
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
              <p className="mt-3 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button type="button" onClick={loadResources} className="text-blue-600 hover:underline text-sm">
                Thử lại
              </button>
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FaFile className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              Không có tài nguyên phù hợp.
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={paginated.length > 0 && selectedIds.size === paginated.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">
                      <button type="button" onClick={() => handleSort('name')} className="flex items-center gap-1">
                        Tài nguyên {getSortIcon('name')}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">
                      <button type="button" onClick={() => handleSort('version')} className="flex items-center gap-1">
                        Phiên bản {getSortIcon('version')}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">
                      <button type="button" onClick={() => handleSort('status')} className="flex items-center gap-1">
                        Trạng thái {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Chủ sở hữu</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Nền tảng</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">
                      <button type="button" onClick={() => handleSort('created_at')} className="flex items-center gap-1">
                        Ngày tạo {getSortIcon('created_at')}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {paginated.map((resource) => (
                    <tr
                      key={resource.id}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 ${
                        resource.is_deleted ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(resource.id)}
                          onChange={() => toggleSelect(resource.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FaFile className="w-4 h-4 text-gray-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-slate-100 truncate max-w-[200px]">
                              {resource.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{resource.url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {resource.version}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(resource)}</td>
                      <td className="px-4 py-3">
                        {resource.owner ? (
                          <div>
                            <p className="text-gray-900 dark:text-slate-100">{resource.owner.name}</p>
                            <p className="text-xs text-gray-500">{resource.owner.email}</p>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <FaServer className="w-3 h-3" />
                          {resource.resource_platform?.name || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(resource.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openDetail(resource)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Chi tiết"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          {!resource.is_deleted && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDownload(resource)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Tải xuống"
                              >
                                <FaDownload className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(resource)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                title="Chỉnh sửa"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              {resource.resource_status?.name === 'Pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStatus(resource, 'Approved')}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                    title="Duyệt"
                                  >
                                    <FaCheck className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStatus(resource, 'Rejected')}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Từ chối"
                                  >
                                    <FaBan className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(resource)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Xóa"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {resource.is_deleted && (
                            <button
                              type="button"
                              onClick={() => handleRestore(resource)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="Khôi phục"
                            >
                              <FaUndo className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginated.map((resource) => (
                <div
                  key={resource.id}
                  className={`border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow ${
                    resource.is_deleted ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <FaFile className="w-8 h-8 text-blue-500" />
                    <input
                      type="checkbox"
                      checked={selectedIds.has(resource.id)}
                      onChange={() => toggleSelect(resource.id)}
                      className="rounded border-gray-300"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 truncate">{resource.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">v{resource.version}</p>
                  <div className="mt-2">{getStatusBadge(resource)}</div>
                  {resource.owner && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <FaUser className="w-3 h-3" />
                      {resource.owner.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatDate(resource.created_at)}</p>
                  <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => openDetail(resource)}
                      className="flex-1 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 rounded hover:bg-gray-200"
                    >
                      Chi tiết
                    </button>
                    {!resource.is_deleted && (
                      <button
                        type="button"
                        onClick={() => openEdit(resource)}
                        className="flex-1 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Sửa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredResources.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredResources.length)} /{' '}
                {filteredResources.length} (tổng hệ thống: {stats.total + stats.deleted})
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-600">
                  Trang {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailResource && (
        <ModalShell title="Chi tiết tài nguyên" onClose={() => setDetailResource(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase">Tên</p>
                <p className="font-medium">{detailResource.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase">Phiên bản</p>
                <p className="font-medium">{detailResource.version}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase">Trạng thái</p>
                <div className="mt-1">{getStatusBadge(detailResource)}</div>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase">Ngày tạo</p>
                <p>{formatDate(detailResource.created_at)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-gray-500 text-xs uppercase">URL</p>
                <p className="break-all text-blue-600">{detailResource.url}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase flex items-center gap-1">
                  <FaServer /> Nền tảng
                </p>
                <p>{detailResource.resource_platform?.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase flex items-center gap-1">
                  <FaBox /> Loại sản phẩm
                </p>
                <p>{detailResource.product_type?.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase flex items-center gap-1">
                  <FaFolder /> Kho
                </p>
                <p>{detailResource.package_repo?.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase">Giai đoạn</p>
                <p>{detailResource.resource_stage?.name || '—'}</p>
              </div>
              {detailResource.owner && (
                <div className="sm:col-span-2">
                  <p className="text-gray-500 text-xs uppercase flex items-center gap-1">
                    <FaUser /> Chủ sở hữu
                  </p>
                  <p>
                    {detailResource.owner.name} ({detailResource.owner.email})
                  </p>
                </div>
              )}
              {detailResource.resource_tags && detailResource.resource_tags.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-gray-500 text-xs uppercase flex items-center gap-1 mb-1">
                    <FaTag /> Thẻ
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {detailResource.resource_tags.map((tag) => (
                      <span key={tag.id} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Chia sẻ</p>
              {loadingShares ? (
                <p className="text-sm text-gray-500">Đang tải...</p>
              ) : detailShares.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa chia sẻ cho ai hoặc không có quyền xem.</p>
              ) : (
                <ul className="space-y-2">
                  {detailShares.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-slate-800 rounded"
                    >
                      <span>
                        {s.name || s.email} {s.can_edit && <span className="text-xs text-blue-600">(sửa)</span>}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(s.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to={`/resources/${detailResource.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Mở trang chi tiết
              </Link>
              {!detailResource.is_deleted && (
                <button
                  type="button"
                  onClick={() => {
                    setDetailResource(null);
                    openEdit(detailResource);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </ModalShell>
      )}

      {editResource && options && (
        <ModalShell title="Chỉnh sửa tài nguyên" onClose={() => setEditResource(null)} wide>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Tên *</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Phiên bản *</label>
              <input
                value={editForm.version}
                onChange={(e) => setEditForm((f) => ({ ...f, version: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Giai đoạn</label>
                <select
                  value={editForm.stage_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, stage_id: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">—</option>
                  {options.stages.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Trạng thái</label>
                <select
                  value={editForm.status_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, status_id: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">—</option>
                  {options.statuses.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Nền tảng</label>
                <select
                  value={editForm.platform_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, platform_id: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">—</option>
                  {options.platforms.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Loại sản phẩm</label>
                <select
                  value={editForm.product_type_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, product_type_id: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">—</option>
                  {options.productTypes.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600 mb-1 block">Kho</label>
                <select
                  value={editForm.repo_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, repo_id: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">—</option>
                  {options.repos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditResource(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {deleteTarget && (
        <ModalShell title="Xác nhận xóa" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc muốn xóa tài nguyên <strong>{deleteTarget.name}</strong>? Hành động này có thể khôi phục sau.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded-lg text-sm">
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </ModalShell>
      )}

      {bulkDeleteOpen && (
        <ModalShell title="Xóa hàng loạt" onClose={() => setBulkDeleteOpen(false)}>
          <p className="text-sm text-gray-600 mb-4">
            Xóa <strong>{selectedIds.size}</strong> tài nguyên đã chọn?
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setBulkDeleteOpen(false)} className="px-4 py-2 border rounded-lg text-sm">
              Hủy
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {deleting ? 'Đang xóa...' : 'Xóa tất cả'}
            </button>
          </div>
        </ModalShell>
      )}

      {bulkStatusOpen && options && (
        <ModalShell title="Đổi trạng thái hàng loạt" onClose={() => setBulkStatusOpen(false)}>
          <p className="text-sm text-gray-600 mb-3">Chọn trạng thái mới cho {selectedIds.size} tài nguyên:</p>
          <select
            value={bulkStatusId}
            onChange={(e) => setBulkStatusId(e.target.value)}
            className={selectClass}
          >
            <option value="">— Chọn trạng thái —</option>
            {options.statuses.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setBulkStatusOpen(false)} className="px-4 py-2 border rounded-lg text-sm">
              Hủy
            </button>
            <button
              type="button"
              onClick={handleBulkStatus}
              disabled={bulkUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {bulkUpdating ? 'Đang cập nhật...' : 'Áp dụng'}
            </button>
          </div>
        </ModalShell>
      )}
    </>
  );
};

export default AdminResources;
