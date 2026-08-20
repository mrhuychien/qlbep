# Sổ Bếp

App quản lý bếp ăn ship bán lẻ. Chủ bếp đi chợ mỗi sáng, chốt hôm nay nấu món gì,
đăng Zalo/Facebook, khách gọi đặt, tự ship, thu tiền ngay.

App trả lời 3 câu:

1. Hôm qua / tháng này lãi bao nhiêu — số thật, không phải cảm giác
2. Món nào đang ăn lỗ
3. Món nào hay nấu dư (đổ đi = mất tiền), món nào hay hết sớm (mất doanh thu)

Ràng buộc thiết kế: **nhập liệu hằng ngày dưới 5 phút**, trên điện thoại, ngoài
chợ sóng yếu.

## Chạy local

```bash
npm install
cp .env.local.example .env.local   # điền 2 biến Supabase
npm run dev                        # http://localhost:3000
```

## Chuẩn bị Supabase (làm một lần)

Chạy trong **SQL Editor** theo đúng thứ tự:

| # | File | Nội dung |
|---|---|---|
| 1 | `sql/schema.sql` | 13 bảng, trigger, view `v_gia_von_mon_ngay` / `v_waste_mon`, `fn_pnl`, RLS |
| 2 | `sql/seed_nguyen_lieu.sql` | 160 nguyên liệu mẫu — **file đang trống, chờ bản gốc** |
| 3 | `sql/fn_tao_bep.sql` | `fn_tao_bep(ten, dia_chi, sdt)` — tạo bếp + copy nguyên liệu mẫu |
| 4 | `sql/storage_anh_cho.sql` | Bucket `anh-cho` (private) + 3 policy phân quyền theo `bep_id` |

Rồi:

- **Authentication → Providers** → bật Email
- **Authentication → URL Configuration** → đặt `Site URL` = domain thật, và thêm
  domain đó vào `Redirect URLs`. Magic link dùng `window.location.origin`, domain
  nào không có trong danh sách này thì bấm link xong sẽ **không vào được app**.
- **Settings → API** → copy `Project URL` và `anon public` key vào `.env.local`

## Deploy

App là static export (`out/`), chạy được trên mọi static host.

### Vercel

Import repo → giữ preset **Next.js** (đừng đổi Output Directory, Vercel tự hiểu
`output: 'export'`) → khai 2 biến `NEXT_PUBLIC_SUPABASE_URL` và
`NEXT_PUBLIC_SUPABASE_ANON_KEY` cho **cả 3 môi trường** → Deploy.

`vercel.json` đã đặt sẵn `Cache-Control` cho `sw.js` / `workbox-*.js` / `manifest.json`
để người dùng không kẹt bản cũ sau mỗi lần deploy.

> ⚠️ `NEXT_PUBLIC_*` được nhúng vào bundle **lúc build**. Thêm hoặc sửa biến xong
> phải **Redeploy**, F5 không ăn thua.

> ⚠️ Preview deployment có domain ngẫu nhiên. Muốn đăng nhập được trên preview,
> thêm pattern `https://*.vercel.app/**` vào `Redirect URLs` của Supabase.

### Cloudflare Pages

```bash
npm run build        # sinh thư mục out/
```

Build command `npm run build`, output directory `out`, khai 2 biến `NEXT_PUBLIC_*`.
Headers tương đương đặt ở file `public/_headers` (chưa tạo — Cloudflare không đọc
`vercel.json`).

## Giao diện — hệ NPP Portal

Port design language của **NPP Portal** sang Tailwind (không bê nguyên stylesheet
vanilla, sẽ đánh nhau với Tailwind).

- **Nền gradient đổi theo 4 mùa** + 2 vệt glow ở góc. Lần đầu tự chọn theo tháng
  (lịch VN: 4/2→4/5 Xuân · 5/5→6/8 Hạ · 7/8→6/11 Thu · còn lại Đông), sau đó nhớ
  lựa chọn tay trong `localStorage`. Đổi mùa mượt 0.6s.
- **Lớp mùa đặt trên khung `.app-mua`, KHÔNG đặt trên `<body>`** — body để cho
  trình duyệt và thư viện khác.
- Header 56px + bottom-nav 64px **kính mờ** (`backdrop-filter: blur(20px)`).
- **ViewBanner** nền tối slate + "quả cầu" màu mùa mờ ở góc phải, mở đầu mỗi màn.
- Nhịp lặp khắp app: **nhãn nhỏ IN HOA mờ / giá trị to đậm** (class `.nhan`).
- Nút chính, tab đang chọn, link nhấn, focus ring đều lấy `--mua-*`.
  Màu **ngữ nghĩa** (success/danger/warning/info) **cố định** — nó báo trạng thái,
  đổi theo mùa là nói dối.

> ⚠️ 4 class `.mua-xuan/.mua-ha/.mua-thu/.mua-dong` được ghép động
> (`` `mua-${mua}` ``) nên Tailwind không quét thấy chuỗi literal. Chúng phải nằm
> **ngoài `@layer`** trong `globals.css` (kèm `safelist` trong config), nếu không
> sẽ bị tree-shake mất và app chạy nguyên màu mặc định **mà không báo lỗi gì**.

Font vẫn là **Be Vietnam Pro** thay vì Inter của NPP — thiết kế riêng cho tiếng
Việt, đủ dấu. Doc của NPP cũng cho phép đổi font khi port.

## Kiến trúc

- **Next.js 14 App Router + `output: 'export'`** — không SSR, không API route, không
  edge function. App nằm sau đăng nhập nên không cần SEO; mọi query đi thẳng từ
  browser tới Supabase, **RLS lo bảo mật**.
- **Toàn bộ lệnh gọi Supabase nằm trong `lib/queries.ts`**. Component không tự gọi.
- **Offline** (`lib/offline-queue.ts`): chỉ xếp hàng thao tác **ghi đè trọn dữ liệu**
  (phiếu chợ), nên gửi lại nhiều lần vẫn ra một kết quả. Thao tác cần đọc trạng thái
  server (trừ suất, kiểm tồn) thì phải chờ mạng và nói rõ lý do.
- **PWA**: `next-pwa` sinh service worker; việc đăng ký làm tay ở
  `components/dang-ky-sw.tsx` vì next-pwa 5.6 chỉ vá entry của Pages Router.

## Ba khái niệm nghiệp vụ

**Phân loại A/B trên nguyên liệu**
`A` = có kiểm kê (gạo, dầu, gas, đồ khô, gia vị) → giá vốn tính theo
*tồn đầu + mua − tồn cuối*. `B` = không kiểm kê (rau, thịt cá tươi) → mua là tính
chi phí luôn.

**Phân bổ chợ theo món**
Mỗi dòng `phieu_cho_ct` có `mon_an_id` nullable. Gán món = chi phí trực tiếp; để
trống = chi phí chung, view tự phân bổ theo tỷ trọng. **Không có bảng recipe.**

**Ghi chợ chỉ bằng số tiền**
Mặc định mỗi dòng chợ chỉ hỏi **số tiền** ("Dầu, gia vị — 80k"). Bấm *Theo &lt;đvt&gt;*
để mở chế độ chi tiết (số lượng × đơn giá) khi cần nhớ giá.
`phieu_cho_ct.so_luong` và `don_gia` đều `not null` và `thanh_tien` là cột
generated, nên dòng gọn lưu theo quy ước **`so_luong = 1`, `don_gia` = số tiền**.
Khi tải lại, dòng có `so_luong = 1` được mở lại ở chế độ gọn.
⚠️ Hệ quả: trigger `trg_pcct_after` ghi `nguyen_lieu.gia_gan_nhat = don_gia`, nên
sau một dòng gọn thì "giá gần nhất" của nguyên liệu đó là **tổng tiền lần mua**
chứ không phải giá mỗi đơn vị. Gợi ý giá và cảnh báo lệch >30% vì thế chỉ hiện
ở chế độ chi tiết.

**Ảnh giấy chợ**
Bucket `anh-cho` là **private**, không có URL công khai. Muốn xem lại phải xin
link ký tạm (`createSignedUrls`, sống 1 giờ) — xem `components/cho/xem-anh.tsx`.
Đường dẫn file: `<bep_id>/<ngay>/<timestamp>-<rand>.<ext>`; thư mục cấp 1 chính
là `bep_id` và policy trong `sql/storage_anh_cho.sql` phân quyền dựa vào đó.

**Waste**
`thuc_don_ngay.sl_du` nhập tay lúc chốt tối = số suất nấu ra mà không bán được.
Nguồn lỗ lớn nhất của mô hình này.

## Cấu trúc

```
app/            7 route: / · /login · /cho · /menu · /ban · /khach · /so-sach
components/     ui/ (shadcn) · shell/ (header, nav, đổi mùa) · npp/ (banner, KPI) · thư mục theo màn
lib/            supabase · queries · format · goi-y · ky · mua · offline-queue · context
sql/            schema · seed · fn_tao_bep · storage_anh_cho
scripts/        gen-icons.mjs (sinh icon PWA, không cần dep ngoài)
```
