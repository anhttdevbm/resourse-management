import { FaHome, FaCog, FaChartBar, FaUsers, FaBox, FaFileAlt, FaBell, FaDownload, FaUpload, FaFolder, FaFileCode, FaShieldAlt, FaTags, FaHistory } from "react-icons/fa";

export const sidebarItem = [
    {
        label: 'MAIN',
        items: [
            {
                icon: <FaHome className="text-sm mr-2" />,
                active: ['dashboard'],
                label: 'Dashboard',
                links: [
                    {title:'Tổng quan hệ thống', to: '/dashboard'},
                    {title:'Thống kê tải xuống', to: '/dashboard/downloads'}
                ]
            }
        ]
    },
    {
        label: 'QUẢN LÝ TÀI NGUYÊN SỐ',
        items: [
            {
                icon: <FaDownload className="text-sm mr-2" />,
                active: ['resources'],
                label: 'Quản lý tài nguyên',
                links: [
                    {title:'Danh sách tài nguyên', to: '/resources'},
                    {title:'Thêm tài nguyên mới', to: '/resources/add'},
                    {title:'Phân loại tài nguyên', to: '/resources/categories'}
                ]
            },
            {
                icon: <FaFileCode className="text-sm mr-2" />,
                active: ['file-types'],
                label: 'Loại file',
                links: [
                    {title:'APK Files', to: '/file-types/apk'},
                    {title:'EXE Files', to: '/file-types/exe'},
                    {title:'ISO Files', to: '/file-types/iso'},
                    {title:'Other Files', to: '/file-types/others'}
                ]
            },
            {
                icon: <FaUpload className="text-sm mr-2" />,
                active: ['uploads'],
                label: 'Quản lý Upload',
                permission: 'manage_uploads',
                links: [
                    {title:'Upload tài nguyên', to: '/uploads'},
                    {title:'Kiểm duyệt file', to: '/uploads/approval'},
                    {title:'Lịch sử upload', to: '/uploads/history'}
                ]
            },
            {
                icon: <FaFolder className="text-sm mr-2" />,
                active: ['storage'],
                label: 'Quản lý lưu trữ',
                permission: 'manage_storage',
                links: [
                    {title:'Storage Overview', to: '/storage'},
                    {title:'Backup & Restore', to: '/storage/backup'},
                    {title:'Cleanup Tools', to: '/storage/cleanup'}
                ]
            }
        ]
    },
    {
        label: 'PHÂN LOẠI & TAGS',
        items: [
            {
                icon: <FaTags className="text-sm mr-2" />,
                active: ['categories'],
                label: 'Phân loại',
                permission: 'view_categories',
                links: [
                    {title:'Danh mục chính', to: '/categories'},
                    {title:'Tags & Labels', to: '/categories/tags'},
                    {title:'Auto Classification', to: '/categories/auto'}
                ]
            },
            {
                icon: <FaShieldAlt className="text-sm mr-2" />,
                active: ['security'],
                label: 'Bảo mật & Kiểm duyệt',
                permission: 'manage_security',
                links: [
                    {title:'Virus Scan', to: '/security/scan'},
                    {title:'File Validation', to: '/security/validation'},
                    {title:'Security Reports', to: '/security/reports'}
                ]
            }
        ]
    },
    {
        label: 'QUẢN LÝ NGƯỜI DÙNG',
        items: [
            {
                icon: <FaUsers className="text-sm mr-2" />,
                active: ['users'],
                label: 'Quản lý thành viên',
                permission: 'manage_users',
                links: [
                    {title:'Danh sách thành viên', to: '/user'},
                    {title:'Nhóm thành viên', to: '/user/catalogue'},
                    {title:'Phân quyền truy cập', to: '/user/permissions'}
                ]
            }
        ]
    },
    {
        label: 'BÁO CÁO & PHÂN TÍCH',
        items: [
            {
                icon: <FaFileAlt className="text-sm mr-2" />,
                active: ['reports'],
                label: 'Báo cáo',
                permission: 'view_reports',
                links: [
                    {title:'Báo cáo tổng hợp', to: '/reports'},
                    {title:'Thống kê tải xuống', to: '/reports/downloads'},
                    {title:'Analytics', to: '/reports/analytics'}
                ]
            },
            {
                icon: <FaHistory className="text-sm mr-2" />,
                active: ['activity'],
                label: 'Hoạt động',
                links: [
                    {title:'Lịch sử hoạt động', to: '/activity'},
                    {title:'User Activity', to: '/activity/users'},
                    {title:'System Logs', to: '/activity/logs'}
                ]
            }
        ]
    },
    {
        label: 'HỆ THỐNG',
        items: [
            {
                icon: <FaCog className="text-sm mr-2" />,
                active: ['settings'],
                label: 'Cài đặt',
                links: [
                    {title:'Cài đặt chung', to: '/settings'},
                    {title:'Hồ sơ cá nhân', to: '/profile'},
                    {title:'System Configuration', to: '/settings/system'}
                ]
            },
            {
                icon: <FaBell className="text-sm mr-2" />,
                active: ['notifications'],
                label: 'Thông báo',
                links: [
                    {title:'Thông báo hệ thống', to: '/notifications'},
                    {title:'Cài đặt thông báo', to: '/notifications/settings'},
                    {title:'Alert History', to: '/notifications/history'}
                ]
            }
        ]
    }
];

// Menu dành riêng cho Admin
export const adminSidebarItem = [
    {
        label: 'ADMIN PANEL',
        items: [
            {
                icon: <FaUsers className="text-sm mr-2" />,
                active: ['admin-users'],
                label: 'Quản lý người dùng',
                permission: 'manage_users',
                links: [
                    {title:'Danh sách người dùng', to: '/admin/users'},
                    {title:'Phân quyền', to: '/admin/permissions'},
                    {title:'User Activity Log', to: '/admin/user-logs'}
                ]
            },
            {
                icon: <FaCog className="text-sm mr-2" />,
                active: ['admin-system'],
                label: 'Quản lý hệ thống',
                permission: 'manage_system',
                links: [
                    {title:'Cấu hình hệ thống', to: '/admin/system'},
                    {title:'Log hệ thống', to: '/admin/logs'},
                    {title:'System Health', to: '/admin/health'}
                ]
            },
            {
                icon: <FaChartBar className="text-sm mr-2" />,
                active: ['admin-reports'],
                label: 'Báo cáo quản trị',
                permission: 'view_reports',
                links: [
                    {title:'Báo cáo tổng quan', to: '/admin/reports'},
                    {title:'Thống kê chi tiết', to: '/admin/statistics'},
                    {title:'Resource Usage', to: '/admin/resource-usage'}
                ]
            }
        ]
    }
];