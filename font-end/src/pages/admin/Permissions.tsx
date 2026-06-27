import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeading from '../../components/heading';
import { useAuth } from '../../contexts/AuthContext';
import {
  AdminPermissionService,
  PermissionRecord,
  SUGGESTED_PERMISSIONS,
} from '../../services/AdminPermissionService';
import { AdminUserService, AdminUserRecord } from '../../services/AdminUserService';
import {
  FaSearch,
  FaTimes,
  FaSync,
  FaEdit,
  FaTrash,
  FaShieldAlt,
  FaPlus,
  FaUsers,
  FaKey,
  FaLock,
} from 'react-icons/fa';

type FilterType = 'all' | 'protected' | 'custom' | 'in_use' | 'unused';

const AdminPermissions: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editPerm, setEditPerm] = useState<PermissionRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PermissionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [detailPerm, setDetailPerm] = useState<PermissionRecord | null>(null);
  const [detailUsers, setDetailUsers] = useState<AdminUserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [assignPerm, setAssignPerm] = useState<PermissionRecord | null>(null);
  const [allUsers, setAllUsers] = useState<AdminUserRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const breadcrumb = useMemo(
    () => ({ title: 'Phân quyền', route: '/admin/permissions' }),
    []
  );

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminPermissionService.listPermissions();
      setPermissions(data.permissions);
    } catch {
      setError('Không thể tải danh sách quyền. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/unauthorized');
      return;
    }
    loadPermissions();
  }, [isAdmin, navigate, loadPermissions]);

  const stats = useMemo(() => {
    const protectedCount = permissions.filter((p) => p.is_protected).length;
    const inUse = permissions.filter((p) => p.user_count > 0).length;
    return {
      total: permissions.length,
      protectedCount,
      inUse,
      unused: permissions.length - inUse,
    };
  }, [permissions]);

  const filtered = useMemo(() => {
    let list = [...permissions];
    if (filter === 'protected') list = list.filter((p) => p.is_protected);
    if (filter === 'custom') list = list.filter((p) => !p.is_protected);
    if (filter === 'in_use') list = list.filter((p) => p.user_count > 0);
    if (filter === 'unused') list = list.filter((p) => p.user_count === 0);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    }
    return list;
  }, [permissions, filter, searchQuery]);

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

  const openUsers = async (perm: PermissionRecord) => {
    setDetailPerm(perm);
    setDetailUsers([]);
    setLoadingUsers(true);
    const users = await AdminPermissionService.listPermissionUsers(perm.id);
    setDetailUsers(users);
    setLoadingUsers(false);
  };

  const openAssign = async (perm: PermissionRecord) => {
    setAssignPerm(perm);
    setSelectedUserId('');
    const data = await AdminUserService.listUsers(1, 100);
    setAllUsers(data.users);
  };

  const handleCreate = async () => {
    const name = createName.trim();
    if (!name) {
      toast.error('Vui lòng nhập tên quyền.');
      return;
    }
    setCreating(true);
    const created = await AdminPermissionService.createPermission(name);
    setCreating(false);
    if (created) {
      toast.success('Đã tạo quyền mới.');
      setShowCreate(false);
      setCreateName('');
      loadPermissions();
    }
  };

  const handleSaveEdit = async () => {
    if (!editPerm) return;
    const name = editName.trim();
    if (!name) {
      toast.error('Tên quyền không được để trống.');
      return;
    }
    setSaving(true);
    const updated = await AdminPermissionService.updatePermission(editPerm.id, name);
    setSaving(false);
    if (updated) {
      toast.success('Đã cập nhật quyền.');
      setEditPerm(null);
      loadPermissions();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.user_count > 0) {
      toast.error('Không thể xóa quyền đang được gán cho người dùng.');
      return;
    }
    setDeleting(true);
    const ok = await AdminPermissionService.deletePermission(deleteTarget.id);
    setDeleting(false);
    if (ok) {
      toast.success('Đã xóa quyền.');
      setDeleteTarget(null);
      loadPermissions();
    }
  };

  const handleAssign = async () => {
    if (!assignPerm || !selectedUserId) return;
    setAssigning(true);
    const updated = await AdminUserService.grantPermission(selectedUserId, assignPerm.name);
    setAssigning(false);
    if (updated) {
      toast.success(`Đã gán quyền "${assignPerm.name}" cho người dùng.`);
      setAssignPerm(null);
      loadPermissions();
    }
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
          wide ? 'max-w-2xl' : 'max-w-md'
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

  if (!isAdmin) return null;

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Phân quyền hệ thống</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Quản lý danh mục quyền, xem người dùng được gán và cấp quyền
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Thêm quyền
            </button>
            <Link
              to="/admin/users"
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-medium flex items-center gap-2"
            >
              <FaUsers className="w-4 h-4" />
              Quản lý người dùng
            </Link>
            <button
              type="button"
              onClick={loadPermissions}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-medium flex items-center gap-2"
            >
              <FaSync className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Tổng quyền</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Đang sử dụng</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inUse}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Chưa gán</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.unused}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Quyền hệ thống</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.protectedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm theo tên quyền hoặc ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(
                [
                  ['all', 'Tất cả'],
                  ['in_use', 'Đang dùng'],
                  ['unused', 'Chưa gán'],
                  ['protected', 'Hệ thống'],
                  ['custom', 'Tùy chỉnh'],
                ] as [FilterType, string][]
              ).map(([f, label]) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button type="button" onClick={loadPermissions} className="text-blue-600 hover:underline text-sm">
                Thử lại
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Không có quyền phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Tên quyền</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Người dùng</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Loại</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Ngày tạo</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FaKey className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-slate-100 font-mono">{p.name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[200px]">{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openUsers(p)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 hover:bg-blue-100"
                        >
                          <FaUsers className="w-3 h-3" />
                          {p.user_count} người dùng
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {p.is_protected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                            <FaLock className="w-3 h-3" />
                            Hệ thống
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300">
                            Tùy chỉnh
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <button
                            type="button"
                            title="Gán cho người dùng"
                            onClick={() => openAssign(p)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-600 dark:hover:bg-slate-800"
                          >
                            <FaShieldAlt className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Chỉnh sửa"
                            onClick={() => {
                              setEditPerm(p);
                              setEditName(p.name);
                            }}
                            disabled={p.is_protected}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Xóa"
                            onClick={() => setDeleteTarget(p)}
                            disabled={p.is_protected || p.user_count > 0}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
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
          )}
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Gợi ý quyền thường dùng</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PERMISSIONS.filter((s) => !permissions.some((p) => p.name === s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setCreateName(s);
                  setShowCreate(true);
                }}
                className="px-2 py-1 text-xs rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 hover:bg-blue-100"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showCreate && (
        <ModalShell title="Thêm quyền mới" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tên quyền</label>
              <input
                className={inputClass}
                placeholder="vd: view_resources"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                list="perm-suggestions"
              />
              <datalist id="perm-suggestions">
                {SUGGESTED_PERMISSIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <button
              type="button"
              disabled={creating}
              onClick={handleCreate}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60"
            >
              {creating ? 'Đang tạo...' : 'Tạo quyền'}
            </button>
          </div>
        </ModalShell>
      )}

      {editPerm && (
        <ModalShell title="Chỉnh sửa quyền" onClose={() => setEditPerm(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tên quyền</label>
              <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveEdit}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </ModalShell>
      )}

      {deleteTarget && (
        <ModalShell title="Xác nhận xóa" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            Xóa quyền <strong className="font-mono">{deleteTarget.name}</strong>?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-60"
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </ModalShell>
      )}

      {detailPerm && (
        <ModalShell title={`Người dùng có quyền: ${detailPerm.name}`} onClose={() => setDetailPerm(null)} wide>
          {loadingUsers ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : detailUsers.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có người dùng nào được gán quyền này.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {detailUsers.map((u) => (
                <li key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                  {u.is_admin && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Admin</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              setDetailPerm(null);
              openAssign(detailPerm);
            }}
            className="mt-4 w-full py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50"
          >
            Gán thêm người dùng
          </button>
        </ModalShell>
      )}

      {assignPerm && (
        <ModalShell title={`Gán quyền: ${assignPerm.name}`} onClose={() => setAssignPerm(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Chọn người dùng
              </label>
              <select
                className={inputClass}
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">— Chọn người dùng —</option>
                {allUsers
                  .filter((u) => !u.permissions.includes(assignPerm.name))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="button"
              disabled={assigning || !selectedUserId}
              onClick={handleAssign}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60"
            >
              {assigning ? 'Đang gán...' : 'Gán quyền'}
            </button>
          </div>
        </ModalShell>
      )}
    </>
  );
};

export default AdminPermissions;
