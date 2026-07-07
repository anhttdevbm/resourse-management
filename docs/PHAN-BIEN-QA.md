# Tài liệu phản biện đồ án — Resource Management System (RMS)

> **Thời lượng dự kiến:** 15–20 phút  
> **Đối tượng:** Giảng viên phản biện (hỏi về hệ thống, lý thuyết, một phần code)  
> **Mẹo trước khi vào phòng:** Mở sẵn `main.tsx`, `app.py`, `resource_service.py`, `AuthContext.tsx` — giảng viên hay bảo “chỉ cho thầy xem đoạn xử lý phân quyền / upload / login”.

---

## 0. Mở đầu (30–60 giây — nên thuộc lòng)

**Em xin phép trình bày tóm tắt đồ án:**

Đồ án xây dựng **Resource Management System (RMS)** — hệ thống quản lý tài nguyên số (APK, EXE, ISO, file khác) cho tổ chức. Hệ thống gồm:

- **Frontend:** React + TypeScript + Vite
- **Backend:** FastAPI + PostgreSQL
- **Lưu trữ file:** Local uploads + MinIO (S3-compatible)
- **Triển khai:** Docker Compose + Nginx reverse proxy

Các chức năng chính: quản lý tài nguyên, upload/download, phân loại & tag, phân quyền RBAC, thống kê dashboard, thông báo realtime, favorites/bookmarks, chia sẻ tài nguyên giữa user.

---

## 1. Câu hỏi tổng quan & mục tiêu đồ án

### Q1. Đồ án giải quyết bài toán gì? Tại sao cần RMS?

**Trả lời mẫu:**

Trong môi trường doanh nghiệp/phòng lab, file cài đặt (APK, EXE, ISO…) thường rải rác trên Drive, email, máy cá nhân → khó kiểm soát phiên bản, quyền truy cập và lịch sử tải.

RMS tập trung hóa:
- **Một nguồn tài nguyên duy nhất** (single source of truth)
- **Phân quyền theo vai trò** (ai được xem, upload, quản trị)
- **Theo dõi hoạt động** (download log, thống kê, lịch sử)
- **Quy trình upload/duyệt** (trạng thái tài nguyên)

---

### Q2. Phạm vi đồ án em làm đến đâu? Phần nào còn placeholder?

**Trả lời mẫu (trung thực — giảng viên thích sinh viên tự nhận hạn chế):**

**Đã hoàn thiện:**
- Auth (login, register, JWT, OAuth, quên mật khẩu)
- CRUD tài nguyên, upload/download, admin quản lý
- Phân loại: categories, tags, auto classification rules
- User activity: favorites, bookmarks, search/download history
- Dashboard thống kê (API + widget)
- Thông báo (REST + SSE stream)
- Chia sẻ tài nguyên (`resource_shares`)
- Deploy production bằng Docker

**Chưa hoàn thiện UI (có route/menu nhưng chưa có page thật):**
- Storage (backup/cleanup)
- Security scan reports
- Một số trang Reports/Activity/Settings admin

Em ưu tiên **backend + luồng nghiệp vụ lõi** trước, các module phụ sẽ phát triển tiếp.

---

### Q3. Điểm mới / đóng góp của đồ án so với “upload file đơn giản”?

**Trả lời mẫu:**

1. **Mô hình tài nguyên phong phú:** không chỉ file mà còn gắn stage, platform, product type, repo, status, tags.
2. **RBAC linh hoạt:** permission theo tên (`view_resources`, `manage_users`…), không hard-code role cứng.
3. **Auto classification:** rule theo pattern (tên file, extension…) tự gán metadata.
4. **Collaboration:** share tài nguyên kèm `can_edit`.
5. **Observability:** download log + statistics + notification realtime.

---

## 2. Kiến trúc hệ thống

### Q4. Em mô tả kiến trúc tổng thể?

**Trả lời mẫu:**

Hệ thống theo mô hình **Client–Server**, tách **Frontend SPA** và **Backend REST API**.

```
[Browser - React SPA]
        │ HTTPS / REST + SSE
        ▼
[Nginx] ──► [FastAPI API] ──► [PostgreSQL]
                │
                └──► [MinIO / local uploads]  (file binary)
```

**Backend phân lớp (Layered Architecture):**
- **Controller** — nhận HTTP request, validate input
- **Service** — business logic
- **Repository** — truy vấn DB
- **Model (SQLAlchemy)** — ánh xạ bảng

**Frontend:**
- **Pages** — màn hình
- **Services** — gọi API (axios)
- **Context/Redux** — auth state
- **ProtectedRoute** — kiểm tra đăng nhập & quyền

---

### Q5. Tại sao chọn FastAPI + React thay vì Django/Laravel monolith?

**Trả lời mẫu:**

| Lý do | Giải thích |
|-------|------------|
| **Tách FE/BE** | Frontend có thể scale/deploy độc lập; phù hợp SPA |
| **FastAPI** | Async-ready, auto OpenAPI/Swagger, type hints + Pydantic validate |
| **React** | Component tái sử dụng, ecosystem lớn, phù hợp dashboard phức tạp |
| **Team/dev** | Dễ phân công: 1 người API, 1 người UI |

**Nhược điểm đã chấp nhận:** phải tự xử lý CORS, auth cross-domain, deploy 2 service.

---

### Q6. Monorepo gồm những gì?

**Trả lời mẫu:**

```
resource-management/
├── font-end/     # React + Vite + TypeScript
├── back-end/     # FastAPI + Alembic migration
├── deploy/       # Docker Compose production
└── docs/         # Tài liệu
```

API prefix: `/resource-management`, auth: `/api/auth`.

---

## 3. Cơ sở dữ liệu

### Q7. Em thiết kế DB như thế nào? Có bao nhiêu bảng chính?

**Trả lời mẫu:**

Khoảng **21 entity**, nhóm theo nghiệp vụ:

| Nhóm | Bảng |
|------|------|
| User & Auth | `users`, `sessions`, `permissions`, `user_has_permissions`, `blacklist_tokens` |
| Resource core | `resources`, `resource_tags`, `resource_stages`, `resource_statuss`, `resource_platforms`, `product_types`, `package_repos`, `resource_has_resource_tags` |
| User activity | `user_favorites`, `user_bookmarks`, `search_history`, `download_logs` |
| Collaboration | `resource_shares` |
| System | `notifications`, `auto_classification_rules`, `system_info` |

**Quan hệ chính:**
- `resources` thuộc `users` (owner)
- Many-to-many: resource ↔ tag
- `user_favorites` / `user_bookmarks`: user ↔ resource (unique pair)
- `resource_shares`: resource ↔ shared user + `can_edit`

---

### Q8. `user_favorites`, `user_bookmarks`, `resource_shares` dùng để làm gì?

**Trả lời mẫu:**

| Bảng | Mục đích |
|------|----------|
| `user_favorites` | User đánh dấu tài nguyên yêu thích — truy cập nhanh |
| `user_bookmarks` | Bookmark + ghi chú cá nhân (`note`) — “xem sau” |
| `resource_shares` | Chủ file chia sẻ cho user khác; `can_edit` = quyền sửa |

**Phân biệt favorite vs bookmark:** Favorite = “thích/hay dùng”; Bookmark = “để lại + ghi chú”.

---

### Q9. `statistics` có phải bảng DB không?

**Trả lời mẫu:**

**Không.** Statistics là **dữ liệu tổng hợp tính runtime** từ `resources`, `users`, `download_logs`, `resource_statuss`. File `statistics.py` chỉ là **Pydantic response model**, không persist riêng → tránh duplicate data, luôn fresh.

---

### Q10. Soft delete dùng ở đâu? Tại sao?

**Trả lời mẫu:**

Bảng như `resources`, `users` có cột `is_deleted`. Khi xóa → đánh dấu `true` thay vì `DELETE` thật.

**Lý do:**
- Giữ lịch sử, audit
- Tránh mất FK/reference
- Admin có thể restore (API `POST /admin/resources/{id}/restore`)

---

## 4. Xác thực & phân quyền

### Q11. Em xác thực user như thế nào?

**Trả lời mẫu:**

**JWT (JSON Web Token):**
- Login → server trả `access_token` + `refresh_token`
- Access token gửi kèm header `Authorization: Bearer ...`
- Refresh token dùng lấy access token mới khi hết hạn
- Logout → token vào `blacklist_tokens` (không dùng lại được)

**Bổ sung:** OAuth (Google, Facebook, GitHub, Twitter), quên/reset password qua email.

**Code backend (phát hành token):**
```python
# auth_service.py
def login(val_input: str) -> Dict[str, str]:
    access_token = jwt_create_token(val_input)
    refresh_token = jwt_create_token(val_input, expires_minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    return {"access_token": access_token, "refresh_token": refresh_token}
```

---

### Q12. JWT là gì? Ưu nhược so với session cookie?

**Trả lời mẫu (lý thuyết):**

**JWT** = chuỗi mã hóa gồm header + payload + signature. Server **stateless** — không cần lưu session DB cho mỗi request (trừ blacklist khi logout).

| JWT | Session cookie |
|-----|----------------|
| Stateless, scale ngang dễ | Stateful, cần store session |
| Token có thể lộ → cần HTTPS, expiry ngắn | HttpOnly cookie an toàn hơn XSS |
| Khó revoke ngay (trừ blacklist) | Revoke session dễ |

Em dùng **JWT + blacklist** khi logout để cân bằng.

---

### Q13. Phân quyền (RBAC) hoạt động ra sao?

**Trả lời mẫu:**

**RBAC = Role-Based Access Control** (ở đây implement theo **permission name**, không cứng role enum):

1. Bảng `permissions` (vd: `view_resources`, `manage_users`, `AllAccess`)
2. Bảng `user_has_permissions` — gán quyền cho user
3. Backend: middleware/dependency kiểm tra token + quyền trước khi xử lý
4. Frontend: `ProtectedRoute` + `hasPermission()`

**Code frontend:**
```tsx
// ProtectedRoute.tsx
if (!isAuthenticated) return <Navigate to="/login" />;
if (requiredPermission && !hasPermission(requiredPermission))
  return <Navigate to="/unauthorized" />;
```

User có `AllAccess` → coi như admin, bypass mọi permission.

---

### Q14. Làm sao kiểm soát ai được tải file?

**Trả lời mẫu:**

Trong `download_resource()`:
1. **Chủ tài nguyên** (`resource.user_id == user.id`) → OK
2. **Admin** (`AllAccess`) → OK
3. **User được share** (có record `resource_shares`) → OK
4. Còn lại → `USER_NOT_PERMISSION`

Sau khi tải: ghi `download_logs` + tăng `download_count`.

---

## 5. Module nghiệp vụ

### Q15. Luồng upload tài nguyên?

**Trả lời mẫu:**

1. User gửi `multipart/form-data` (file + metadata: name, version, stage, platform…)
2. Backend validate (Pydantic schema)
3. Lưu file: ưu tiên local `/uploads/`, fallback MinIO/S3
4. Insert record `resources`
5. (Tuỳ rule) auto classification gán tag/status
6. Có thể tạo notification cho admin nếu cần duyệt

---

### Q16. Auto Classification là gì? Em implement thế nào?

**Trả lời mẫu:**

Hệ thống rule **theo thứ tự ưu tiên** (`sort_order`). Mỗi rule gồm:
- `match_field` — trường cần so (tên file, extension…)
- `match_op` — toán tử (contains, equals, regex…)
- `pattern` — giá trị so khớp
- `assign_*` — gán stage, platform, tag, status, repo…

Khi upload/update resource → duyệt rule enabled → rule match đầu tiên → auto gán metadata. Giảm nhập tay, thống nhất phân loại.

---

### Q17. Thông báo realtime em làm sao?

**Trả lời mẫu:**

- **REST:** `GET /notifications` — lấy danh sách phân trang
- **SSE (Server-Sent Events):** `GET /notifications/stream` — server push event xuống client

SSE phù hợp one-way (server → client), nhẹ hơn WebSocket cho use case “bell notification”.

Frontend: `useNotificationStream` hook + Redux `notificationSlice`.

---

### Q18. Dashboard thống kê lấy số liệu từ đâu?

**Trả lời mẫu:**

`StatisticsService` aggregate:
- Tổng resources, users, uploads hôm nay
- Top downloads (`download_count`)
- Phân bố loại file (parse extension từ URL)
- Download theo thời gian (`download_logs`)
- Security stats (dựa `resource_status`: pending, approved, rejected/virus)

**Lưu ý khi bị hỏi sâu:** storage usage hiện **ước tính** (avg 2GB/file), chưa đọc size thật từ MinIO — đây là hạn chế có thể nói thẳng.

---

## 6. Câu hỏi về code & design pattern

### Q19. RESTful API em tuân thủ thế nào?

**Trả lời mẫu:**

- Dùng **HTTP verb:** GET (read), POST (create), PUT/PATCH (update), DELETE
- **Resource-oriented URL:** `/resources/{id}`, `/users/me/favorites`
- Response chuẩn hóa: `ResponseObject { code, message, data }`
- Status code HTTP + business code (`BE0000`, `NOTI0000`…)

**Ví dụ share API:**
- `POST /resources/{id}/shares` — tạo share
- `GET /resources/{id}/shares` — list
- `DELETE /resources/{id}/shares/{user_id}` — thu hồi

---

### Q20. Repository pattern dùng để làm gì?

**Trả lời mẫu:**

Tách **truy vấn DB** khỏi **business logic**:
- `ResourceRepository` — CRUD query phức tạp
- `ResourceService` — validate, permission, gọi S3, ghi log

**Lợi ích:** Service dễ test (mock repository), đổi DB ít ảnh hưởng controller.

---

### Q21. Frontend quản lý state thế nào?

**Trả lời mẫu:**

| Công cụ | Dùng cho |
|---------|----------|
| **Redux** | Auth state (user, token, permissions) |
| **React Query** | Cache API data, refetch |
| **AuthContext** | `hasPermission()`, `isAdmin` — dùng xuyên component |
| **Local component state** | Form, UI tạm |

---

### Q22. CORS là gì? Em cấu hình ở đâu?

**Trả lời mẫu (lý thuyết + thực tế):**

**CORS** = cơ chế browser chặn JS gọi API khác origin (vd: `localhost:5173` → `localhost:30111`).

Cấu hình trong `app.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # từ env CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Production: set `CORS_ORIGINS` đúng domain thật.

---

## 7. Triển khai & vận hành

### Q23. Em deploy production như thế nào?

**Trả lời mẫu:**

Docker Compose gồm:
- **PostgreSQL** — DB
- **MinIO** — object storage
- **API** — FastAPI + Alembic migrate
- **Nginx** — serve SPA + reverse proxy API

Port mặc định: **1070** (nginx public). Script `deploy/deploy.sh` automate build & start.

Bootstrap admin tự tạo user + gán `AllAccess` sau migration.

---

### Q24. CI/CD có không?

**Trả lời mẫu:**

Có workflow GitHub Actions (`.github/workflows/ci-cd.yml`):
- PR/push: check import backend, build frontend
- Push main: build Docker image
- Tuỳ chọn deploy SSH lên server

---

### Q25. Bảo mật em đã làm gì?

**Trả lời mẫu (nêu cả hạn chế):**

**Đã làm:**
- JWT + HTTPS (production)
- Password hash (bcrypt — kiểm tra trong `security.py`)
- RBAC permission
- Token blacklist khi logout
- CORS whitelist
- Kiểm tra quyền download/share

**Hạn chế / cải thiện tiếp:**
- Một số secret trong code cần chuyển hết sang env
- Rate limiting, virus scan thật chưa tích hợp đầy đủ (UI security còn placeholder)
- File upload cần validate MIME/size chặt hơn

*Giảng viên thích sinh viên biết điểm yếu và hướng fix.*

---

## 8. Câu hỏi lý thuyết thường gặp

### Q26. SPA là gì?

**Trả lời:** Single Page Application — load HTML một lần, chuyển trang bằng JS (React Router), gọi API lấy data. UX mượt, giảm reload; SEO kém hơn SSR (không phải trọng tâm đồ án nội bộ).

---

### Q27. ORM là gì? Em dùng ORM nào?

**Trả lời:** Object-Relational Mapping — map class Python ↔ bảng SQL. Em dùng **SQLAlchemy 2.x** với `Mapped`, `mapped_column`, relationship. Migration bằng **Alembic**.

---

### Q28. ACID trong PostgreSQL?

**Trả lời ngắn:**
- **A**tomicity — transaction all-or-nothing
- **C**onsistency — ràng buộc DB luôn hợp lệ
- **I**solation — transaction không thấy data dở dang của nhau
- **D**urability — commit xong không mất

Ví dụ: upload file + insert DB trong cùng transaction → lỗi DB thì rollback, tránh file mồ côi.

---

### Q29. Normalization — DB em chuẩn hóa chưa?

**Trả lời mẫu:**

Chủ yếu **3NF:**
- Tách bảng lookup: `resource_stages`, `resource_platforms`, `product_types`…
- Bảng trung gian `resource_has_resource_tags` cho N-N
- Không lặp permission name trong user table → bảng `permissions` riêng

---

### Q30. MinIO / S3 dùng để làm gì?

**Trả lời:** Object storage lưu **binary file** (ảnh, APK, ISO…). API S3-compatible → dễ scale, tách metadata (PostgreSQL) và content (object store). Code fallback: đọc local `/uploads/` trước, không có thì S3.

---

## 9. Câu hỏi “khó” & cách xử lý

### Q31. Nếu 2 user cùng upload file trùng tên?

**Trả lời:** Bảng `resources` có `unique` trên `name`, `version`, `url` → DB reject duplicate. API trả business error; frontend hiển thị thông báo. Có thể cải thiện: versioning scheme `name + version` là composite logic nghiệp vụ.

---

### Q32. Tại sao không dùng WebSocket cho notification?

**Trả lời:** Notification chỉ cần **server → client** (one-way). SSE đơn giản hơn, reuse HTTP, auto reconnect. WebSocket hợp lý hơn nếu có chat 2 chiều realtime.

---

### Q33. Hệ thống chịu tải bao nhiêu user?

**Trả lời trung thực:** Đồ án chưa load test chính thức. Kiến trúc **stateless API + PostgreSQL + object storage** có thể scale horizontal API sau này. Bottleneck thường ở disk I/O upload/download — cần CDN hoặc scale MinIO.

---

### Q34. Em test như thế nào?

**Trả lời:** Backend có `tests/test_user_service.py`, pytest fixture trong `conftest.py`. Frontend test thủ công qua Swagger + UI. Hướng phát triển: thêm integration test cho auth flow và upload.

---

## 10. Kết thúc — câu hỏi mở

### Q35. Hướng phát triển tiếp theo?

**Trả lời mẫu:**

1. Hoàn thiện UI Storage, Security scan, Reports
2. Tích hợp antivirus API thật (ClamAV…)
3. Đọc file size thật từ MinIO cho statistics
4. Full-text search (Elasticsearch)
5. Audit log đầy đủ
6. Unit/E2E test coverage cao hơn

---

## 11. Checklist trước buổi phản biện

- [ ] Demo được: login → upload → xem list → download → favorite → dashboard
- [ ] Mở Swagger `/docs` nếu backend chạy local
- [ ] Vẽ được sơ đồ kiến trúc 3 khối (FE / BE / DB+Storage)
- [ ] Giải thích được JWT flow trong 1 phút
- [ ] Giải thích được 3 bảng: favorites, bookmarks, shares
- [ ] Nói rõ phần **đã làm** vs **placeholder**
- [ ] Chuẩn bị 1–2 **hạn chế** và cách khắc phục

---

## 12. Gợi ý cấu trúc 15–20 phút

| Thời gian | Nội dung |
|-----------|----------|
| 0–2 phút | Giới thiệu bài toán + giải pháp |
| 2–5 phút | Kiến trúc + công nghệ |
| 5–10 phút | Demo luồng chính (upload, phân quyền, dashboard) |
| 10–18 phút | Giảng viên hỏi — trả lời theo doc này |
| 18–20 phút | Kết luận + hướng phát triển |

---

**Chúc buổi phản biện thuận lợi.**
