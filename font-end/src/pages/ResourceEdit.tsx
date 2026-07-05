import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeading from '../components/heading';
import { useAuth } from '../contexts/AuthContext';
import {
  ResourceService,
  type Resource,
  type ResourceUploadOptions,
} from '../services/ResourceService';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white';
const selectClass = inputClass;

const ResourceEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, hasPermission } = useAuth();

  const canEdit = isAdmin || hasPermission('manage_resources');

  const [resource, setResource] = useState<Resource | null>(null);
  const [options, setOptions] = useState<ResourceUploadOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [stageId, setStageId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [productTypeId, setProductTypeId] = useState('');
  const [repoId, setRepoId] = useState('');
  const [tagId, setTagId] = useState('');

  const breadcrumb = {
    title: 'Chỉnh sửa tài nguyên',
    route: id ? `/resources/${id}/edit` : '/resources',
  };

  const fillForm = useCallback((r: Resource) => {
    setName(r.name || '');
    setVersion(r.version || '');
    setStageId(r.stage_id || '');
    setStatusId(r.status_id || '');
    setPlatformId(r.platform_id || '');
    setProductTypeId(r.product_type_id || '');
    setRepoId(r.repo_id || '');
    setTagId(r.tag_id || '');
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Thiếu ID tài nguyên.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([ResourceService.getResourceById(id), ResourceService.getResourceUploadOptions()])
      .then(([res, opts]) => {
        if (cancelled) return;
        if (!res) {
          setError('Không tìm thấy tài nguyên.');
          return;
        }
        setResource(res);
        setOptions(opts);
        fillForm(res);
      })
      .catch(() => {
        if (!cancelled) setError('Không thể tải thông tin tài nguyên.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, fillForm]);

  const isOwner = !!(user && resource && resource.user_id === user.id);
  const allowed = canEdit || isOwner;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !allowed) return;
    const trimmedName = name.trim();
    const trimmedVersion = version.trim();
    if (!trimmedName || !trimmedVersion) {
      toast.warning('Tên và phiên bản không được để trống.');
      return;
    }
    setSaving(true);
    try {
      const updated = await ResourceService.updateResource(id, {
        name: trimmedName,
        version: trimmedVersion,
        stage_id: stageId || undefined,
        status_id: statusId || undefined,
        platform_id: platformId || undefined,
        product_type_id: productTypeId || undefined,
        repo_id: repoId || undefined,
        tag_id: tagId || undefined,
      });
      if (updated) {
        toast.success('Đã cập nhật tài nguyên.');
        navigate(`/resources/${id}`);
      } else {
        toast.error('Cập nhật thất bại. Kiểm tra quyền hoặc dữ liệu.');
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error('Lỗi khi cập nhật tài nguyên.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeading breadcrumb={breadcrumb} />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            Đang tải...
          </div>
        </div>
      </>
    );
  }

  if (error || !resource) {
    return (
      <>
        <PageHeading breadcrumb={breadcrumb} />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Không tìm thấy tài nguyên.'}</p>
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <FaArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!allowed) {
    return (
      <>
        <PageHeading breadcrumb={breadcrumb} />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-red-600 mb-4">Bạn không có quyền chỉnh sửa tài nguyên này.</p>
            <Link
              to={`/resources/${id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <FaArrowLeft className="w-4 h-4" />
              Xem chi tiết
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-4">
          <Link
            to={`/resources/${id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            Quay lại chi tiết
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa metadata</h2>
            <p className="text-sm text-gray-500 mt-1">
              File đính kèm không đổi — chỉ cập nhật tên, phiên bản và phân loại.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài nguyên *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phiên bản *</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Phân loại (tùy chọn)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Giai đoạn</label>
                  <select
                    value={stageId}
                    onChange={(e) => setStageId(e.target.value)}
                    className={selectClass}
                    disabled={!options}
                  >
                    <option value="">— Chọn —</option>
                    {options?.stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Trạng thái</label>
                  <select
                    value={statusId}
                    onChange={(e) => setStatusId(e.target.value)}
                    className={selectClass}
                    disabled={!options}
                  >
                    <option value="">— Chọn —</option>
                    {options?.statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nền tảng</label>
                  <select
                    value={platformId}
                    onChange={(e) => setPlatformId(e.target.value)}
                    className={selectClass}
                    disabled={!options}
                  >
                    <option value="">— Chọn —</option>
                    {options?.platforms.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Loại sản phẩm</label>
                  <select
                    value={productTypeId}
                    onChange={(e) => setProductTypeId(e.target.value)}
                    className={selectClass}
                    disabled={!options}
                  >
                    <option value="">— Chọn —</option>
                    {options?.productTypes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Kho</label>
                  <select
                    value={repoId}
                    onChange={(e) => setRepoId(e.target.value)}
                    className={selectClass}
                    disabled={!options}
                  >
                    <option value="">— Chọn —</option>
                    {options?.repos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Thẻ</label>
                  <select
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                    className={selectClass}
                    disabled={!options}
                  >
                    <option value="">— Chọn —</option>
                    {options?.tags.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <Link
              to={`/resources/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <FaSave className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ResourceEdit;
