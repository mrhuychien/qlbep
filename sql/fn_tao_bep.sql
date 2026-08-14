-- ═══════════════════════════════════════════════════════════════
--  SỔ BẾP — fn_tao_bep
--  Chạy SAU schema.sql và SAU seed_nguyen_lieu.sql.
--
--  ⚠️ GHI CHÚ CHO NGƯỜI ĐẶT HÀNG:
--  Coder Pack mô tả fn_tao_bep(ten, dia_chi, sdt) nằm sẵn trong bộ SQL,
--  nhưng function này KHÔNG có trong schema.sql được gửi — nhiều khả
--  năng nó nằm trong seed_nguyen_lieu.sql (file chưa được gửi).
--  File này là bản dựng lại đúng mô tả trong pack ("tạo bếp mới + copy 160
--  nguyên liệu mẫu") để M0 chạy được. Khi có file gốc, chạy đè file gốc lên
--  là xong — có drop ở dưới nên không kẹt vì lệch tên tham số.
--
--  Giữ NGUYÊN tên tham số (ten, dia_chi, sdt) vì đó chính là API mà
--  PostgREST dùng để khớp lời gọi .rpc() từ app.
-- ═══════════════════════════════════════════════════════════════

drop function if exists fn_tao_bep(text, text, text);

create function fn_tao_bep(ten text, dia_chi text default null, sdt text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
-- KHÔNG dùng "#variable_conflict use_variable" ở đây.
-- Tham số tên `ten` trùng tên cột `ten` của nhiều bảng; use_variable sẽ thay
-- CẢ identifier `ten` nằm trong "on conflict (bep_id, ten)" bằng giá trị tham
-- số, biến mệnh đề đó thành hằng số và Postgres báo:
--   "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification"
-- Cách an toàn: copy tham số ra biến cục bộ ngay từ DECLARE rồi chỉ dùng biến
-- cục bộ, và chỉ định conflict bằng TÊN RÀNG BUỘC thay vì tên cột.
declare
  v_ten     text := btrim(ten);
  v_dia_chi text := nullif(btrim(coalesce(dia_chi, '')), '');
  v_sdt     text := nullif(btrim(coalesce(sdt, '')), '');
  v_uid     uuid := auth.uid();
  v_bep     uuid;
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;
  if v_ten is null or v_ten = '' then
    raise exception 'Tên bếp không được để trống';
  end if;

  insert into bep (ten, dia_chi, sdt)
  values (v_ten, v_dia_chi, v_sdt)
  returning id into v_bep;

  -- Người tạo là chủ bếp. Phải insert ngay: mọi policy RLS khác dựa vào bảng này.
  insert into bep_user (bep_id, user_id, vai_tro)
  values (v_bep, v_uid, 'chu');

  -- Copy danh mục nguyên liệu mẫu để đi chợ được ngay từ ngày đầu
  insert into nguyen_lieu (
    bep_id, global_id, ten, nhom, dvt_cho, dvt_chuan, he_so_quy_doi, yield_pct, phan_loai
  )
  select v_bep, g.id, g.ten, g.nhom, g.dvt_cho, g.dvt_chuan, g.he_so_quy_doi, g.yield_pct, g.phan_loai_goi_y
    from nguyen_lieu_global g
  on conflict on constraint nguyen_lieu_bep_id_ten_key do nothing;

  return v_bep;
end $$;

revoke all on function fn_tao_bep(text, text, text) from public;
grant execute on function fn_tao_bep(text, text, text) to authenticated;
