import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Nút chính = gradient mùa, chữ trắng (chữ ký của hệ NPP)
        default: 'nen-mua text-white shadow-md hover:opacity-95',
        outline: 'border border-border bg-card text-text-2 hover:bg-surface-2',
        secondary: 'bg-surface-2 text-foreground hover:bg-border/60',
        ghost: 'text-text-2 hover:bg-surface-2',
        destructive: 'bg-danger text-white hover:bg-danger/90',
        success: 'bg-success text-white hover:bg-success/90',
        link: 'chu-mua underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-tap px-5 py-2 text-base',
        sm: 'h-10 rounded-sm px-3 text-sm',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-tap w-tap',
        iconSm: 'h-10 w-10 rounded-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
