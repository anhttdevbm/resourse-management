import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeading from '../components/heading';
import { ResourceService, type Resource, type ResourceShareInfo } from '../services/ResourceService';
import { useAuth } from '../contexts/AuthContext';
import { FaArrowLeft, FaDownload, FaFile, FaCalendarAlt, FaTag, FaBox, FaFolder, FaServer, FaImage, FaShareAlt, FaTrash } from 'react-icons/fa';

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

function isImageResource(url: string | undefined): boolean {
  return !!(url && IMAGE_EXTENSIONS.test(url));
}

const ResourceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [shares, setShares] = useState<ResourceShareInfo[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareCanEdit,] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Thiếu ID tài nguyên.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    ResourceService.getResourceById(id)
      .then((data) => {
        if (!cancelled) setResource(data ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Resource detail fetch error:', err);
          setError('Không thể tải thông tin tài nguyên.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load image preview when resource is an image
  useEffect(() => {
    if (!resource || !id || !isImageResource(resource.url)) {
      setPreviewUrl(null);
      setPreviewError(false);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    setPreviewLoading(true);
    setPreviewError(false);
    ResourceService.getResourceBlob(id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        setPreviewError(false);
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null);
          setPreviewError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    };
  }, [resource?.id, resource?.url, id]);

  // Load danh sách share nếu là chủ tài nguyên
  useEffect(() => {
    if (!id || !resource || !user || resource.user_id !== user.id) {
      setShares([]);
      return;
    }
    let cancelled = false;
    ResourceService.getResourceShares(id)
      .then((data) => {
        if (!cancelled) setShares(data);
      })
      .catch((err) => {
        console.error('Error loading shares:', err);
        if (!cancelled) setShares([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id, resource?.id, resource?.user_id, user]);

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

  const handleDownload = async () => {
    if (!resource) return;
    const filename =
      (resource.url && resource.url.split('/').pop()) ||
      (resource.name ? `${resource.name}.bin` : undefined);
    await ResourceService.downloadResource(resource.id, filename);
  };

  const isOwner = !!(user && resource && resource.user_id === user.id);

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !shareEmail.trim()) return;
    setShareLoading(true);
    setShareError(null);
    try {
      await ResourceService.shareResource(id, {
        email: shareEmail.trim(),
        can_edit: shareCanEdit,
      });
      setShareEmail('');
      // reload list
      const list = await ResourceService.getResourceShares(id);
      setShares(list);
    } catch (err: any) {
      console.error('Share failed:', err);
      setShareError(err?.message || 'Chia sẻ thất bại. Vui lòng kiểm tra email.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleRemoveShare = async (targetUserId: string) => {
    if (!id) return;
    try {
      await ResourceService.removeResourceShare(id, targetUserId);
      setShares((prev) => prev.filter((s) => s.user_id !== targetUserId));
    } catch (err) {
      console.error('Remove share failed:', err);
    }
  };

  const breadcrumb = { title: 'Chi tiết tài nguyên', route: '/resources' };

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

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Link>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <FaShareAlt className="w-4 h-4" />
                Chia sẻ
              </button>
            )}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FaDownload className="w-4 h-4" />
              Tải xuống
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <FaFile className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{resource.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Phiên bản {resource.version}</p>
              </div>
            </div>
          </div>

          {isImageResource(resource.url) && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FaImage className="w-4 h-4" />
                Xem trước
              </h3>
              {previewLoading ? (
                <div className="flex items-center justify-center bg-gray-100 rounded-lg min-h-[200px] text-gray-500">
                  Đang tải ảnh...
                </div>
              ) : previewError ? (
                <div className="flex items-center justify-center bg-gray-100 rounded-lg min-h-[200px] text-red-600 text-sm">
                  Không thể tải xem trước ảnh.
                </div>
              ) : previewUrl ? (
                <div className="flex justify-center bg-gray-100 rounded-lg p-4">
                  <img
                    src={previewUrl}
                    alt={resource.name}
                    className="max-w-full max-h-[70vh] w-auto h-auto object-contain rounded shadow-sm"
                  />
                </div>
              ) : null}
            </div>
          )}

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Đường dẫn file
                </label>
                <p className="text-sm text-gray-900 break-all font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {resource.url || '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Ngày tạo
                  </label>
                  <p className="text-sm text-gray-900">{formatDate(resource.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {resource.resource_platform && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <FaServer className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Platform</p>
                    <p className="text-sm font-medium text-gray-900">{resource.resource_platform.name}</p>
                  </div>
                </div>
              )}
              {resource.resource_status && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <FaFile className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Trạng thái</p>
                    <p className="text-sm font-medium text-gray-900">{resource.resource_status.name}</p>
                  </div>
                </div>
              )}
              {resource.product_type && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <FaBox className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Loại sản phẩm</p>
                    <p className="text-sm font-medium text-gray-900">{resource.product_type.name}</p>
                  </div>
                </div>
              )}
              {resource.package_repo && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <FaFolder className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Kho</p>
                    <p className="text-sm font-medium text-gray-900">{resource.package_repo.name}</p>
                  </div>
                </div>
              )}
            </div>

            {resource.resource_tags && resource.resource_tags.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  <FaTag className="w-3.5 h-3.5" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {resource.resource_tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isOwner && shareModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaShareAlt className="w-4 h-4" />
              Chia sẻ tài nguyên
            </h3>
            <form onSubmit={handleShareSubmit} className="space-y-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Email người nhận
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder="user@example.com"
                  required
                />
              </div>
              {/* Giữ sẵn checkbox can_edit để sau này mở rộng */}
              {/* <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={shareCanEdit}
                  onChange={(e) => setShareCanEdit(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Cho phép chỉnh sửa
              </label> */}
              {shareError && (
                <p className="text-sm text-red-600">{shareError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShareModalOpen(false);
                    setShareError(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={shareLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm font-medium"
                >
                  {shareLoading ? 'Đang chia sẻ...' : 'Chia sẻ'}
                </button>
              </div>
            </form>

            <div>
              <h4 className="text-sm font-medium text-gray-800 mb-2">Đang chia sẻ cho</h4>
              {shares.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa chia sẻ cho user nào.</p>
              ) : (
                <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                  {shares.map((s) => (
                    <li key={s.id} className="py-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {s.name || s.email}
                        </p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveShare(s.user_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Gỡ chia sẻ"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceDetail;
