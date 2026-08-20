import { cn } from '@/lib/utils';

/** Shimmer chạy ngang thay vì nhấp nháy — nhìn "đang tải" chứ không "hỏng". */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shimmer rounded-sm', className)} {...props} />;
}

export { Skeleton };
