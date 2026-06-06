# Database migration

Nếu gặp lỗi **`relation "users" does not exist`** hoặc bảng chưa có trong database, cần chạy migration một lần.

## Cách 1: Dùng Alembic (khuyến nghị)

1. **Đảm bảo file `.env`** có trong thư mục `back-end/` với các biến kết nối PostgreSQL:
   - `USERNAME_DB`
   - `PASSWORD_DB`
   - `HOST_DB`
   - `PORT_DB` (ví dụ `5432`)
   - `NAME_DB` (tên database)

2. **Tạo database** (nếu chưa có):
   ```bash
   # PostgreSQL: tạo database trống
   createdb -U postgres NAME_DB
   ```

3. **Chạy migration** từ thư mục `back-end`:
   ```bash
   cd back-end
   alembic -c migration/alembic.ini upgrade head
   ```
   Hoặc từ thư mục `migration`:
   ```bash
   cd back-end/migration
   alembic upgrade head
   ```

4. **(Tùy chọn)** Seed admin user (nếu có revision seed):
   ```bash
   alembic -c migration/alembic.ini upgrade head
   ```
   Revision `7e66bbf6d64c_seed_init_admin_user.py` sẽ chạy sau init_schema.

## Cách 2: Chạy trong Docker

Nếu app chạy trong container:

```bash
docker compose exec <tên-service-backend> alembic -c migration/alembic.ini upgrade head
```

Hoặc vào shell của container rồi chạy:

```bash
docker compose exec <tên-service-backend> sh
cd migration && alembic upgrade head
```

## Kiểm tra

- Sau khi chạy xong, trong database sẽ có các bảng: `users`, `permissions`, `resources`, `sessions`, `notifications`, v.v.
- Khởi động lại ứng dụng và thử đăng nhập / gọi API.

---

## Nâng một tài khoản lên Admin

Trong hệ thống, **Admin** = user có permission **AllAccess**. Để nâng một user thường lên admin:

**Cách 1: Script (khuyến nghị)**

Từ thư mục `back-end`, chạy:

```bash
cd back-end
python scripts/promote_admin.py <email_cần_nâng>
```

Ví dụ:

```bash
python scripts/promote_admin.py nhanvien@company.com
```

Script sẽ:
- Tìm user theo email
- Tạo permission `AllAccess` nếu chưa có
- Gán `AllAccess` cho user đó (ghi vào `user_has_permissions`)

**Cách 2: SQL trực tiếp**

Nếu biết `user_id` (UUID) của user cần nâng:

```sql
-- Lấy id permission AllAccess
SELECT id FROM permissions WHERE name = 'AllAccess' AND is_deleted = false;

-- Gán cho user (thay USER_ID và PERMISSION_ID bằng giá trị thực)
INSERT INTO user_has_permissions (id, user_system_id, permission_id, is_deleted)
VALUES (uuid_generate_v4(), 'USER_ID', 'PERMISSION_ID', false);
```

Hoặc gộp một câu (thay `'user@example.com'` bằng email cần nâng):

```sql
INSERT INTO user_has_permissions (id, user_system_id, permission_id, is_deleted)
SELECT uuid_generate_v4(), u.id, p.id, false
FROM users u, permissions p
WHERE u.email = 'user@example.com' AND u.is_deleted = false
  AND p.name = 'AllAccess' AND p.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM user_has_permissions uhp
    WHERE uhp.user_system_id = u.id AND uhp.permission_id = p.id AND uhp.is_deleted = false
  );
```

Sau khi chạy xong (script hoặc SQL), user đó đăng nhập lại sẽ có quyền admin (menu admin, System Info, v.v.).
