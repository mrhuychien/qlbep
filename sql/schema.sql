-- ═══════════════════════════════════════════════════════════════
--  SỔ BẾP — SCHEMA v1.0
--  Postgres / Supabase · Multi-tenant qua RLS
--  Chạy trong Supabase SQL Editor theo đúng thứ tự file này.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ───────────────────────────────────────────────────────────────
-- 0. ENUMS
-- ───────────────────────────────────────────────────────────────

create type phan_loai_nl  as enum ('A', 'B');
create type nhom_nl       as enum ('thit','thuy_san','rau_cu','trai_cay','gia_vi','do_kho','dau_mo','khac');
create type nhom_mon      as enum ('man','canh','rau','com_bun','trang_mieng','khac');
create type kenh_dat_e    as enum ('zalo','facebook','dien_thoai','truc_tiep','khac');
create type trang_thai_don_e as enum ('moi','dang_giao','hoan_thanh','huy');
create type loai_chi_phi_e   as enum ('gas','dien_nuoc','luong','mat_bang','xang_xe','bao_bi','thue_phi','khac');
create type vai_tro_e     as enum ('chu','bep','ban_hang');

-- ───────────────────────────────────────────────────────────────
-- 1. TENANT
-- ───────────────────────────────────────────────────────────────

create table bep (
  id          uuid primary key default uuid_generate_v4(),
  ten         text not null,
  dia_chi     text,
  sdt         text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table bep_user (
  id        uuid primary key default uuid_generate_v4(),
  bep_id    uuid not null references bep(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  vai_tro   vai_tro_e not null default 'chu',
  created_at timestamptz not null default now(),
  unique (bep_id, user_id)
);

create index idx_bep_user_user on bep_user(user_id);

-- Helper cho RLS. SECURITY DEFINER để tránh đệ quy policy trên chính bep_user.
create or replace function auth_bep_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select bep_id from bep_user where user_id = auth.uid();
$$;

-- ───────────────────────────────────────────────────────────────
-- 2. DANH MỤC NGUYÊN LIỆU (2 tầng)
-- ───────────────────────────────────────────────────────────────

-- Tầng global: dùng chung mọi bếp, chỉ đọc. Đây là "moat" khi bán ra ngoài.
create table nguyen_lieu_global (
  id              serial primary key,
  ten             text not null unique,
  nhom            nhom_nl not null,
  dvt_cho         text not null,          -- cách chợ bán: mớ, bó, con, kg, chai
  dvt_chuan       text not null,          -- kg / l / cái
  he_so_quy_doi   numeric(10,3) not null default 1,  -- 1 dvt_cho = X dvt_chuan
  yield_pct       numeric(5,2)  not null default 100, -- % còn lại sau sơ chế
  phan_loai_goi_y phan_loai_nl not null default 'B'
);

create table nguyen_lieu (
  id            uuid primary key default uuid_generate_v4(),
  bep_id        uuid not null references bep(id) on delete cascade,
  global_id     integer references nguyen_lieu_global(id),
  ten           text not null,
  nhom          nhom_nl not null default 'khac',
  dvt_cho       text not null default 'kg',
  dvt_chuan     text not null default 'kg',
  he_so_quy_doi numeric(10,3) not null default 1,
  yield_pct     numeric(5,2)  not null default 100,
  phan_loai     phan_loai_nl not null default 'B',   -- A = có kiểm kê, B = tính chi phí ngay
  gia_gan_nhat  numeric(14,2),                        -- giá/dvt_cho lần mua gần nhất
  ngay_gia      date,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (bep_id, ten)
);

create index idx_nl_bep on nguyen_lieu(bep_id) where active;
create index idx_nl_phan_loai on nguyen_lieu(bep_id, phan_loai) where active;

-- ───────────────────────────────────────────────────────────────
-- 3. GHI CHỢ
-- ───────────────────────────────────────────────────────────────

create table mon_an (
  id                uuid primary key default uuid_generate_v4(),
  bep_id            uuid not null references bep(id) on delete cascade,
  ten               text not null,
  nhom              nhom_mon not null default 'man',
  gia_ban_mac_dinh  numeric(14,2),
  lan_cuoi_nau      date,
  so_lan_nau        integer not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (bep_id, ten)
);

create index idx_mon_bep on mon_an(bep_id) where active;

create table phieu_cho (
  id            uuid primary key default uuid_generate_v4(),
  bep_id        uuid not null references bep(id) on delete cascade,
  ngay          date not null default current_date,
  nguoi_di_cho  text,
  tong_tien     numeric(14,2) not null default 0,  -- cache, trigger cập nhật
  anh_url       text[],
  ghi_chu       text,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

create index idx_pc_bep_ngay on phieu_cho(bep_id, ngay desc);

create table phieu_cho_ct (
  id              uuid primary key default uuid_generate_v4(),
  bep_id          uuid not null references bep(id) on delete cascade,  -- denormalized cho RLS
  phieu_id        uuid not null references phieu_cho(id) on delete cascade,
  nguyen_lieu_id  uuid not null references nguyen_lieu(id),
  so_luong        numeric(12,3) not null,            -- theo dvt_cho
  don_gia         numeric(14,2) not null,            -- đồng / dvt_cho
  thanh_tien      numeric(14,2) generated always as (so_luong * don_gia) stored,
  mon_an_id       uuid references mon_an(id),        -- NULL = chi phí chung, phân bổ sau
  ghi_chu         text
);

create index idx_pcct_phieu on phieu_cho_ct(phieu_id);
create index idx_pcct_mon on phieu_cho_ct(bep_id, mon_an_id);

-- ───────────────────────────────────────────────────────────────
-- 4. THỰC ĐƠN NGÀY  ← bảng trung tâm của mô hình "nấu gì bán nấy"
-- ───────────────────────────────────────────────────────────────

create table thuc_don_ngay (
  id          uuid primary key default uuid_generate_v4(),
  bep_id      uuid not null references bep(id) on delete cascade,
  ngay        date not null default current_date,
  mon_an_id   uuid not null references mon_an(id),
  ten_mon     text not null,                    -- snapshot, tên có thể đổi sau
  gia_ban     numeric(14,2) not null,
  sl_du_kien  numeric(10,2) not null,           -- số suất nấu
  sl_ban      numeric(10,2) not null default 0, -- cache từ don_hang_ct
  sl_du       numeric(10,2),                    -- nhập tay lúc chốt tối = WASTE
  da_chot     boolean not null default false,
  thu_tu      integer not null default 0,
  ghi_chu     text,
  unique (bep_id, ngay, mon_an_id)
);

create index idx_tdn_bep_ngay on thuc_don_ngay(bep_id, ngay desc);

-- ───────────────────────────────────────────────────────────────
-- 5. KHÁCH HÀNG + ĐƠN HÀNG
-- ───────────────────────────────────────────────────────────────

create table khach_hang (
  id            uuid primary key default uuid_generate_v4(),
  bep_id        uuid not null references bep(id) on delete cascade,
  sdt           text not null,
  ten           text not null,
  dia_chi       text,
  ghi_chu       text,
  lan_dau_dat   date,
  lan_cuoi_dat  date,
  tong_don      integer not null default 0,
  tong_tien     numeric(14,2) not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (bep_id, sdt)
);

create index idx_kh_bep_sdt on khach_hang(bep_id, sdt);
create index idx_kh_lan_cuoi on khach_hang(bep_id, lan_cuoi_dat desc);

create table don_hang (
  id                  uuid primary key default uuid_generate_v4(),
  bep_id              uuid not null references bep(id) on delete cascade,
  ngay                date not null default current_date,
  ma_don              text,
  khach_hang_id       uuid references khach_hang(id),
  ten_khach           text,                       -- snapshot (khách vãng lai không cần tạo hồ sơ)
  sdt_khach           text,
  dia_chi_giao        text,
  kenh_dat            kenh_dat_e not null default 'zalo',
  tong_hang           numeric(14,2) not null default 0,  -- cache từ CT
  phi_ship_thu_khach  numeric(14,2) not null default 0,
  giam_gia            numeric(14,2) not null default 0,
  tong_thanh_toan     numeric(14,2) generated always as
                        (tong_hang + phi_ship_thu_khach - giam_gia) stored,
  da_thu              boolean not null default true,
  trang_thai          trang_thai_don_e not null default 'hoan_thanh',
  nguoi_ship          text,
  ghi_chu             text,
  created_at          timestamptz not null default now()
);

create index idx_dh_bep_ngay on don_hang(bep_id, ngay desc);
create index idx_dh_khach on don_hang(khach_hang_id);

create table don_hang_ct (
  id            uuid primary key default uuid_generate_v4(),
  bep_id        uuid not null references bep(id) on delete cascade,
  don_hang_id   uuid not null references don_hang(id) on delete cascade,
  thuc_don_id   uuid references thuc_don_ngay(id),
  ten_mon       text not null,
  so_luong      numeric(10,2) not null,
  don_gia       numeric(14,2) not null,
  thanh_tien    numeric(14,2) generated always as (so_luong * don_gia) stored
);

create index idx_dhct_don on don_hang_ct(don_hang_id);
create index idx_dhct_td on don_hang_ct(thuc_don_id);

-- ───────────────────────────────────────────────────────────────
-- 6. CHI PHÍ KHÁC + KIỂM KÊ
-- ───────────────────────────────────────────────────────────────

create table chi_phi_khac (
  id          uuid primary key default uuid_generate_v4(),
  bep_id      uuid not null references bep(id) on delete cascade,
  ngay        date not null default current_date,
  loai        loai_chi_phi_e not null,
  dien_giai   text,
  so_tien     numeric(14,2) not null,
  ghi_chu     text,
  created_at  timestamptz not null default now()
);

create index idx_cpk_bep_ngay on chi_phi_khac(bep_id, ngay desc);

create table kiem_ke (
  id          uuid primary key default uuid_generate_v4(),
  bep_id      uuid not null references bep(id) on delete cascade,
  ngay        date not null default current_date,
  tong_gia_tri numeric(14,2) not null default 0,
  da_chot     boolean not null default false,
  ghi_chu     text,
  created_at  timestamptz not null default now(),
  unique (bep_id, ngay)
);

create table kiem_ke_ct (
  id              uuid primary key default uuid_generate_v4(),
  bep_id          uuid not null references bep(id) on delete cascade,
  kiem_ke_id      uuid not null references kiem_ke(id) on delete cascade,
  nguyen_lieu_id  uuid not null references nguyen_lieu(id),
  so_luong        numeric(12,3) not null,     -- theo dvt_cho
  don_gia         numeric(14,2) not null,
  gia_tri         numeric(14,2) generated always as (so_luong * don_gia) stored
);

create index idx_kkct_kk on kiem_ke_ct(kiem_ke_id);

-- ───────────────────────────────────────────────────────────────
-- 7. TRIGGERS
-- ───────────────────────────────────────────────────────────────

-- 7.1 Cập nhật tổng tiền phiếu chợ + giá gần nhất của nguyên liệu
create or replace function trg_pcct_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_phieu uuid;
begin
  v_phieu := coalesce(new.phieu_id, old.phieu_id);

  update phieu_cho p
     set tong_tien = coalesce((select sum(thanh_tien) from phieu_cho_ct where phieu_id = v_phieu), 0)
   where p.id = v_phieu;

  if tg_op <> 'DELETE' then
    update nguyen_lieu nl
       set gia_gan_nhat = new.don_gia,
           ngay_gia     = (select ngay from phieu_cho where id = new.phieu_id)
     where nl.id = new.nguyen_lieu_id
       and (nl.ngay_gia is null
            or nl.ngay_gia <= (select ngay from phieu_cho where id = new.phieu_id));
  end if;

  return null;
end $$;

create trigger t_pcct_after
after insert or update or delete on phieu_cho_ct
for each row execute function trg_pcct_after();

-- 7.2 Cập nhật tổng đơn hàng + số suất đã bán trên thực đơn ngày
create or replace function trg_dhct_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_don uuid; v_td uuid;
begin
  v_don := coalesce(new.don_hang_id, old.don_hang_id);

  update don_hang d
     set tong_hang = coalesce((select sum(thanh_tien) from don_hang_ct where don_hang_id = v_don), 0)
   where d.id = v_don;

  foreach v_td in array array_remove(array[new.thuc_don_id, old.thuc_don_id], null) loop
    update thuc_don_ngay t
       set sl_ban = coalesce((
             select sum(c.so_luong)
               from don_hang_ct c
               join don_hang d on d.id = c.don_hang_id
              where c.thuc_don_id = v_td
                and d.trang_thai <> 'huy'), 0)
     where t.id = v_td;
  end loop;

  return null;
end $$;

create trigger t_dhct_after
after insert or update or delete on don_hang_ct
for each row execute function trg_dhct_after();

-- 7.3 Cập nhật thống kê khách hàng
create or replace function trg_dh_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_kh uuid;
begin
  foreach v_kh in array array_remove(array[new.khach_hang_id, old.khach_hang_id], null) loop
    update khach_hang k set
      tong_don     = (select count(*) from don_hang where khach_hang_id = v_kh and trang_thai <> 'huy'),
      tong_tien    = coalesce((select sum(tong_thanh_toan) from don_hang where khach_hang_id = v_kh and trang_thai <> 'huy'), 0),
      lan_dau_dat  = (select min(ngay) from don_hang where khach_hang_id = v_kh and trang_thai <> 'huy'),
      lan_cuoi_dat = (select max(ngay) from don_hang where khach_hang_id = v_kh and trang_thai <> 'huy')
    where k.id = v_kh;
  end loop;
  return null;
end $$;

create trigger t_dh_after
after insert or update or delete on don_hang
for each row execute function trg_dh_after();

-- 7.4 Cập nhật tổng giá trị kiểm kê
create or replace function trg_kkct_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_kk uuid;
begin
  v_kk := coalesce(new.kiem_ke_id, old.kiem_ke_id);
  update kiem_ke k
     set tong_gia_tri = coalesce((select sum(gia_tri) from kiem_ke_ct where kiem_ke_id = v_kk), 0)
   where k.id = v_kk;
  return null;
end $$;

create trigger t_kkct_after
after insert or update or delete on kiem_ke_ct
for each row execute function trg_kkct_after();

-- ───────────────────────────────────────────────────────────────
-- 8. VIEW & FUNCTION NGHIỆP VỤ
-- ───────────────────────────────────────────────────────────────

-- 8.1 Giá vốn từng món theo ngày.
--     Chi phí trực tiếp = dòng chợ đã gán món.
--     Chi phí chung (mon_an_id NULL) phân bổ theo tỷ trọng chi phí trực tiếp.
create or replace view v_gia_von_mon_ngay as
with truc_tiep as (
  select p.bep_id, p.ngay, c.mon_an_id, sum(c.thanh_tien) as cp_truc_tiep
    from phieu_cho_ct c
    join phieu_cho p on p.id = c.phieu_id
   where c.mon_an_id is not null
   group by p.bep_id, p.ngay, c.mon_an_id
),
chung as (
  select p.bep_id, p.ngay, sum(c.thanh_tien) as cp_chung
    from phieu_cho_ct c
    join phieu_cho p on p.id = c.phieu_id
   where c.mon_an_id is null
   group by p.bep_id, p.ngay
),
tong as (
  select bep_id, ngay, sum(cp_truc_tiep) as tong_truc_tiep
    from truc_tiep group by bep_id, ngay
)
select
  t.bep_id,
  t.ngay,
  t.mon_an_id,
  td.ten_mon,
  td.sl_du_kien,
  td.sl_ban,
  td.sl_du,
  td.gia_ban,
  t.cp_truc_tiep,
  round(coalesce(ch.cp_chung, 0) * (t.cp_truc_tiep / nullif(tg.tong_truc_tiep, 0)), 0) as cp_phan_bo,
  round((t.cp_truc_tiep + coalesce(ch.cp_chung, 0) * (t.cp_truc_tiep / nullif(tg.tong_truc_tiep, 0)))
        / nullif(td.sl_du_kien, 0), 0) as gia_von_suat,
  round(100.0 * (t.cp_truc_tiep + coalesce(ch.cp_chung, 0) * (t.cp_truc_tiep / nullif(tg.tong_truc_tiep, 0)))
        / nullif(td.sl_du_kien * td.gia_ban, 0), 1) as food_cost_pct
from truc_tiep t
join tong tg  on tg.bep_id = t.bep_id and tg.ngay = t.ngay
left join chung ch on ch.bep_id = t.bep_id and ch.ngay = t.ngay
left join thuc_don_ngay td
       on td.bep_id = t.bep_id and td.ngay = t.ngay and td.mon_an_id = t.mon_an_id;

-- 8.2 Báo cáo waste theo món
create or replace view v_waste_mon as
select
  td.bep_id, td.ngay, td.mon_an_id, td.ten_mon,
  td.sl_du_kien, td.sl_ban, coalesce(td.sl_du, 0) as sl_du,
  round(100.0 * coalesce(td.sl_du, 0) / nullif(td.sl_du_kien, 0), 1) as ty_le_du_pct,
  case when td.sl_ban >= td.sl_du_kien then true else false end as het_som,
  round(coalesce(td.sl_du, 0) * coalesce(gv.gia_von_suat, 0), 0) as tien_do_di
from thuc_don_ngay td
left join v_gia_von_mon_ngay gv
       on gv.bep_id = td.bep_id and gv.ngay = td.ngay and gv.mon_an_id = td.mon_an_id
where td.da_chot;

-- 8.3 P&L theo kỳ.
--     Giá vốn = chi nhóm B nguyên + (tồn đầu A + mua A − tồn cuối A)
create or replace function fn_pnl(p_bep uuid, p_tu date, p_den date)
returns table (
  doanh_thu     numeric,
  chi_nhom_b    numeric,
  mua_nhom_a    numeric,
  ton_dau_a     numeric,
  ton_cuoi_a    numeric,
  gia_von       numeric,
  chi_phi_khac_ numeric,
  lai_gop       numeric,
  lai_rong      numeric,
  food_cost_pct numeric
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_dt numeric; v_b numeric; v_a numeric;
  v_td numeric; v_tc numeric; v_cp numeric; v_gv numeric;
begin
  select coalesce(sum(tong_thanh_toan), 0) into v_dt
    from don_hang
   where bep_id = p_bep and ngay between p_tu and p_den and trang_thai <> 'huy';

  select
    coalesce(sum(c.thanh_tien) filter (where nl.phan_loai = 'B'), 0),
    coalesce(sum(c.thanh_tien) filter (where nl.phan_loai = 'A'), 0)
  into v_b, v_a
    from phieu_cho_ct c
    join phieu_cho p  on p.id = c.phieu_id
    join nguyen_lieu nl on nl.id = c.nguyen_lieu_id
   where p.bep_id = p_bep and p.ngay between p_tu and p_den;

  -- tồn đầu: kiểm kê đã chốt gần nhất TRƯỚC ngày bắt đầu
  select coalesce(tong_gia_tri, 0) into v_td
    from kiem_ke
   where bep_id = p_bep and da_chot and ngay < p_tu
   order by ngay desc limit 1;

  -- tồn cuối: kiểm kê đã chốt gần nhất trong kỳ (tính từ cuối)
  select coalesce(tong_gia_tri, 0) into v_tc
    from kiem_ke
   where bep_id = p_bep and da_chot and ngay between p_tu and p_den
   order by ngay desc limit 1;

  v_td := coalesce(v_td, 0);
  v_tc := coalesce(v_tc, v_td);  -- chưa kiểm cuối kỳ → giả định tồn không đổi

  select coalesce(sum(so_tien), 0) into v_cp
    from chi_phi_khac
   where bep_id = p_bep and ngay between p_tu and p_den;

  v_gv := v_b + (v_td + v_a - v_tc);

  return query select
    v_dt, v_b, v_a, v_td, v_tc, v_gv, v_cp,
    v_dt - v_gv,
    v_dt - v_gv - v_cp,
    round(100.0 * v_gv / nullif(v_dt, 0), 1);
end $$;

-- ───────────────────────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY
-- ───────────────────────────────────────────────────────────────

alter table bep              enable row level security;
alter table bep_user         enable row level security;
alter table nguyen_lieu      enable row level security;
alter table mon_an           enable row level security;
alter table phieu_cho        enable row level security;
alter table phieu_cho_ct     enable row level security;
alter table thuc_don_ngay    enable row level security;
alter table khach_hang       enable row level security;
alter table don_hang         enable row level security;
alter table don_hang_ct      enable row level security;
alter table chi_phi_khac     enable row level security;
alter table kiem_ke          enable row level security;
alter table kiem_ke_ct       enable row level security;
alter table nguyen_lieu_global enable row level security;

-- Danh mục global: ai đăng nhập cũng đọc được, không ai sửa
create policy p_nlg_read on nguyen_lieu_global
  for select to authenticated using (true);

-- Bảng bep: chỉ thấy bếp mình thuộc về
create policy p_bep_all on bep
  for all to authenticated
  using (id in (select auth_bep_ids()))
  with check (id in (select auth_bep_ids()));

create policy p_bepuser_read on bep_user
  for select to authenticated using (user_id = auth.uid());

-- Mọi bảng nghiệp vụ dùng chung 1 pattern qua bep_id
do $$
declare t text;
begin
  foreach t in array array[
    'nguyen_lieu','mon_an','phieu_cho','phieu_cho_ct','thuc_don_ngay',
    'khach_hang','don_hang','don_hang_ct','chi_phi_khac','kiem_ke','kiem_ke_ct'
  ] loop
    execute format($f$
      create policy p_%1$s_all on %1$I
        for all to authenticated
        using (bep_id in (select auth_bep_ids()))
        with check (bep_id in (select auth_bep_ids()));
    $f$, t);
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- HẾT SCHEMA. Chạy tiếp seed_nguyen_lieu.sql
-- ═══════════════════════════════════════════════════════════════
