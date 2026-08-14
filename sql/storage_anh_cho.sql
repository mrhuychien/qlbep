-- ═══════════════════════════════════════════════════════════════
--  SỔ BẾP — Storage bucket "anh-cho" (ảnh giấy đi chợ)
--  Chạy SAU schema.sql (cần hàm auth_bep_ids()).
--
--  Đường dẫn file app ghi ra:  <bep_id>/<ngay>/<timestamp>-<rand>.<ext>
--  → thư mục cấp 1 chính là bep_id, dùng nó để phân quyền.
-- ═══════════════════════════════════════════════════════════════

-- 1. Tạo bucket (private — ảnh giấy chợ có thể lộ giá vốn, không để public)
insert into storage.buckets (id, name, public)
values ('anh-cho', 'anh-cho', false)
on conflict (id) do nothing;

-- 2. Policy. Dùng auth_bep_ids() (SECURITY DEFINER) thay vì join thẳng bep_user
--    để không dính RLS lồng nhau.

drop policy if exists anh_cho_doc  on storage.objects;
drop policy if exists anh_cho_ghi  on storage.objects;
drop policy if exists anh_cho_xoa  on storage.objects;

-- Đọc: chỉ ảnh thuộc bếp mình
create policy anh_cho_doc on storage.objects
  for select to authenticated
  using (
    bucket_id = 'anh-cho'
    and (storage.foldername(name))[1] in (select b::text from auth_bep_ids() b)
  );

-- Ghi: chỉ được đẩy vào đúng thư mục bếp mình
create policy anh_cho_ghi on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'anh-cho'
    and (storage.foldername(name))[1] in (select b::text from auth_bep_ids() b)
  );

-- Xoá: chỉ ảnh của bếp mình
create policy anh_cho_xoa on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'anh-cho'
    and (storage.foldername(name))[1] in (select b::text from auth_bep_ids() b)
  );

-- ═══════════════════════════════════════════════════════════════
--  Kiểm tra nhanh sau khi chạy (đăng nhập bằng user thật rồi chạy):
--    select * from storage.buckets where id = 'anh-cho';
--    select policyname from pg_policies
--     where tablename = 'objects' and policyname like 'anh_cho%';
--  Phải ra 1 bucket và 3 policy.
-- ═══════════════════════════════════════════════════════════════
