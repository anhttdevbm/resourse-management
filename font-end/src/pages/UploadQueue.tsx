import React from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/heading';
import { FaBoxOpen, FaClock, FaCloudUploadAlt, FaFilter, FaSyncAlt } from 'react-icons/fa';

const UploadQueue: React.FC = () => {
  const breadcrumb = { title: 'Queue xử lý', route: '/uploads/queue' };

  // Tạm thời chưa có API queue thực tế, hiển thị trạng thái rỗng thân thiện
  const total = 0;
  const processing = 0;
  const pending = 0;
  const failed = 0;

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Queue xử lý upload</h2>
              <p className="text-sm text-gray-500 mt-1">
                Hàng đợi các file đang được hệ thống xử lý (scan, chuyển định dạng, kiểm duyệt...).
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                to="/resources/upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FaCloudUploadAlt className="w-4 h-4" />
                Upload mới
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FaSyncAlt className="w-4 h-4" />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tổng trong queue</p>
                <p className="text-2xl font-semibold text-gray-900">{total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaClock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Đang xử lý</p>
                <p className="text-2xl font-semibold text-green-600">{processing}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <FaClock className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Chờ xử lý</p>
                <p className="text-2xl font-semibold text-yellow-600">{pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaClock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Thất bại</p>
                <p className="text-2xl font-semibold text-red-600">{failed}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <FaClock className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Bộ lọc / danh sách - tạm thời trạng thái rỗng */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FaFilter className="w-4 h-4 text-gray-400" />
              <span>Bộ lọc queue</span>
            </div>
            <span className="text-xs text-gray-400">
              (Hiện chưa kết nối queue backend, chỉ hiển thị giao diện)
            </span>
          </div>
          <div className="py-12 px-4 text-center">
            <FaBoxOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có file nào trong queue</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Khi bạn upload nhiều file hoặc hệ thống kích hoạt xử lý nền (scan, kiểm duyệt,...),
              các tác vụ sẽ được hiển thị tại đây để bạn dễ theo dõi.
            </p>
            <Link
              to="/resources/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <FaCloudUploadAlt className="w-4 h-4" />
              Đi đến Upload tài nguyên
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadQueue;

