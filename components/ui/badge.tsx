import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Pill bo tròn hoàn toàn, cặp "nền nhạt + chữ đậm cùng tông" của NPP. */
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-bold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-info-soft text-info-ink',
        secondary: 'bg-surface-2 text-text-2',
        success: 'bg-success-soft text-success-ink',
        danger: 'bg-danger-soft text-danger-ink',
        warning: 'bg-warning-soft text-warning-ink',
        mua: 'text-white nen-mua',
        outline: 'border border-border text-text-2',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
