export type Locale = "vi" | "en";

export type TranslationKey =
  | "settings.title"
  | "settings.generalTitle"
  | "settings.generalDesc"
  | "settings.loading"
  | "settings.nav.profile"
  | "settings.nav.editProfile"
  | "settings.nav.password"
  | "settings.ui.title"
  | "settings.ui.desc"
  | "settings.ui.themeLabel"
  | "settings.ui.theme.light"
  | "settings.ui.theme.dark"
  | "settings.ui.theme.system"
  | "settings.lang.title"
  | "settings.lang.desc"
  | "settings.lang.label"
  | "settings.table.title"
  | "settings.table.desc"
  | "settings.table.dense.label"
  | "settings.table.dense.desc"
  | "settings.table.pageSize.label"
  | "settings.help.title"
  | "settings.help.desc"
  | "settings.help.dashboardTips.label"
  | "settings.help.dashboardTips.desc"
  | "settings.help.notifyUpdates.label"
  | "settings.help.notifyUpdates.desc"
  | "settings.footer.note"
  | "settings.footer.notificationsLink"
  | "settings.actions.reset"
  | "settings.actions.save"
  | "settings.actions.saving"
  | "settings.toast.saved"
  | "settings.toast.saveFailed"
  | "settings.toast.resetOk"
  | "settings.toast.resetFailed"
  | "settings.toast.loadFailed"
  | "dashboard.breadcrumbTitle"
  | "dashboard.cards.totalResources"
  | "dashboard.cards.uploadsToday"
  | "dashboard.cards.totalDownloads"
  | "dashboard.cards.pendingReview"
  | "dashboard.sections.recentActivity"
  | "dashboard.sections.fileTypeStats"
  | "dashboard.sections.topDownloads"
  | "dashboard.sections.storageUsage"
  | "dashboard.sections.security"
  | "dashboard.loadingShort"
  | "dashboard.empty.noActivity"
  | "dashboard.empty.noStats"
  | "dashboard.empty.noData"
  | "dashboard.downloads.unit"
  | "dashboard.storage.used"
  | "dashboard.storage.available"
  | "dashboard.storage.percentUsed"
  | "dashboard.security.filesScanned"
  | "dashboard.security.cleanFiles"
  | "dashboard.security.infectedFiles"
  | "dashboard.welcome.title"
  | "dashboard.welcome.adminDesc"
  | "dashboard.welcome.userDesc"
  | "menu.group.dashboard"
  | "menu.group.resources"
  | "menu.group.searchAndCategories"
  | "menu.group.personal"
  | "menu.group.adminPanel"
  | "menu.group.advancedResourceAdmin"
  | "menu.group.advancedConfig"
  | "menu.item.home"
  | "menu.item.myResources"
  | "menu.item.upload"
  | "menu.item.fileTypes"
  | "menu.item.search"
  | "menu.item.categories"
  | "menu.item.profile"
  | "menu.item.activity"
  | "menu.item.adminUsers"
  | "menu.item.adminSystem"
  | "menu.item.adminReports"
  | "menu.item.adminResources"
  | "menu.item.adminStorage"
  | "menu.item.adminSecurity"
  | "menu.item.integrations"
  | "menu.item.monitoring"
  | "menu.link.systemOverview"
  | "menu.link.downloadStats"
  | "menu.link.recentActivity"
  | "menu.link.resourceList"
  | "menu.link.downloadedResources"
  | "menu.link.favoriteResources"
  | "menu.link.newUpload"
  | "menu.link.uploadHistory"
  | "menu.link.processingQueue"
  | "menu.link.advancedSearch"
  | "menu.link.filters"
  | "menu.link.searchHistory"
  | "menu.link.mainCategories"
  | "menu.link.changePassword"
  | "menu.link.settings"
  | "menu.link.downloadHistory"
  | "menu.link.bookmarks"
  | "menu.link.userList"
  | "menu.link.permissions"
  | "menu.link.systemConfig"
  | "menu.link.systemLogs"
  | "menu.link.overviewReports"
  | "menu.link.detailedStats"
  | "menu.link.allResources"
  | "menu.actions.logout"
  | "header.searchTooltip"
  | "header.settingsTooltip"
  | "header.accountLabel"
  | "header.profileSubtitle"
  | "header.passwordSubtitle"
  | "header.logoutSubtitle"
  | "menu.user.editProfile"
  | "menu.user.defaultName"
  | "activity.breadcrumbTitle"
  | "activity.pageTitle"
  | "activity.pageSubtitle"
  | "activity.exportCsv"
  | "activity.refresh"
  | "activity.searchPlaceholder"
  | "activity.filterAll"
  | "activity.type.upload"
  | "activity.type.pending"
  | "activity.type.approved"
  | "activity.type.rejected"
  | "activity.type.other"
  | "activity.resetFilters"
  | "activity.stats.totalActivities"
  | "activity.stats.upload"
  | "activity.stats.pending"
  | "activity.stats.approved"
  | "activity.errorLoad"
  | "activity.loading"
  | "activity.retry"
  | "activity.empty.title"
  | "activity.empty.hintFiltered"
  | "activity.empty.hintNone"
  | "activity.col.type"
  | "activity.col.message"
  | "activity.col.fileName"
  | "activity.col.format"
  | "activity.col.timeAgo"
  | "activity.col.createdAt"
  | "activity.na"
  | "activity.csv.id"
  | "activity.csv.type"
  | "activity.csv.message"
  | "activity.csv.fileName"
  | "activity.csv.format"
  | "activity.csv.timeAgo"
  | "activity.csv.createdAt"
  | "activity.pagination.showing"
  | "activity.pagination.totalCount"
  | "activity.pagination.prev"
  | "activity.pagination.next"
  | "activity.pagination.page"
  | "downloads.breadcrumbTitle"
  | "downloads.timeRange"
  | "downloads.period.1d"
  | "downloads.period.7d"
  | "downloads.period.30d"
  | "downloads.period.90d"
  | "downloads.period.1y"
  | "downloads.cards.totalDownloads"
  | "downloads.cards.noteWithPeriod"
  | "downloads.cards.average"
  | "downloads.cards.perDay"
  | "downloads.cards.peak"
  | "downloads.cards.peakNote"
  | "downloads.cards.totalResources"
  | "downloads.cards.resourcesNote"
  | "downloads.chart.title"
  | "downloads.chart.loading"
  | "downloads.chart.empty"
  | "downloads.chart.barTitle"
  | "downloads.chart.legend"
  | "downloads.chart.totalLine"
  | "downloads.top.title"
  | "downloads.top.loading"
  | "downloads.top.empty"
  | "downloads.table.title"
  | "downloads.table.loading"
  | "downloads.table.empty"
  | "downloads.table.colNo"
  | "downloads.table.colName"
  | "downloads.table.colType"
  | "downloads.table.colDownloads"
  | "downloads.table.colStatus"
  | "downloads.table.statusActive"
  | "resources.breadcrumbTitle"
  | "resources.pageTitle"
  | "resources.pageSubtitle"
  | "resources.exportCsv"
  | "resources.addNew"
  | "resources.refresh"
  | "resources.errorLoad"
  | "resources.deleteError"
  | "resources.stats.total"
  | "resources.stats.active"
  | "resources.stats.pending"
  | "resources.stats.filtered"
  | "resources.searchPlaceholder"
  | "resources.viewTable"
  | "resources.viewGrid"
  | "resources.resetFilters"
  | "resources.loading"
  | "resources.retry"
  | "resources.empty.title"
  | "resources.empty.hintFiltered"
  | "resources.empty.hintNone"
  | "resources.col.name"
  | "resources.col.version"
  | "resources.col.status"
  | "resources.col.platform"
  | "resources.col.createdAt"
  | "resources.col.actions"
  | "resources.status.deleted"
  | "resources.status.active"
  | "resources.status.pending"
  | "resources.status.approved"
  | "resources.status.rejected"
  | "resources.pending.notice"
  | "resources.pending.noShareDownload"
  | "resources.action.download"
  | "resources.action.removeFavorite"
  | "resources.action.addFavorite"
  | "resources.action.removeBookmark"
  | "resources.action.addBookmark"
  | "resources.action.viewDetail"
  | "resources.action.delete"
  | "resources.action.edit"
  | "resources.action.favorite"
  | "resources.deleteConfirm.title"
  | "resources.deleteConfirm.message"
  | "resources.deleteConfirm.cancel"
  | "resources.deleteConfirm.confirm"
  | "resources.na"
  | "resources.csv.id"
  | "resources.csv.name"
  | "resources.csv.version"
  | "resources.csv.url"
  | "resources.csv.status"
  | "resources.csv.platform"
  | "resources.csv.productType"
  | "resources.csv.createdAt"
  | "resources.pagination.showing"
  | "resources.pagination.totalCount"
  | "resources.pagination.prev"
  | "resources.pagination.next"
  | "resources.pagination.page"
  | "downloaded.breadcrumbDownloaded"
  | "downloaded.breadcrumbMyDownloads"
  | "downloaded.pageTitleDownloaded"
  | "downloaded.pageTitleMyDownloads"
  | "downloaded.pageDescDownloaded"
  | "downloaded.pageDescMyDownloads"
  | "downloaded.badgeLocal"
  | "downloaded.historyCount"
  | "downloaded.afterFilter"
  | "downloaded.exportCsv"
  | "downloaded.linkDownloaded"
  | "downloaded.linkResourceList"
  | "downloaded.clearAllTitle"
  | "downloaded.clearAllShort"
  | "downloaded.clearAllLong"
  | "downloaded.stats.total"
  | "downloaded.stats.thisWeek"
  | "downloaded.stats.thisMonth"
  | "downloaded.stats.filtered"
  | "downloaded.searchPlaceholder"
  | "downloaded.dateRange.all"
  | "downloaded.dateRange.7d"
  | "downloaded.dateRange.30d"
  | "downloaded.viewTable"
  | "downloaded.viewGrid"
  | "downloaded.resetFilters"
  | "downloaded.empty.title"
  | "downloaded.empty.hint"
  | "downloaded.empty.goResources"
  | "downloaded.empty.suggestions"
  | "downloaded.empty.loading"
  | "downloaded.empty.downloadCount"
  | "downloaded.col.name"
  | "downloaded.col.version"
  | "downloaded.col.downloadedAt"
  | "downloaded.col.actions"
  | "downloaded.action.detail"
  | "downloaded.action.redownload"
  | "downloaded.action.remove"
  | "downloaded.pagination.showing"
  | "downloaded.pagination.totalCount"
  | "downloaded.pagination.prev"
  | "downloaded.pagination.next"
  | "downloaded.pagination.page"
  | "downloaded.removeConfirm.title"
  | "downloaded.removeConfirm.message"
  | "downloaded.clearConfirm.title"
  | "downloaded.clearConfirm.message"
  | "downloaded.confirm.cancel"
  | "downloaded.confirm.remove"
  | "downloaded.confirm.clearAll"
  | "downloaded.csv.filename"
  | "downloaded.csv.downloadedAt"
  | "favorites.breadcrumbFavorites"
  | "favorites.breadcrumbMyFavorites"
  | "favorites.pageTitleFavorites"
  | "favorites.pageTitleMyFavorites"
  | "favorites.pageDescFavorites"
  | "favorites.pageDescMyFavorites"
  | "favorites.badgeLocal"
  | "favorites.count"
  | "favorites.afterFilter"
  | "favorites.exportCsv"
  | "favorites.linkFavorites"
  | "favorites.linkResourceList"
  | "favorites.clearAllTitle"
  | "favorites.clearAllShort"
  | "favorites.clearAllLong"
  | "favorites.stats.total"
  | "favorites.stats.thisWeek"
  | "favorites.stats.thisMonth"
  | "favorites.stats.filtered"
  | "favorites.searchPlaceholder"
  | "favorites.dateRange.all"
  | "favorites.dateRange.7d"
  | "favorites.dateRange.30d"
  | "favorites.viewTable"
  | "favorites.viewGrid"
  | "favorites.resetFilters"
  | "favorites.empty.title"
  | "favorites.empty.hint"
  | "favorites.empty.goResources"
  | "favorites.col.name"
  | "favorites.col.version"
  | "favorites.col.addedAt"
  | "favorites.col.actions"
  | "favorites.action.detail"
  | "favorites.action.download"
  | "favorites.action.unfavorite"
  | "favorites.action.deleteResource"
  | "favorites.grid.download"
  | "favorites.pagination.showing"
  | "favorites.pagination.totalCount"
  | "favorites.pagination.prev"
  | "favorites.pagination.next"
  | "favorites.pagination.page"
  | "favorites.removeConfirm.title"
  | "favorites.removeConfirm.message"
  | "favorites.deleteConfirm.title"
  | "favorites.deleteConfirm.message"
  | "favorites.clearConfirm.title"
  | "favorites.clearConfirm.message"
  | "favorites.confirm.cancel"
  | "favorites.confirm.unfavorite"
  | "favorites.confirm.deleteResource"
  | "favorites.confirm.clearAll"
  | "favorites.csv.filename"
  | "favorites.csv.addedAt";

const vi: Record<TranslationKey, string> = {
  "settings.title": "Cài đặt",
  "settings.generalTitle": "Cài đặt chung",
  "settings.generalDesc":
    "Tùy chỉnh giao diện, ngôn ngữ và một số tùy chọn hiển thị. Dữ liệu được lưu trên máy chủ theo tài khoản của bạn.",
  "settings.loading": "Đang tải cài đặt…",
  "settings.nav.profile": "Hồ sơ",
  "settings.nav.editProfile": "Sửa hồ sơ",
  "settings.nav.password": "Mật khẩu",
  "settings.ui.title": "Giao diện",
  "settings.ui.desc": "Chế độ sáng / tối (áp dụng khi ứng dụng hỗ trợ theme).",
  "settings.ui.themeLabel": "Theme",
  "settings.ui.theme.light": "Sáng",
  "settings.ui.theme.dark": "Tối",
  "settings.ui.theme.system": "Theo hệ thống",
  "settings.lang.title": "Ngôn ngữ",
  "settings.lang.desc": "Ngôn ngữ hiển thị giao diện (một số trang có thể chưa dịch hết).",
  "settings.lang.label": "Ngôn ngữ",
  "settings.table.title": "Danh sách & bảng",
  "settings.table.desc": "Tùy chọn hiển thị dữ liệu dạng bảng trên các trang danh sách.",
  "settings.table.dense.label": "Giao diện thu gọn (dense)",
  "settings.table.dense.desc": "Giảm khoảng cách dòng trong bảng khi trang hỗ trợ.",
  "settings.table.pageSize.label": "Số dòng mặc định / trang (10–100)",
  "settings.help.title": "Trợ giúp & thông báo",
  "settings.help.desc": "Điều khiển gợi ý và cập nhật liên quan tài nguyên.",
  "settings.help.dashboardTips.label": "Gợi ý trên Dashboard",
  "settings.help.dashboardTips.desc": "Hiển thị mẹo / hướng dẫn nhanh khi có.",
  "settings.help.notifyUpdates.label": "Thông báo cập nhật tài nguyên",
  "settings.help.notifyUpdates.desc":
    "Bật kênh thông báo trong ứng dụng khi có thay đổi liên quan (nếu hệ thống hỗ trợ).",
  "settings.footer.note": "Nhấn Lưu để ghi lên máy chủ.",
  "settings.footer.notificationsLink": "Trang thông báo",
  "settings.actions.reset": "Mặc định",
  "settings.actions.save": "Lưu cài đặt",
  "settings.actions.saving": "Đang lưu…",
  "settings.toast.saved": "Đã lưu cài đặt.",
  "settings.toast.saveFailed": "Lưu thất bại.",
  "settings.toast.resetOk": "Đã khôi phục mặc định.",
  "settings.toast.resetFailed": "Không khôi phục được.",
  "settings.toast.loadFailed": "Không tải được cài đặt.",
  "dashboard.breadcrumbTitle": "Tổng quan hệ thống",
  "dashboard.cards.totalResources": "Tổng tài nguyên",
  "dashboard.cards.uploadsToday": "Upload hôm nay",
  "dashboard.cards.totalDownloads": "Lượt tải xuống",
  "dashboard.cards.pendingReview": "File đang kiểm duyệt",
  "dashboard.sections.recentActivity": "Hoạt động gần đây",
  "dashboard.sections.fileTypeStats": "Thống kê theo loại file",
  "dashboard.sections.topDownloads": "Top tài nguyên tải xuống",
  "dashboard.sections.storageUsage": "Storage Usage",
  "dashboard.sections.security": "Bảo mật",
  "dashboard.loadingShort": "Đang tải...",
  "dashboard.empty.noActivity": "Chưa có hoạt động nào",
  "dashboard.empty.noStats": "Chưa có dữ liệu thống kê",
  "dashboard.empty.noData": "Chưa có dữ liệu",
  "dashboard.downloads.unit": "lượt",
  "dashboard.storage.used": "Used Space",
  "dashboard.storage.available": "Available",
  "dashboard.storage.percentUsed": "% sử dụng",
  "dashboard.security.filesScanned": "Files Scanned",
  "dashboard.security.cleanFiles": "Clean Files",
  "dashboard.security.infectedFiles": "Infected Files",
  "dashboard.welcome.title": "Chào mừng trở lại, {name}!",
  "dashboard.welcome.adminDesc": "Bạn có quyền truy cập đầy đủ vào hệ thống quản lý tài nguyên số.",
  "dashboard.welcome.userDesc": "Hệ thống quản lý tài nguyên số đã sẵn sàng để hỗ trợ công việc của bạn.",
  "menu.group.dashboard": "DASHBOARD",
  "menu.group.resources": "QUẢN LÝ TÀI NGUYÊN",
  "menu.group.searchAndCategories": "TÌM KIẾM & PHÂN LOẠI",
  "menu.group.personal": "CÁ NHÂN",
  "menu.group.adminPanel": "ADMIN PANEL",
  "menu.group.advancedResourceAdmin": "QUẢN LÝ TÀI NGUYÊN NÂNG CAO",
  "menu.group.advancedConfig": "CẤU HÌNH NÂNG CAO",
  "menu.item.home": "Trang chủ",
  "menu.item.myResources": "Tài nguyên của tôi",
  "menu.item.upload": "Upload tài nguyên",
  "menu.item.fileTypes": "Loại file",
  "menu.item.search": "Tìm kiếm",
  "menu.item.categories": "Danh mục",
  "menu.item.profile": "Thông tin cá nhân",
  "menu.item.activity": "Hoạt động",
  "menu.item.adminUsers": "Quản lý người dùng",
  "menu.item.adminSystem": "Quản lý hệ thống",
  "menu.item.adminReports": "Báo cáo quản trị",
  "menu.item.adminResources": "Quản lý tài nguyên",
  "menu.item.adminStorage": "Quản lý Storage",
  "menu.item.adminSecurity": "Bảo mật hệ thống",
  "menu.item.integrations": "Tích hợp & API",
  "menu.item.monitoring": "Monitoring & Analytics",
  "menu.link.systemOverview": "Tổng quan hệ thống",
  "menu.link.downloadStats": "Thống kê tải xuống",
  "menu.link.recentActivity": "Hoạt động gần đây",
  "menu.link.resourceList": "Danh sách tài nguyên",
  "menu.link.downloadedResources": "Tài nguyên đã tải",
  "menu.link.favoriteResources": "Tài nguyên yêu thích",
  "menu.link.newUpload": "Upload mới",
  "menu.link.uploadHistory": "Lịch sử upload",
  "menu.link.processingQueue": "Queue xử lý",
  "menu.link.advancedSearch": "Tìm kiếm nâng cao",
  "menu.link.filters": "Bộ lọc",
  "menu.link.searchHistory": "Lịch sử tìm kiếm",
  "menu.link.mainCategories": "Danh mục chính",
  "menu.link.changePassword": "Đổi mật khẩu",
  "menu.link.settings": "Cài đặt",
  "menu.link.downloadHistory": "Lịch sử tải xuống",
  "menu.link.bookmarks": "Bookmark",
  "menu.link.userList": "Danh sách người dùng",
  "menu.link.permissions": "Phân quyền",
  "menu.link.systemConfig": "Cấu hình hệ thống",
  "menu.link.systemLogs": "Log hệ thống",
  "menu.link.overviewReports": "Báo cáo tổng quan",
  "menu.link.detailedStats": "Thống kê chi tiết",
  "menu.link.allResources": "Tất cả tài nguyên",
  "menu.actions.logout": "Đăng xuất",
  "header.searchTooltip": "Tìm kiếm (Ctrl+K)",
  "header.settingsTooltip": "Cài đặt",
  "header.accountLabel": "Tài khoản",
  "header.profileSubtitle": "Xem và chỉnh sửa hồ sơ",
  "header.passwordSubtitle": "Cập nhật mật khẩu",
  "header.logoutSubtitle": "Thoát khỏi tài khoản",
  "menu.user.editProfile": "Chỉnh sửa hồ sơ",
  "menu.user.defaultName": "Người dùng",
  "activity.breadcrumbTitle": "Lịch sử hoạt động",
  "activity.pageTitle": "Tất cả hoạt động",
  "activity.pageSubtitle": "Theo dõi và quản lý tất cả hoạt động trong hệ thống",
  "activity.exportCsv": "Xuất CSV",
  "activity.refresh": "Làm mới",
  "activity.searchPlaceholder": "Tìm kiếm theo tên file, thông điệp...",
  "activity.filterAll": "Tất cả",
  "activity.type.upload": "Upload",
  "activity.type.pending": "Chờ duyệt",
  "activity.type.approved": "Đã duyệt",
  "activity.type.rejected": "Từ chối",
  "activity.type.other": "Khác",
  "activity.resetFilters": "Xóa bộ lọc",
  "activity.stats.totalActivities": "Tổng hoạt động",
  "activity.stats.upload": "Upload",
  "activity.stats.pending": "Chờ duyệt",
  "activity.stats.approved": "Đã duyệt",
  "activity.errorLoad": "Không thể tải dữ liệu hoạt động. Vui lòng thử lại sau.",
  "activity.loading": "Đang tải dữ liệu...",
  "activity.retry": "Thử lại",
  "activity.empty.title": "Không tìm thấy hoạt động nào",
  "activity.empty.hintFiltered": "Thử thay đổi bộ lọc của bạn",
  "activity.empty.hintNone": "Chưa có hoạt động nào trong hệ thống",
  "activity.col.type": "Loại",
  "activity.col.message": "Thông điệp",
  "activity.col.fileName": "Tên file",
  "activity.col.format": "Định dạng",
  "activity.col.timeAgo": "Thời gian",
  "activity.col.createdAt": "Ngày tạo",
  "activity.na": "N/A",
  "activity.csv.id": "ID",
  "activity.csv.type": "Loại",
  "activity.csv.message": "Thông điệp",
  "activity.csv.fileName": "Tên file",
  "activity.csv.format": "Định dạng",
  "activity.csv.timeAgo": "Thời gian",
  "activity.csv.createdAt": "Ngày tạo",
  "activity.pagination.showing": "Hiển thị:",
  "activity.pagination.totalCount": "/ Tổng {count} hoạt động",
  "activity.pagination.prev": "Trước",
  "activity.pagination.next": "Sau",
  "activity.pagination.page": "Trang {current} / {total}",
  "downloads.breadcrumbTitle": "Thống kê tải xuống",
  "downloads.timeRange": "Khoảng thời gian:",
  "downloads.period.1d": "Hôm nay",
  "downloads.period.7d": "7 ngày qua",
  "downloads.period.30d": "30 ngày qua",
  "downloads.period.90d": "90 ngày qua",
  "downloads.period.1y": "1 năm qua",
  "downloads.cards.totalDownloads": "Tổng lượt tải",
  "downloads.cards.noteWithPeriod": "Trong {period}",
  "downloads.cards.average": "Trung bình",
  "downloads.cards.perDay": "Lượt tải/ngày",
  "downloads.cards.peak": "Cao nhất",
  "downloads.cards.peakNote": "Lượt tải cao nhất",
  "downloads.cards.totalResources": "Tổng tài nguyên",
  "downloads.cards.resourcesNote": "Tài nguyên có sẵn",
  "downloads.chart.title": "Biểu đồ tải xuống",
  "downloads.chart.loading": "Đang tải dữ liệu...",
  "downloads.chart.empty": "Chưa có dữ liệu tải xuống",
  "downloads.chart.barTitle": "{label}: {count} lượt tải",
  "downloads.chart.legend": "Lượt tải xuống",
  "downloads.chart.totalLine": "Tổng: {count} lượt",
  "downloads.top.title": "Top tải xuống",
  "downloads.top.loading": "Đang tải...",
  "downloads.top.empty": "Chưa có dữ liệu",
  "downloads.table.title": "Danh sách tài nguyên tải xuống",
  "downloads.table.loading": "Đang tải...",
  "downloads.table.empty": "Chưa có tài nguyên nào",
  "downloads.table.colNo": "STT",
  "downloads.table.colName": "Tên tài nguyên",
  "downloads.table.colType": "Loại file",
  "downloads.table.colDownloads": "Lượt tải",
  "downloads.table.colStatus": "Trạng thái",
  "downloads.table.statusActive": "Hoạt động",
  "resources.breadcrumbTitle": "Tài nguyên của tôi",
  "resources.pageTitle": "Tài nguyên của tôi",
  "resources.pageSubtitle": "Quản lý và theo dõi các tài nguyên bạn đã đăng lên",
  "resources.exportCsv": "Xuất CSV",
  "resources.addNew": "Thêm mới",
  "resources.refresh": "Làm mới",
  "resources.errorLoad": "Không thể tải danh sách tài nguyên. Vui lòng thử lại sau.",
  "resources.deleteError": "Không thể xóa tài nguyên. Vui lòng thử lại.",
  "resources.stats.total": "Tổng tài nguyên",
  "resources.stats.active": "Đang hoạt động",
  "resources.stats.pending": "Chờ duyệt",
  "resources.stats.filtered": "Đã lọc",
  "resources.searchPlaceholder": "Tìm kiếm theo tên, phiên bản, URL...",
  "resources.viewTable": "Bảng",
  "resources.viewGrid": "Lưới",
  "resources.resetFilters": "Xóa bộ lọc",
  "resources.loading": "Đang tải dữ liệu...",
  "resources.retry": "Thử lại",
  "resources.empty.title": "Không tìm thấy tài nguyên nào",
  "resources.empty.hintFiltered": "Thử thay đổi bộ lọc của bạn",
  "resources.empty.hintNone": "Chưa có tài nguyên nào trong hệ thống",
  "resources.col.name": "Tên",
  "resources.col.version": "Phiên bản",
  "resources.col.status": "Trạng thái",
  "resources.col.platform": "Platform",
  "resources.col.createdAt": "Ngày tạo",
  "resources.col.actions": "Thao tác",
  "resources.status.deleted": "Đã xóa",
  "resources.status.active": "Hoạt động",
  "resources.status.pending": "Chờ duyệt",
  "resources.status.approved": "Đã duyệt",
  "resources.status.rejected": "Từ chối",
  "resources.pending.notice": "Chờ duyệt — chưa thể chia sẻ cho người khác",
  "resources.pending.noShareDownload": "Chờ duyệt — chưa thể chia sẻ/tải",
  "resources.action.download": "Tải xuống",
  "resources.action.removeFavorite": "Bỏ yêu thích",
  "resources.action.addFavorite": "Thêm vào yêu thích",
  "resources.action.removeBookmark": "Bỏ bookmark",
  "resources.action.addBookmark": "Thêm bookmark",
  "resources.action.viewDetail": "Xem chi tiết",
  "resources.action.delete": "Xóa tài nguyên",
  "resources.action.edit": "Chỉnh sửa",
  "resources.action.favorite": "Yêu thích",
  "resources.deleteConfirm.title": "Xác nhận xóa",
  "resources.deleteConfirm.message": "Bạn có chắc chắn muốn xóa tài nguyên này? Hành động này không thể hoàn tác.",
  "resources.deleteConfirm.cancel": "Hủy",
  "resources.deleteConfirm.confirm": "Xóa",
  "resources.na": "N/A",
  "resources.csv.id": "ID",
  "resources.csv.name": "Tên",
  "resources.csv.version": "Phiên bản",
  "resources.csv.url": "URL",
  "resources.csv.status": "Trạng thái",
  "resources.csv.platform": "Platform",
  "resources.csv.productType": "Loại sản phẩm",
  "resources.csv.createdAt": "Ngày tạo",
  "resources.pagination.showing": "Hiển thị:",
  "resources.pagination.totalCount": "/ Tổng {count} tài nguyên",
  "resources.pagination.prev": "Trước",
  "resources.pagination.next": "Sau",
  "resources.pagination.page": "Trang {current} / {total}",
  "downloaded.breadcrumbDownloaded": "Tài nguyên đã tải",
  "downloaded.breadcrumbMyDownloads": "Lịch sử tải xuống",
  "downloaded.pageTitleDownloaded": "Tài nguyên đã tải",
  "downloaded.pageTitleMyDownloads": "Lịch sử tải xuống",
  "downloaded.pageDescDownloaded": "Lịch sử các tài nguyên bạn đã tải xuống từ hệ thống",
  "downloaded.pageDescMyDownloads":
    "Các tài nguyên bạn đã tải (lưu cục bộ trên trình duyệt). Dữ liệu trùng với mục Tài nguyên đã tải trong Quản lý tài nguyên.",
  "downloaded.badgeLocal": "Lưu cục bộ",
  "downloaded.historyCount": "{count} mục trong lịch sử",
  "downloaded.afterFilter": "· {count} sau lọc",
  "downloaded.exportCsv": "Xuất CSV",
  "downloaded.linkDownloaded": "Tài nguyên đã tải",
  "downloaded.linkResourceList": "Danh sách tài nguyên",
  "downloaded.clearAllTitle": "Xóa toàn bộ lịch sử đã lưu trên trình duyệt",
  "downloaded.clearAllShort": "Xóa toàn bộ lịch sử",
  "downloaded.clearAllLong": "Xóa hết lịch sử",
  "downloaded.stats.total": "Tổng đã tải",
  "downloaded.stats.thisWeek": "Tuần này",
  "downloaded.stats.thisMonth": "Tháng này",
  "downloaded.stats.filtered": "Kết quả lọc",
  "downloaded.searchPlaceholder": "Tìm theo tên, phiên bản...",
  "downloaded.dateRange.all": "Tất cả thời gian",
  "downloaded.dateRange.7d": "7 ngày qua",
  "downloaded.dateRange.30d": "30 ngày qua",
  "downloaded.viewTable": "Bảng",
  "downloaded.viewGrid": "Lưới",
  "downloaded.resetFilters": "Xóa bộ lọc",
  "downloaded.empty.title": "Chưa có tài nguyên đã tải",
  "downloaded.empty.hint": "Khi bạn tải xuống tài nguyên từ trang Tài nguyên của tôi, chúng sẽ xuất hiện tại đây.",
  "downloaded.empty.goResources": "Đi đến Tài nguyên của tôi",
  "downloaded.empty.suggestions": "Gợi ý tải nhiều",
  "downloaded.empty.loading": "Đang tải...",
  "downloaded.empty.downloadCount": "{count} lượt tải",
  "downloaded.col.name": "Tên",
  "downloaded.col.version": "Phiên bản",
  "downloaded.col.downloadedAt": "Ngày tải",
  "downloaded.col.actions": "Thao tác",
  "downloaded.action.detail": "Chi tiết",
  "downloaded.action.redownload": "Tải lại",
  "downloaded.action.remove": "Xóa khỏi lịch sử",
  "downloaded.pagination.showing": "Hiển thị:",
  "downloaded.pagination.totalCount": "/ Tổng {count}",
  "downloaded.pagination.prev": "Trước",
  "downloaded.pagination.next": "Sau",
  "downloaded.pagination.page": "Trang {current} / {total}",
  "downloaded.removeConfirm.title": "Xóa khỏi lịch sử",
  "downloaded.removeConfirm.message":
    "Bạn có chắc muốn xóa mục này khỏi danh sách tài nguyên đã tải? File đã tải vẫn nằm trên máy bạn.",
  "downloaded.clearConfirm.title": "Xóa toàn bộ lịch sử",
  "downloaded.clearConfirm.message": "Toàn bộ lịch sử tài nguyên đã tải sẽ bị xóa. Bạn có chắc chắn?",
  "downloaded.confirm.cancel": "Hủy",
  "downloaded.confirm.remove": "Xóa",
  "downloaded.confirm.clearAll": "Xóa tất cả",
  "downloaded.csv.filename": "tai_nguyen_da_tai",
  "downloaded.csv.downloadedAt": "Ngày tải",
  "favorites.breadcrumbFavorites": "Tài nguyên yêu thích",
  "favorites.breadcrumbMyFavorites": "Yêu thích của tôi",
  "favorites.pageTitleFavorites": "Tài nguyên yêu thích",
  "favorites.pageTitleMyFavorites": "Yêu thích của tôi",
  "favorites.pageDescFavorites": "Các tài nguyên bạn đã đánh dấu yêu thích để truy cập nhanh",
  "favorites.pageDescMyFavorites":
    "Danh sách đánh dấu yêu thích (lưu cục bộ trên trình duyệt). Đồng bộ với mục Tài nguyên yêu thích trong Quản lý tài nguyên.",
  "favorites.badgeLocal": "Lưu cục bộ",
  "favorites.count": "{count} mục yêu thích",
  "favorites.afterFilter": "· {count} sau lọc",
  "favorites.exportCsv": "Xuất CSV",
  "favorites.linkFavorites": "Tài nguyên yêu thích",
  "favorites.linkResourceList": "Danh sách tài nguyên",
  "favorites.clearAllTitle": "Bỏ đánh dấu yêu thích cho toàn bộ danh sách đã lưu trên trình duyệt",
  "favorites.clearAllShort": "Bỏ tất cả yêu thích",
  "favorites.clearAllLong": "Bỏ hết yêu thích",
  "favorites.stats.total": "Tổng yêu thích",
  "favorites.stats.thisWeek": "Thêm tuần này",
  "favorites.stats.thisMonth": "Thêm tháng này",
  "favorites.stats.filtered": "Kết quả lọc",
  "favorites.searchPlaceholder": "Tìm theo tên, phiên bản...",
  "favorites.dateRange.all": "Tất cả thời gian",
  "favorites.dateRange.7d": "7 ngày qua",
  "favorites.dateRange.30d": "30 ngày qua",
  "favorites.viewTable": "Bảng",
  "favorites.viewGrid": "Lưới",
  "favorites.resetFilters": "Xóa bộ lọc",
  "favorites.empty.title": "Chưa có tài nguyên yêu thích",
  "favorites.empty.hint":
    "Bạn có thể đánh dấu yêu thích từ trang Tài nguyên của tôi (icon trái tim) để xem nhanh tại đây.",
  "favorites.empty.goResources": "Đi đến Tài nguyên của tôi",
  "favorites.col.name": "Tên",
  "favorites.col.version": "Phiên bản",
  "favorites.col.addedAt": "Ngày thêm",
  "favorites.col.actions": "Thao tác",
  "favorites.action.detail": "Chi tiết",
  "favorites.action.download": "Tải xuống",
  "favorites.action.unfavorite": "Bỏ yêu thích",
  "favorites.action.deleteResource": "Xóa tài nguyên",
  "favorites.grid.download": "Tải xuống",
  "favorites.pagination.showing": "Hiển thị:",
  "favorites.pagination.totalCount": "/ Tổng {count}",
  "favorites.pagination.prev": "Trước",
  "favorites.pagination.next": "Sau",
  "favorites.pagination.page": "Trang {current} / {total}",
  "favorites.removeConfirm.title": "Bỏ khỏi yêu thích",
  "favorites.removeConfirm.message": "Bạn có chắc muốn bỏ mục này khỏi danh sách yêu thích?",
  "favorites.deleteConfirm.title": "Xóa tài nguyên",
  "favorites.deleteConfirm.message":
    "Tài nguyên sẽ bị xóa khỏi hệ thống và khỏi danh sách yêu thích. Bạn có chắc chắn?",
  "favorites.clearConfirm.title": "Bỏ tất cả yêu thích",
  "favorites.clearConfirm.message":
    "Toàn bộ mục sẽ bị bỏ khỏi danh sách yêu thích đã lưu trên trình duyệt (không xóa tài khoản hay máy chủ).",
  "favorites.confirm.cancel": "Hủy",
  "favorites.confirm.unfavorite": "Bỏ yêu thích",
  "favorites.confirm.deleteResource": "Xóa tài nguyên",
  "favorites.confirm.clearAll": "Bỏ tất cả",
  "favorites.csv.filename": "tai_nguyen_yeu_thich",
  "favorites.csv.addedAt": "Ngày thêm",
};

const en: Record<TranslationKey, string> = {
  "settings.title": "Settings",
  "settings.generalTitle": "General settings",
  "settings.generalDesc":
    "Customize appearance, language, and other display preferences. Your settings are saved on the server for your account.",
  "settings.loading": "Loading settings…",
  "settings.nav.profile": "Profile",
  "settings.nav.editProfile": "Edit profile",
  "settings.nav.password": "Password",
  "settings.ui.title": "Appearance",
  "settings.ui.desc": "Light / dark mode (applies when the app supports theming).",
  "settings.ui.themeLabel": "Theme",
  "settings.ui.theme.light": "Light",
  "settings.ui.theme.dark": "Dark",
  "settings.ui.theme.system": "System",
  "settings.lang.title": "Language",
  "settings.lang.desc": "UI language (some pages may not be fully translated yet).",
  "settings.lang.label": "Language",
  "settings.table.title": "Lists & tables",
  "settings.table.desc": "Table display preferences for list pages.",
  "settings.table.dense.label": "Compact density",
  "settings.table.dense.desc": "Reduce row spacing where supported.",
  "settings.table.pageSize.label": "Default rows per page (10–100)",
  "settings.help.title": "Help & notifications",
  "settings.help.desc": "Control hints and resource-related updates.",
  "settings.help.dashboardTips.label": "Dashboard tips",
  "settings.help.dashboardTips.desc": "Show quick tips when available.",
  "settings.help.notifyUpdates.label": "Resource update notifications",
  "settings.help.notifyUpdates.desc":
    "Enable in-app notifications when related changes happen (if supported).",
  "settings.footer.note": "Press Save to persist to the server.",
  "settings.footer.notificationsLink": "Notifications",
  "settings.actions.reset": "Reset",
  "settings.actions.save": "Save settings",
  "settings.actions.saving": "Saving…",
  "settings.toast.saved": "Settings saved.",
  "settings.toast.saveFailed": "Save failed.",
  "settings.toast.resetOk": "Restored defaults.",
  "settings.toast.resetFailed": "Could not restore defaults.",
  "settings.toast.loadFailed": "Could not load settings.",
  "dashboard.breadcrumbTitle": "System overview",
  "dashboard.cards.totalResources": "Total resources",
  "dashboard.cards.uploadsToday": "Uploads today",
  "dashboard.cards.totalDownloads": "Total downloads",
  "dashboard.cards.pendingReview": "Files pending review",
  "dashboard.sections.recentActivity": "Recent activity",
  "dashboard.sections.fileTypeStats": "File type statistics",
  "dashboard.sections.topDownloads": "Top downloaded resources",
  "dashboard.sections.storageUsage": "Storage usage",
  "dashboard.sections.security": "Security",
  "dashboard.loadingShort": "Loading...",
  "dashboard.empty.noActivity": "No recent activity",
  "dashboard.empty.noStats": "No statistics available",
  "dashboard.empty.noData": "No data",
  "dashboard.downloads.unit": "downloads",
  "dashboard.storage.used": "Used space",
  "dashboard.storage.available": "Available",
  "dashboard.storage.percentUsed": "% used",
  "dashboard.security.filesScanned": "Files scanned",
  "dashboard.security.cleanFiles": "Clean files",
  "dashboard.security.infectedFiles": "Infected files",
  "dashboard.welcome.title": "Welcome back, {name}!",
  "dashboard.welcome.adminDesc": "You have full access to the digital resource management system.",
  "dashboard.welcome.userDesc": "The digital resource management system is ready to support your work.",
  "menu.group.dashboard": "DASHBOARD",
  "menu.group.resources": "RESOURCE MANAGEMENT",
  "menu.group.searchAndCategories": "SEARCH & CATEGORIES",
  "menu.group.personal": "PERSONAL",
  "menu.group.adminPanel": "ADMIN PANEL",
  "menu.group.advancedResourceAdmin": "ADVANCED RESOURCE ADMIN",
  "menu.group.advancedConfig": "ADVANCED CONFIG",
  "menu.item.home": "Home",
  "menu.item.myResources": "My resources",
  "menu.item.upload": "Upload",
  "menu.item.fileTypes": "File types",
  "menu.item.search": "Search",
  "menu.item.categories": "Categories",
  "menu.item.profile": "Profile",
  "menu.item.activity": "Activity",
  "menu.item.adminUsers": "User management",
  "menu.item.adminSystem": "System management",
  "menu.item.adminReports": "Admin reports",
  "menu.item.adminResources": "Resource management",
  "menu.item.adminStorage": "Storage management",
  "menu.item.adminSecurity": "System security",
  "menu.item.integrations": "Integrations & API",
  "menu.item.monitoring": "Monitoring & Analytics",
  "menu.link.systemOverview": "System overview",
  "menu.link.downloadStats": "Download statistics",
  "menu.link.recentActivity": "Recent activity",
  "menu.link.resourceList": "Resource list",
  "menu.link.downloadedResources": "Downloaded resources",
  "menu.link.favoriteResources": "Favorite resources",
  "menu.link.newUpload": "New upload",
  "menu.link.uploadHistory": "Upload history",
  "menu.link.processingQueue": "Processing queue",
  "menu.link.advancedSearch": "Advanced search",
  "menu.link.filters": "Filters",
  "menu.link.searchHistory": "Search history",
  "menu.link.mainCategories": "Main categories",
  "menu.link.changePassword": "Change password",
  "menu.link.settings": "Settings",
  "menu.link.downloadHistory": "Download history",
  "menu.link.bookmarks": "Bookmarks",
  "menu.link.userList": "User list",
  "menu.link.permissions": "Permissions",
  "menu.link.systemConfig": "System configuration",
  "menu.link.systemLogs": "System logs",
  "menu.link.overviewReports": "Overview reports",
  "menu.link.detailedStats": "Detailed statistics",
  "menu.link.allResources": "All resources",
  "menu.actions.logout": "Logout",
  "header.searchTooltip": "Search (Ctrl+K)",
  "header.settingsTooltip": "Settings",
  "header.accountLabel": "Account",
  "header.profileSubtitle": "View and edit your profile",
  "header.passwordSubtitle": "Update your password",
  "header.logoutSubtitle": "Sign out of your account",
  "menu.user.editProfile": "Edit profile",
  "menu.user.defaultName": "User",
  "activity.breadcrumbTitle": "Activity history",
  "activity.pageTitle": "All activity",
  "activity.pageSubtitle": "Track and manage all activity in the system",
  "activity.exportCsv": "Export CSV",
  "activity.refresh": "Refresh",
  "activity.searchPlaceholder": "Search by file name, message…",
  "activity.filterAll": "All",
  "activity.type.upload": "Upload",
  "activity.type.pending": "Pending",
  "activity.type.approved": "Approved",
  "activity.type.rejected": "Rejected",
  "activity.type.other": "Other",
  "activity.resetFilters": "Clear filters",
  "activity.stats.totalActivities": "Total activity",
  "activity.stats.upload": "Upload",
  "activity.stats.pending": "Pending",
  "activity.stats.approved": "Approved",
  "activity.errorLoad": "Could not load activity data. Please try again later.",
  "activity.loading": "Loading data…",
  "activity.retry": "Try again",
  "activity.empty.title": "No activity found",
  "activity.empty.hintFiltered": "Try changing your filters",
  "activity.empty.hintNone": "There is no activity in the system yet",
  "activity.col.type": "Type",
  "activity.col.message": "Message",
  "activity.col.fileName": "File name",
  "activity.col.format": "Format",
  "activity.col.timeAgo": "Time",
  "activity.col.createdAt": "Created",
  "activity.na": "N/A",
  "activity.csv.id": "ID",
  "activity.csv.type": "Type",
  "activity.csv.message": "Message",
  "activity.csv.fileName": "File name",
  "activity.csv.format": "Format",
  "activity.csv.timeAgo": "Time",
  "activity.csv.createdAt": "Created",
  "activity.pagination.showing": "Show:",
  "activity.pagination.totalCount": "· Total {count} items",
  "activity.pagination.prev": "Previous",
  "activity.pagination.next": "Next",
  "activity.pagination.page": "Page {current} / {total}",
  "downloads.breadcrumbTitle": "Download statistics",
  "downloads.timeRange": "Time range:",
  "downloads.period.1d": "Today",
  "downloads.period.7d": "Last 7 days",
  "downloads.period.30d": "Last 30 days",
  "downloads.period.90d": "Last 90 days",
  "downloads.period.1y": "Last year",
  "downloads.cards.totalDownloads": "Total downloads",
  "downloads.cards.noteWithPeriod": "During {period}",
  "downloads.cards.average": "Average",
  "downloads.cards.perDay": "Downloads per day",
  "downloads.cards.peak": "Peak",
  "downloads.cards.peakNote": "Peak downloads",
  "downloads.cards.totalResources": "Total resources",
  "downloads.cards.resourcesNote": "Resources available",
  "downloads.chart.title": "Download chart",
  "downloads.chart.loading": "Loading data...",
  "downloads.chart.empty": "No download data yet",
  "downloads.chart.barTitle": "{label}: {count} downloads",
  "downloads.chart.legend": "Downloads",
  "downloads.chart.totalLine": "Total: {count} downloads",
  "downloads.top.title": "Top downloads",
  "downloads.top.loading": "Loading...",
  "downloads.top.empty": "No data",
  "downloads.table.title": "Downloaded resources",
  "downloads.table.loading": "Loading...",
  "downloads.table.empty": "No resources yet",
  "downloads.table.colNo": "#",
  "downloads.table.colName": "Resource name",
  "downloads.table.colType": "File type",
  "downloads.table.colDownloads": "Downloads",
  "downloads.table.colStatus": "Status",
  "downloads.table.statusActive": "Active",
  "resources.breadcrumbTitle": "My resources",
  "resources.pageTitle": "My resources",
  "resources.pageSubtitle": "Manage and track resources you have uploaded",
  "resources.exportCsv": "Export CSV",
  "resources.addNew": "Add new",
  "resources.refresh": "Refresh",
  "resources.errorLoad": "Could not load resources. Please try again later.",
  "resources.deleteError": "Could not delete resource. Please try again.",
  "resources.stats.total": "Total resources",
  "resources.stats.active": "Active",
  "resources.stats.pending": "Pending",
  "resources.stats.filtered": "Filtered",
  "resources.searchPlaceholder": "Search by name, version, URL…",
  "resources.viewTable": "Table",
  "resources.viewGrid": "Grid",
  "resources.resetFilters": "Clear filters",
  "resources.loading": "Loading data…",
  "resources.retry": "Try again",
  "resources.empty.title": "No resources found",
  "resources.empty.hintFiltered": "Try changing your filters",
  "resources.empty.hintNone": "No resources in the system yet",
  "resources.col.name": "Name",
  "resources.col.version": "Version",
  "resources.col.status": "Status",
  "resources.col.platform": "Platform",
  "resources.col.createdAt": "Created",
  "resources.col.actions": "Actions",
  "resources.status.deleted": "Deleted",
  "resources.status.active": "Active",
  "resources.status.pending": "Pending",
  "resources.status.approved": "Approved",
  "resources.status.rejected": "Rejected",
  "resources.pending.notice": "Pending approval — cannot share with others yet",
  "resources.pending.noShareDownload": "Pending approval — cannot share or download",
  "resources.action.download": "Download",
  "resources.action.removeFavorite": "Remove from favorites",
  "resources.action.addFavorite": "Add to favorites",
  "resources.action.removeBookmark": "Remove bookmark",
  "resources.action.addBookmark": "Add bookmark",
  "resources.action.viewDetail": "View details",
  "resources.action.delete": "Delete resource",
  "resources.action.edit": "Edit",
  "resources.action.favorite": "Favorite",
  "resources.deleteConfirm.title": "Confirm delete",
  "resources.deleteConfirm.message": "Are you sure you want to delete this resource? This action cannot be undone.",
  "resources.deleteConfirm.cancel": "Cancel",
  "resources.deleteConfirm.confirm": "Delete",
  "resources.na": "N/A",
  "resources.csv.id": "ID",
  "resources.csv.name": "Name",
  "resources.csv.version": "Version",
  "resources.csv.url": "URL",
  "resources.csv.status": "Status",
  "resources.csv.platform": "Platform",
  "resources.csv.productType": "Product type",
  "resources.csv.createdAt": "Created",
  "resources.pagination.showing": "Show:",
  "resources.pagination.totalCount": "· Total {count} resources",
  "resources.pagination.prev": "Previous",
  "resources.pagination.next": "Next",
  "resources.pagination.page": "Page {current} / {total}",
  "downloaded.breadcrumbDownloaded": "Downloaded resources",
  "downloaded.breadcrumbMyDownloads": "Download history",
  "downloaded.pageTitleDownloaded": "Downloaded resources",
  "downloaded.pageTitleMyDownloads": "Download history",
  "downloaded.pageDescDownloaded": "History of resources you have downloaded from the system",
  "downloaded.pageDescMyDownloads":
    "Resources you downloaded (stored locally in your browser). Same data as Downloaded resources under Resource management.",
  "downloaded.badgeLocal": "Local storage",
  "downloaded.historyCount": "{count} items in history",
  "downloaded.afterFilter": "· {count} after filter",
  "downloaded.exportCsv": "Export CSV",
  "downloaded.linkDownloaded": "Downloaded resources",
  "downloaded.linkResourceList": "Resource list",
  "downloaded.clearAllTitle": "Clear all history saved in the browser",
  "downloaded.clearAllShort": "Clear all history",
  "downloaded.clearAllLong": "Clear history",
  "downloaded.stats.total": "Total downloaded",
  "downloaded.stats.thisWeek": "This week",
  "downloaded.stats.thisMonth": "This month",
  "downloaded.stats.filtered": "Filtered results",
  "downloaded.searchPlaceholder": "Search by name, version…",
  "downloaded.dateRange.all": "All time",
  "downloaded.dateRange.7d": "Last 7 days",
  "downloaded.dateRange.30d": "Last 30 days",
  "downloaded.viewTable": "Table",
  "downloaded.viewGrid": "Grid",
  "downloaded.resetFilters": "Clear filters",
  "downloaded.empty.title": "No downloaded resources yet",
  "downloaded.empty.hint": "When you download resources from My resources, they will appear here.",
  "downloaded.empty.goResources": "Go to My resources",
  "downloaded.empty.suggestions": "Popular downloads",
  "downloaded.empty.loading": "Loading…",
  "downloaded.empty.downloadCount": "{count} downloads",
  "downloaded.col.name": "Name",
  "downloaded.col.version": "Version",
  "downloaded.col.downloadedAt": "Downloaded at",
  "downloaded.col.actions": "Actions",
  "downloaded.action.detail": "Details",
  "downloaded.action.redownload": "Download again",
  "downloaded.action.remove": "Remove from history",
  "downloaded.pagination.showing": "Show:",
  "downloaded.pagination.totalCount": "/ Total {count}",
  "downloaded.pagination.prev": "Previous",
  "downloaded.pagination.next": "Next",
  "downloaded.pagination.page": "Page {current} / {total}",
  "downloaded.removeConfirm.title": "Remove from history",
  "downloaded.removeConfirm.message":
    "Remove this item from your downloaded list? The file on your device will not be deleted.",
  "downloaded.clearConfirm.title": "Clear all history",
  "downloaded.clearConfirm.message": "All download history will be cleared. Are you sure?",
  "downloaded.confirm.cancel": "Cancel",
  "downloaded.confirm.remove": "Remove",
  "downloaded.confirm.clearAll": "Clear all",
  "downloaded.csv.filename": "downloaded_resources",
  "downloaded.csv.downloadedAt": "Downloaded at",
  "favorites.breadcrumbFavorites": "Favorite resources",
  "favorites.breadcrumbMyFavorites": "My favorites",
  "favorites.pageTitleFavorites": "Favorite resources",
  "favorites.pageTitleMyFavorites": "My favorites",
  "favorites.pageDescFavorites": "Resources you marked as favorites for quick access",
  "favorites.pageDescMyFavorites":
    "Your favorite bookmarks (stored locally in your browser). Same data as Favorite resources under Resource management.",
  "favorites.badgeLocal": "Local storage",
  "favorites.count": "{count} favorites",
  "favorites.afterFilter": "· {count} after filter",
  "favorites.exportCsv": "Export CSV",
  "favorites.linkFavorites": "Favorite resources",
  "favorites.linkResourceList": "Resource list",
  "favorites.clearAllTitle": "Remove all favorites saved in the browser",
  "favorites.clearAllShort": "Remove all favorites",
  "favorites.clearAllLong": "Clear all favorites",
  "favorites.stats.total": "Total favorites",
  "favorites.stats.thisWeek": "Added this week",
  "favorites.stats.thisMonth": "Added this month",
  "favorites.stats.filtered": "Filtered results",
  "favorites.searchPlaceholder": "Search by name, version…",
  "favorites.dateRange.all": "All time",
  "favorites.dateRange.7d": "Last 7 days",
  "favorites.dateRange.30d": "Last 30 days",
  "favorites.viewTable": "Table",
  "favorites.viewGrid": "Grid",
  "favorites.resetFilters": "Clear filters",
  "favorites.empty.title": "No favorite resources yet",
  "favorites.empty.hint":
    "Mark resources as favorites from My resources (heart icon) to see them here quickly.",
  "favorites.empty.goResources": "Go to My resources",
  "favorites.col.name": "Name",
  "favorites.col.version": "Version",
  "favorites.col.addedAt": "Added at",
  "favorites.col.actions": "Actions",
  "favorites.action.detail": "Details",
  "favorites.action.download": "Download",
  "favorites.action.unfavorite": "Remove favorite",
  "favorites.action.deleteResource": "Delete resource",
  "favorites.grid.download": "Download",
  "favorites.pagination.showing": "Show:",
  "favorites.pagination.totalCount": "/ Total {count}",
  "favorites.pagination.prev": "Previous",
  "favorites.pagination.next": "Next",
  "favorites.pagination.page": "Page {current} / {total}",
  "favorites.removeConfirm.title": "Remove from favorites",
  "favorites.removeConfirm.message": "Remove this item from your favorites list?",
  "favorites.deleteConfirm.title": "Delete resource",
  "favorites.deleteConfirm.message":
    "The resource will be deleted from the system and removed from favorites. Are you sure?",
  "favorites.clearConfirm.title": "Remove all favorites",
  "favorites.clearConfirm.message":
    "All items will be removed from your locally saved favorites (does not delete your account or server data).",
  "favorites.confirm.cancel": "Cancel",
  "favorites.confirm.unfavorite": "Remove favorite",
  "favorites.confirm.deleteResource": "Delete resource",
  "favorites.confirm.clearAll": "Remove all",
  "favorites.csv.filename": "favorite_resources",
  "favorites.csv.addedAt": "Added at",
};

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  vi,
  en,
};

