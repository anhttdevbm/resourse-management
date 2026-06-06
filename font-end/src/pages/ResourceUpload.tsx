import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeading from '../components/heading';
import { ResourceService, type ResourceUploadOptions } from '../services/ResourceService';
import { UploadHistoryService } from '../services/UploadHistoryService';
import {
  FaCloudUploadAlt,
  FaFile,
  FaTimes,
  FaBoxOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
} from 'react-icons/fa';

/** Chuẩn hóa lỗi API (422 detail là mảng object) thành chuỗi để không crash React khi render. */
function getErrorMessage(err: any, fallback: string): string {
  const d = err?.response?.data?.detail;
  if (Array.isArray(d) && d.length) {
    return d.map((x: any) => (x?.msg != null ? x.msg : String(x))).join('. ');
  }
  if (d && typeof d === 'object' && d.msg != null) return String(d.msg);
  if (typeof d === 'string') return d;
  return err?.response?.data?.message || err?.message || fallback;
}

const ResourceUpload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [stageId, setStageId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [productTypeId, setProductTypeId] = useState('');
  const [repoId, setRepoId] = useState('');
  const [tagId, setTagId] = useState('');
  const [options, setOptions] = useState<ResourceUploadOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [repoCreating, setRepoCreating] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [tagCreating, setTagCreating] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<{ message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOptions = useCallback(() => {
    return ResourceService.getResourceUploadOptions().then((opts) => {
      setOptions(opts);
      setOptionsLoading(false);
    }).catch(() => setOptionsLoading(false));
  }, []);

  useEffect(() => {
    setOptionsLoading(true);
    loadOptions();
  }, [loadOptions]);

  const handleCreateRepo = async () => {
    const trimmed = newRepoName.trim();
    if (!trimmed) {
      setRepoError('Vui lòng nhập tên kho.');
      return;
    }
    setRepoError(null);
    setRepoCreating(true);
    try {
      const created = await ResourceService.createPackageRepository(trimmed);
      const opts = await ResourceService.getResourceUploadOptions();
      setOptions(opts);
      setRepoId(created.id);
      setShowRepoModal(false);
      setNewRepoName('');
    } catch (err: any) {
      setRepoError(getErrorMessage(err, 'Tạo kho thất bại.'));
    } finally {
      setRepoCreating(false);
    }
  };

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      setTagError('Vui lòng nhập tên thẻ.');
      return;
    }
    setTagError(null);
    setTagCreating(true);
    try {
      const created = await ResourceService.createResourceTag(trimmed);
      const opts = await ResourceService.getResourceUploadOptions();
      setOptions(opts);
      setTagId(created.id);
      setShowTagModal(false);
      setNewTagName('');
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const msg = getErrorMessage(err, 'Tạo thẻ thất bại.');
      if (code === 'BE0030') {
        // Thẻ đã tồn tại: refetch và chọn thẻ theo tên
        const opts = await ResourceService.getResourceUploadOptions();
        setOptions(opts);
        const existing = opts.tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) {
          setTagId(existing.id);
          setShowTagModal(false);
          setNewTagName('');
          setTagError(null);
        } else {
          setTagError('Thẻ đã tồn tại nhưng không tìm thấy trong danh sách. Vui lòng chọn thẻ bên dưới.');
        }
      } else {
        setTagError(msg);
      }
    } finally {
      setTagCreating(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const item = e.dataTransfer.files[0];
    if (item) setFile(item);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
  };

  const resetForm = () => {
    setFile(null);
    setName('');
    setVersion('');
    setStageId('');
    setStatusId('');
    setPlatformId('');
    setProductTypeId('');
    setRepoId('');
    setTagId('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError('Vui lòng chọn file cần tải lên.');
      return;
    }
    const trimmedName = name.trim();
    const trimmedVersion = version.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập tên tài nguyên.');
      return;
    }
    if (!trimmedVersion) {
      setError('Vui lòng nhập phiên bản.');
      return;
    }

    setUploading(true);
    try {
      const created = await ResourceService.uploadResource(file, {
        name: trimmedName,
        version: trimmedVersion,
        stage_id: stageId || undefined,
        status_id: statusId || undefined,
        platform_id: platformId || undefined,
        product_type_id: productTypeId || undefined,
        repo_id: repoId || undefined,
        tag_id: tagId || undefined,
      });
      setSuccess({ message: 'Tải lên thành công. Tài nguyên đã được thêm vào danh sách.' });
      // Ghi lịch sử upload (localStorage)
      if (created && created.id) {
        UploadHistoryService.addToHistory({
          id: created.id,
          name: created.name,
          version: created.version,
          url: created.url,
        });
      }
      setFile(null);
      setName('');
      setVersion('');
      setStageId('');
      setStatusId('');
      setPlatformId('');
      setProductTypeId('');
      setRepoId('');
      setTagId('');
      setError(null);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Tải lên thất bại. Vui lòng thử lại.'));
    } finally {
      setUploading(false);
    }
  };

  const breadcrumb = { title: 'Upload tài nguyên', route: '/resources/upload' };

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload tài nguyên</h2>
              <p className="text-sm text-gray-500 mt-1">
                Tải file lên và điền thông tin: tên, phiên bản; có thể chọn thêm giai đoạn, trạng thái, nền tảng, loại sản phẩm, kho, thẻ
              </p>
            </div>
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <FaBoxOpen className="w-4 h-4" />
              Xem tài nguyên
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Drop zone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File tải lên</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FaCloudUploadAlt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
                        Kéo thả file vào đây hoặc <span className="text-blue-600 font-medium">chọn file</span>
                      </p>
                      <p className="text-xs text-gray-500">Hỗ trợ mọi định dạng file</p>
                    </label>
                  </div>

                  {file && (
                    <div className="mt-3 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <FaFile className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Xóa file"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Tên tài nguyên <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: App Setup"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">
                      Phiên bản <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="version"
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="Ví dụ: 1.0.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Thông tin bổ sung (tùy chọn)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="stage_id" className="block text-sm text-gray-600 mb-1">Giai đoạn (Stage)</label>
                      <select
                        id="stage_id"
                        value={stageId}
                        onChange={(e) => setStageId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                        disabled={optionsLoading}
                      >
                        <option value="">— Chọn —</option>
                        {options?.stages.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="status_id" className="block text-sm text-gray-600 mb-1">Trạng thái</label>
                      <select
                        id="status_id"
                        value={statusId}
                        onChange={(e) => setStatusId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                        disabled={optionsLoading}
                      >
                        <option value="">— Chọn —</option>
                        {options?.statuses.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="platform_id" className="block text-sm text-gray-600 mb-1">Nền tảng</label>
                      <select
                        id="platform_id"
                        value={platformId}
                        onChange={(e) => setPlatformId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                        disabled={optionsLoading}
                      >
                        <option value="">— Chọn —</option>
                        {options?.platforms.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="product_type_id" className="block text-sm text-gray-600 mb-1">Loại sản phẩm</label>
                      <select
                        id="product_type_id"
                        value={productTypeId}
                        onChange={(e) => setProductTypeId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                        disabled={optionsLoading}
                      >
                        <option value="">— Chọn —</option>
                        {options?.productTypes.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="repo_id" className="block text-sm text-gray-600 mb-1">Kho (Repository)</label>
                      <div className="flex gap-2">
                        <select
                          id="repo_id"
                          value={repoId}
                          onChange={(e) => setRepoId(e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                          disabled={optionsLoading}
                        >
                          <option value="">— Chọn —</option>
                          {options?.repos.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => { setShowRepoModal(true); setRepoError(null); setNewRepoName(''); }}
                          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                          title="Tạo kho mới cho riêng bạn"
                        >
                          <FaPlus className="w-4 h-4" />
                          Tạo mới
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="tag_id" className="block text-sm text-gray-600 mb-1">Thẻ (Tag)</label>
                      <div className="flex gap-2">
                        <select
                          id="tag_id"
                          value={tagId}
                          onChange={(e) => setTagId(e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                          disabled={optionsLoading}
                        >
                          <option value="">— Chọn —</option>
                          {options?.tags.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => { setShowTagModal(true); setTagError(null); setNewTagName(''); }}
                          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                          title="Tạo thẻ mới cho riêng bạn"
                        >
                          <FaPlus className="w-4 h-4" />
                          Tạo mới
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                    <FaCheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{success.message}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Đang tải lên...
                      </>
                    ) : (
                      <>
                        <FaCloudUploadAlt className="w-4 h-4" />
                        Tải lên
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Đặt lại
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/resources')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Về danh sách
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Hướng dẫn</h3>
              <ul className="text-xs text-gray-600 space-y-2">
                <li>• Chọn file (kéo thả hoặc chọn file).</li>
                <li>• Nhập <strong>tên</strong> và <strong>phiên bản</strong> (bắt buộc).</li>
                <li>• Có thể chọn thêm: Giai đoạn, Trạng thái, Nền tảng, Loại sản phẩm, Kho, Thẻ. Bấm <strong>Tạo mới</strong> bên cạnh Kho hoặc Thẻ để tạo kho/thẻ riêng.</li>
                <li>• Bấm <strong>Tải lên</strong> để gửi lên hệ thống.</li>
                <li>• Sau khi thành công, tài nguyên xuất hiện tại Tài nguyên của tôi.</li>
              </ul>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
              <p className="text-xs text-blue-800">
                Bạn có thể quản lý và tải xuống lại các file đã upload tại trang{' '}
                <Link to="/resources" className="font-medium underline hover:no-underline">
                  Tài nguyên của tôi
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal tạo Kho (Repository) mới */}
      {showRepoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !repoCreating && setShowRepoModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Tạo kho mới (Repository)</h3>
            <p className="text-sm text-gray-500">Tạo kho riêng cho bạn để gắn với tài nguyên khi upload.</p>
            <div>
              <label htmlFor="new_repo_name" className="block text-sm font-medium text-gray-700 mb-1">Tên kho</label>
              <input
                id="new_repo_name"
                type="text"
                value={newRepoName}
                onChange={(e) => { setNewRepoName(e.target.value); setRepoError(null); }}
                placeholder="Ví dụ: Kho của tôi, Dự án A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                disabled={repoCreating}
              />
            </div>
            {repoError && (
              <p className="text-sm text-red-600">{repoError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !repoCreating && setShowRepoModal(false)}
                className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50"
                disabled={repoCreating}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateRepo}
                disabled={repoCreating}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {repoCreating ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" />
                    Tạo kho
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo Thẻ (Tag) mới */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !tagCreating && setShowTagModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Tạo thẻ mới (Tag)</h3>
            <p className="text-sm text-gray-500">Tạo thẻ riêng để gắn với tài nguyên khi upload.</p>
            <div>
              <label htmlFor="new_tag_name" className="block text-sm font-medium text-gray-700 mb-1">Tên thẻ</label>
              <input
                id="new_tag_name"
                type="text"
                value={newTagName}
                onChange={(e) => { setNewTagName(e.target.value); setTagError(null); }}
                placeholder="Ví dụ: beta, quan-trọng, dự án A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                disabled={tagCreating}
              />
            </div>
            {tagError && (
              <p className="text-sm text-red-600">{tagError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !tagCreating && setShowTagModal(false)}
                className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50"
                disabled={tagCreating}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={tagCreating}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {tagCreating ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" />
                    Tạo thẻ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceUpload;
