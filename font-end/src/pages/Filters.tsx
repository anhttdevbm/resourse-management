import React, { useEffect, useMemo, useState } from 'react';
import PageHeading from '../components/heading';
import {
  ResourceService,
  type Resource,
  type ResourceUploadOptions,
} from '../services/ResourceService';
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaFile,
  FaServer,
  FaBox,
  FaCheckCircle,
} from 'react-icons/fa';

const FiltersPage: React.FC = () => {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [stageId, setStageId] = useState<string>('');
  const [statusId, setStatusId] = useState<string>('');
  const [platformId, setPlatformId] = useState<string>('');
  const [productTypeId, setProductTypeId] = useState<string>('');
  const [repoId, setRepoId] = useState<string>('');
  const [tagId, setTagId] = useState<string>('');

  const [options, setOptions] = useState<ResourceUploadOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [results, setResults] = useState<Resource[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breadcrumb = { title: 'Bộ lọc nâng cao', route: '/filters' };

  useEffect(() => {
    const load = async () => {
      setOptionsLoading(true);
      try {
        const opts = await ResourceService.getResourceUploadOptions();
        setOptions(opts);
      } catch (err) {
        console.error('Load filter options failed:', err);
      } finally {
        setOptionsLoading(false);
      }
    };
    load();
  }, []);

  const handleApply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResultsLoading(true);
    setError(null);
    try {
      const data = await ResourceService.getResources({
        name: name || undefined,
        version: version || undefined,
        stage_id: stageId || undefined,
        status_id: statusId || undefined,
        platform_id: platformId || undefined,
        product_type_id: productTypeId || undefined,
        repo_id: repoId || undefined,
        tag_id: tagId || undefined,
      });
      setResults(data);
      if (!data.length) {
        setError('Không tìm thấy tài nguyên nào với bộ lọc hiện tại.');
      }
    } catch (err) {
      console.error('Apply filters failed:', err);
      setError('Có lỗi xảy ra khi áp dụng bộ lọc.');
    } finally {
      setResultsLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setVersion('');
    setStageId('');
    setStatusId('');
    setPlatformId('');
    setProductTypeId('');
    setRepoId('');
    setTagId('');
    setResults([]);
    setError(null);
  };

  const activeFiltersCount = useMemo(() => {
    return [
      name,
      version,
      stageId,
      statusId,
      platformId,
      productTypeId,
      repoId,
      tagId,
    ].filter(Boolean).length;
  }, [name, version, stageId, statusId, platformId, productTypeId, repoId, tagId]);

  const stats = useMemo(() => {
    const byPlatform: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    results.forEach((r) => {
      const p = r.resource_platform?.name || 'Khác';
      const s = r.resource_status?.name || 'Không rõ';
      byPlatform[p] = (byPlatform[p] || 0) + 1;
      byStatus[s] = (byStatus[s] || 0) + 1;
    });
    return { byPlatform, byStatus };
  }, [results]);

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        {/* Header + summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaFilter className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Bộ lọc đang dùng</p>
              <p className="text-lg font-semibold text-gray-900">
                {activeFiltersCount} tiêu chí
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Kết quả</p>
              <p className="text-lg font-semibold text-gray-900">
                {results.length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-xs text-gray-600">
            Trang này giúp bạn cấu hình bộ lọc nâng cao cho tài nguyên (stage, trạng thái,
            platform, loại sản phẩm, kho, tag) và xem nhanh kết quả phù hợp trước khi thao tác
            chi tiết.
          </div>
        </div>

        {/* Filters form */}
        <form
          onSubmit={handleApply}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                Tên tài nguyên
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập một phần tên..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                Phiên bản
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="Ví dụ: 1.0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                Stage
              </label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={optionsLoading}
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
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={optionsLoading}
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
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={optionsLoading}
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
                value={productTypeId}
                onChange={(e) => setProductTypeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={optionsLoading}
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
                Kho (Repository)
              </label>
              <select
                value={repoId}
                onChange={(e) => setRepoId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={optionsLoading}
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
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={optionsLoading}
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

          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="text-xs text-gray-500">
              {activeFiltersCount > 0
                ? `Đang áp dụng ${activeFiltersCount} tiêu chí lọc.`
                : 'Chưa chọn tiêu chí nào.'}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-2"
              >
                <FaTimes className="w-3 h-3" />
                Xóa bộ lọc
              </button>
              <button
                type="submit"
                disabled={resultsLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm font-medium flex items-center gap-2"
              >
                <FaFilter className="w-3 h-3" />
                {resultsLoading ? 'Đang áp dụng...' : 'Áp dụng bộ lọc'}
              </button>
            </div>
          </div>
        </form>

        {/* Results preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            {resultsLoading ? (
              <div className="py-12 px-4 text-center text-sm text-gray-500">
                Đang tải kết quả...
              </div>
            ) : error && results.length === 0 ? (
              <div className="py-12 px-4 text-center text-sm text-red-600">{error}</div>
            ) : results.length === 0 ? (
              <div className="py-12 px-4 text-center text-sm text-gray-500">
                Chưa có kết quả. Hãy chọn tiêu chí và bấm &quot;Áp dụng bộ lọc&quot;.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center">
                        <FaFile className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-500">
                          Phiên bản {r.version} ·{' '}
                          {r.resource_platform?.name || 'Platform không rõ'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Phân bố kết quả</h3>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                <FaServer className="w-3 h-3 text-gray-500" />
                Theo Platform
              </p>
              {Object.keys(stats.byPlatform).length === 0 ? (
                <p className="text-xs text-gray-500">Chưa có dữ liệu.</p>
              ) : (
                <ul className="space-y-1 text-xs text-gray-700">
                  {Object.entries(stats.byPlatform).map(([name, count]) => (
                    <li key={name} className="flex justify-between">
                      <span>{name}</span>
                      <span className="font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                <FaBox className="w-3 h-3 text-gray-500" />
                Theo Trạng thái
              </p>
              {Object.keys(stats.byStatus).length === 0 ? (
                <p className="text-xs text-gray-500">Chưa có dữ liệu.</p>
              ) : (
                <ul className="space-y-1 text-xs text-gray-700">
                  {Object.entries(stats.byStatus).map(([name, count]) => (
                    <li key={name} className="flex justify-between">
                      <span>{name}</span>
                      <span className="font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FiltersPage;

