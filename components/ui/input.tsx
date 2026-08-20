import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Focus ring = glow mùa (border-color season-1 + ring 3px season-glow). */
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    // text-base = 16px: dưới mức này iOS tự zoom khi focus
    className={cn(
      'flex h-tap w-full rounded-sm border border-input bg-card px-3 py-2 text-base transition-shadow',
      'placeholder:text-text-3 focus:outline-none focus:border-primary',
      'focus:shadow-[0_0_0_3px_var(--mua-glow)] disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
