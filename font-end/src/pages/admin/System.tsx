import React from 'react';
import PageHeading from '../../components/heading';
import SystemInfoEditor from '../../components/SystemInfoEditor';

const breadcrumb = {
  title: 'Quản lý hệ thống',
  route: '/admin/system',
};

const AdminSystem: React.FC = () => {
  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            Cấu hình thông tin hệ thống
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Tên hệ thống, trạng thái vận hành và phiên bản hiển thị cho người dùng.
          </p>
        </div>
        <div className="max-w-md">
          <SystemInfoEditor />
        </div>
      </div>
    </>
  );
};

export default AdminSystem;
