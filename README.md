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

Rồi:

- **Storage** → tạo bucket `anh-cho` (private) + policy cho `authenticated`
- **Authentication → Providers** → bật Email
- Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào `.env.local`

## Deploy Cloudflare Pages

```bash
npm run build        # sinh thư mục out/
```

Push GitHub → Cloudflare Pages → build command `npm run build`, output directory `out`.
Nhớ khai 2 biến `NEXT_PUBLIC_*` trong phần Environment variables của Pages.

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

**Waste**
`thuc_don_ngay.sl_du` nhập tay lúc chốt tối = số suất nấu ra mà không bán được.
Nguồn lỗ lớn nhất của mô hình này.

## Cấu trúc

```
app/            7 route: / · /login · /cho · /menu · /ban · /khach · /so-sach
components/     ui/ (shadcn) + thư mục theo màn
lib/            supabase · queries · format · goi-y · ky · offline-queue · context
sql/            schema · seed · fn_tao_bep
scripts/        gen-icons.mjs (sinh icon PWA, không cần dep ngoài)
```
