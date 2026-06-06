import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/heading';
import { ResourceService, type Resource } from '../services/ResourceService';
import { DownloadHistoryService } from '../services/DownloadHistoryService';
import { FaDownload, FaFile, FaSearch, FaSort, FaSortDown, FaSortUp, FaTimes } from 'react-icons/fa';

type SortField = 'name' | 'version' | 'created_at';
type SortDirection = 'asc' | 'desc';

const ExeFiles: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ResourceService.getResources();
        const exeOnly = data.filter(
          (r) => r.url && r.url.toLowerCase().includes('.exe')
        );
        setResources(exeOnly);
      } catch (err) {
        console.error('Error fetching EXE files:', err);
        setError('Không thể tải danh sách EXE. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = [...resources];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.version.toLowerCase().includes(q) ||
          r.url.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'version':
          aVal = a.version.toLowerCase();
          bVal = b.version.toLowerCase();
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [resources, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <FaSort className="w-3 h-3 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <FaSortUp className="w-3 h-3 text-blue-600" />
    ) : (
      <FaSortDown className="w-3 h-3 text-blue-600" />
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
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

  const handleDownload = async (resource: Resource) => {
    DownloadHistoryService.addToHistory({
      id: resource.id,
      name: resource.name,
      version: resource.version,
      url: resource.url,
    });
    const filename =
      (resource.url && resource.url.split('/').pop()) ||
      (resource.name ? `${resource.name}.exe` : undefined);
    await ResourceService.downloadResource(resource.id, filename);
  };

  const breadcrumb = { title: 'EXE Files', route: '/file-types/exe' };

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">EXE Files</h2>
              <p className="text-sm text-gray-500 mt-1">
                Danh sách các tài nguyên có đuôi .exe trong hệ thống
              </p>
            </div>
            <Link
              to="/resources"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <FaFile className="w-4 h-4" />
              Tài nguyên của tôi
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm theo tên, phiên bản hoặc URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="py-12 px-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="py-12 px-4 text-center text-sm text-red-600">{error}</div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <p className="text-sm text-gray-500">Chưa có file EXE nào trong hệ thống.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 hover:text-blue-600"
                      >
                        Tên
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('version')}
                        className="flex items-center gap-2 hover:text-blue-600"
                      >
                        Phiên bản
                        {getSortIcon('version')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="flex items-center gap-2 hover:text-blue-600"
                      >
                        Ngày tạo
                        {getSortIcon('created_at')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndSorted.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaFile className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">{r.url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {r.version}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDownload(r)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Tải xuống"
                        >
                          <FaDownload className="w-4 h-4" />
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
    </>
  );
};

export default ExeFiles;
