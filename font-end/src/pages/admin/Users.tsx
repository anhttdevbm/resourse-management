import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeading from '../../components/heading';
import { useAuth } from '../../contexts/AuthContext';
import {
  AdminUserService,
  AdminUserRecord,
  CreateAdminUserPayload,
} from '../../services/AdminUserService';
import {
  FaSearch,
  FaTimes,
  FaUserPlus,
  FaSync,
  FaEdit,
  FaTrash,
  FaShieldAlt,
  FaUser,
  FaKey,
  FaEye,
  FaPlus,
  FaLock,
  FaUnlock,
} from 'react-icons/fa';

type RoleFilter = 'all' | 'admin' | 'user';

const ADMIN_PERMISSION = 'AllAccess';

const emptyCreateForm: CreateAdminUserPayload = {
  name: '',
  email: '',
  password: '',
};

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [permissionCatalog, setPermissionCatalog] = useState<string[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminUserPayload>(emptyCreateForm);
  const [creating, setCreating] = useState(false);

  const [editUser, setEditUser] = useState<AdminUserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [detailUser, setDetailUser] = useState<AdminUserRecord | null>(null);
  const [newPermission, setNewPermission] = useState('');
  const [permBusy, setPermBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lockBusyId, setLockBusyId] = useState<string | null>(null);

  const breadcrumb = useMemo(
    () => ({ title: 'Quản lý người dùng', route: '/admin/users' }),
    []
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminUserService.listUsers(page, pageSize);
      setUsers(data.users);
      setTotal(data.total);
      setAdminCount(data.admin_count ?? data.users.filter((u) => u.is_admin).length);
    } catch {
      setError('Không thể tải danh sách người dùng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const loadPermissions = useCallback(async () => {
    const names = await AdminUserService.listPermissionNames();
    setPermissionCatalog(names);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/unauthorized');
      return;
    }
    loadUsers();
    loadPermissions();
  }, [isAdmin, navigate, loadUsers, loadPermissions]);

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (roleFilter === 'admin') list = list.filter((u) => u.is_admin);
    if (roleFilter === 'user') list = list.filter((u) => !u.is_admin);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, roleFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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

  const openEdit = (u: AdminUserRecord) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword('');
  };

  const openDetail = async (u: AdminUserRecord) => {
    const fresh = await AdminUserService.getUserById(u.id);
    setDetailUser(fresh ?? u);
    setNewPermission('');
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || createForm.password.length < 6) {
      toast.error('Vui lòng nhập họ tên, email và mật khẩu (tối thiểu 6 ký tự).');
      return;
    }
    setCreating(true);
    const created = await AdminUserService.createUser({
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      password: createForm.password,
    });
    setCreating(false);
    if (created) {
      toast.success('Đã tạo người dùng mới.');
      setShowCreate(false);
      setCreateForm(emptyCreateForm);
      loadUsers();
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    if (!editName.trim() || !editEmail.trim()) {
      toast.error('Họ tên và email không được để trống.');
      return;
    }
    setSaving(true);
    const payload: { name: string; email: string; password?: string } = {
      name: editName.trim(),
      email: editEmail.trim(),
    };
    if (editPassword.trim()) payload.password = editPassword;
    const updated = await AdminUserService.updateUser(editUser.id, payload);
    setSaving(false);
    if (updated) {
      toast.success('Đã cập nhật người dùng.');
      setEditUser(null);
      loadUsers();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === currentUser?.id) {
      toast.error('Không thể xóa tài khoản đang đăng nhập.');
      return;
    }
    setDeleting(true);
    const ok = await AdminUserService.deleteUser(deleteTarget.id);
    setDeleting(false);
    if (ok) {
      toast.success('Đã xóa người dùng.');
      setDeleteTarget(null);
      if (users.length === 1 && page > 1) setPage((p) => p - 1);
      else loadUsers();
    }
  };

  const handleToggleLock = async (u: AdminUserRecord) => {
    if (u.id === currentUser?.id) {
      toast.error('Không thể khóa tài khoản đang đăng nhập.');
      return;
    }
    setLockBusyId(u.id);
    const updated = await AdminUserService.updateUser(u.id, { is_locked: !u.is_locked });
    setLockBusyId(null);
    if (updated) {
      toast.success(updated.is_locked ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
      loadUsers();
      if (detailUser?.id === u.id) {
        setDetailUser(updated);
      }
    }
  };

  const toggleAdmin = async (u: AdminUserRecord) => {
    if (u.id === currentUser?.id && u.is_admin) {
      toast.error('Không thể gỡ quyền admin của chính bạn.');
      return;
    }
    setPermBusy(true);
    const result = u.is_admin
      ? await AdminUserService.revokePermission(u.id, ADMIN_PERMISSION)
      : await AdminUserService.grantPermission(u.id, ADMIN_PERMISSION);
    setPermBusy(false);
    if (result) {
      toast.success(u.is_admin ? 'Đã gỡ quyền quản trị.' : 'Đã cấp quyền quản trị.');
      loadUsers();
      if (detailUser?.id === u.id) setDetailUser(result);
    }
  };

  const handleGrantPermission = async () => {
    if (!detailUser || !newPermission.trim()) return;
    setPermBusy(true);
    const updated = await AdminUserService.grantPermission(detailUser.id, newPermission.trim());
    setPermBusy(false);
    if (updated) {
      toast.success('Đã gán quyền.');
      setDetailUser(updated);
      setNewPermission('');
      loadUsers();
    }
  };

  const handleRevokePermission = async (perm: string) => {
    if (!detailUser) return;
    if (detailUser.id === currentUser?.id && perm === ADMIN_PERMISSION) {
      toast.error('Không thể gỡ AllAccess của chính bạn.');
      return;
    }
    setPermBusy(true);
    const updated = await AdminUserService.revokePermission(detailUser.id, perm);
    setPermBusy(false);
    if (updated) {
      toast.success('Đã gỡ quyền.');
      setDetailUser(updated);
      loadUsers();
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              Quản lý người dùng
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Tạo, chỉnh sửa, phân quyền và xóa tài khoản trong hệ thống
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
            >
              <FaUserPlus className="w-4 h-4" />
              Thêm người dùng
            </button>
            <button
              type="button"
              onClick={loadUsers}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-medium flex items-center gap-2"
            >
              <FaSync className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Tổng người dùng</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">{total}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Quản trị viên</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{adminCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Người dùng thường</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{Math.max(0, total - adminCount)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm theo tên, email hoặc ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'admin', 'user'] as RoleFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setRoleFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    roleFilter === f
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600'
                  }`}
                >
                  {f === 'all' ? 'Tất cả' : f === 'admin' ? 'Admin' : 'User'}
                </button>
              ))}
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className={`${inputClass} w-auto min-w-[120px]`}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / trang
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button type="button" onClick={loadUsers} className="text-blue-600 hover:underline text-sm">
                Thử lại
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Không có người dùng phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Người dùng</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Vai trò</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Ngày tạo</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-slate-100">{u.name}</div>
                            <div className="text-xs text-gray-400 font-mono truncate max-w-[140px]">{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {u.is_admin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                              <FaShieldAlt className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                              <FaUser className="w-3 h-3" />
                              User
                            </span>
                          )}
                          {u.is_locked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200">
                              <FaLock className="w-3 h-3" />
                              Đã khóa
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <button
                            type="button"
                            title="Chi tiết & phân quyền"
                            onClick={() => openDetail(u)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title={u.is_admin ? 'Gỡ quyền admin' : 'Nâng lên admin'}
                            onClick={() => toggleAdmin(u)}
                            disabled={permBusy}
                            className="p-2 rounded-lg text-gray-600 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-slate-800"
                          >
                            <FaShieldAlt className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title={u.is_locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            onClick={() => handleToggleLock(u)}
                            disabled={lockBusyId === u.id || u.id === currentUser?.id}
                            className={`p-2 rounded-lg dark:hover:bg-slate-800 disabled:opacity-40 ${
                              u.is_locked
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {u.is_locked ? <FaUnlock className="w-4 h-4" /> : <FaLock className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            title="Chỉnh sửa"
                            onClick={() => openEdit(u)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Xóa"
                            onClick={() => setDeleteTarget(u)}
                            disabled={u.id === currentUser?.id}
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

          {!loading && !error && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30">
              <span className="text-sm text-gray-600 dark:text-slate-400">
                Trang {page} / {totalPages} — Tổng {total} người dùng
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <ModalShell title="Thêm người dùng mới" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Họ tên</label>
              <input
                className={inputClass}
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                className={inputClass}
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mật khẩu</label>
              <input
                type="password"
                className={inputClass}
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button
              type="button"
              disabled={creating}
              onClick={handleCreate}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60"
            >
              {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </ModalShell>
      )}

      {editUser && (
        <ModalShell title="Chỉnh sửa người dùng" onClose={() => setEditUser(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Họ tên</label>
              <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                className={inputClass}
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Mật khẩu mới (để trống nếu không đổi)
              </label>
              <input
                type="password"
                className={inputClass}
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveEdit}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <FaKey className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </ModalShell>
      )}

      {detailUser && (
        <ModalShell title="Chi tiết & phân quyền" onClose={() => setDetailUser(null)} wide>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {detailUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-slate-100">{detailUser.name}</p>
                <p className="text-sm text-gray-500">{detailUser.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {detailUser.has_password ? 'Có mật khẩu' : 'Đăng nhập OAuth'} · Tạo {formatDate(detailUser.created_at)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Quyền hiện tại</p>
              <div className="flex flex-wrap gap-2">
                {detailUser.permissions.length === 0 ? (
                  <span className="text-sm text-gray-400">Chưa có quyền nào</span>
                ) : (
                  detailUser.permissions.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-xs bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRevokePermission(p)}
                        disabled={permBusy}
                        className="p-0.5 hover:bg-blue-200/50 rounded-full"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <select
                className={`${inputClass} flex-1`}
                value={newPermission}
                onChange={(e) => setNewPermission(e.target.value)}
              >
                <option value="">Chọn quyền để gán...</option>
                {permissionCatalog
                  .filter((p) => !detailUser.permissions.includes(p))
                  .map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={permBusy || !newPermission}
                onClick={handleGrantPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm font-medium disabled:opacity-50"
              >
                <FaPlus className="w-3 h-3" />
                Gán
              </button>
            </div>

            <button
              type="button"
              disabled={permBusy}
              onClick={() => toggleAdmin(detailUser)}
              className={`w-full py-2 rounded-lg text-sm font-medium border ${
                detailUser.is_admin
                  ? 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100'
                  : 'border-red-300 text-red-800 bg-red-50 hover:bg-red-100'
              }`}
            >
              {detailUser.is_admin ? 'Gỡ quyền Admin (AllAccess)' : 'Nâng lên Admin (AllAccess)'}
            </button>
          </div>
        </ModalShell>
      )}

      {deleteTarget && (
        <ModalShell title="Xác nhận xóa" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            Bạn có chắc muốn xóa người dùng <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
            Hành động này không thể hoàn tác.
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
    </>
  );
};

export default AdminUsers;
