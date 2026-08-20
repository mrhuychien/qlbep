'use client';

import { cn } from '@/lib/utils';

/**
 * Dải mở đầu mỗi màn: nền tối gradient slate, có "quả cầu" màu mùa mờ ở góc
 * phải, badge tròn bên phải. Đây là thứ tạo cảm giác "app" chứ không phải
 * "trang web quản trị".
 *
 * ⚠️ Chữ trên nền tối phải ép màu sáng tường minh — nếu chỉ dựa vào màu kế thừa
 * thì một ngày nào đó có ai đổi token là chữ lẫn vào nền.
 */
export function ViewBanner({
  tieuDe,
  phu,
  badge,
  className,
}: {
  tieuDe: React.ReactNode;
  phu?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-between gap-4 overflow-hidden rounded-xl p-5',
        'bg-gradient-to-br from-slate-800 to-slate-700',
        className,
      )}
    >
      {/* blob mùa mờ */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1/2 right-[-20%] h-[200%] w-[70%] rounded-full opacity-[0.18] blur-[50px] nen-mua"
      />

      <div className="relative z-10 min-w-0 flex-1">
        <div className="truncate text-[1.25rem] font-bold leading-tight tracking-[-0.01em] text-white">
          {tieuDe}
        </div>
        {phu && <div className="mt-0.5 truncate text-[0.85rem] text-white/80">{phu}</div>}
      </div>

      {badge && (
        <div className="relative z-10 shrink-0 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[0.75rem] font-semibold text-white">
          {badge}
        </div>
      )}
    </div>
  );
}
